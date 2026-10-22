import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Res,
  Req,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiCookieAuth,
} from '@nestjs/swagger';
import {
  LoginResponseDto,
  MeResponseDto,
  MessageResponseDto,
  RecoveryCodesResponseDto,
  RefreshResponseDto,
  TwoFactorSetupResponseDto,
} from '../common/dto';
import { AuthService } from './auth.service';
import { ChangePasswordDto, LoginDto } from './dto';
import { DisableTwoFactorDto, EnableTwoFactorDto, VerifyTwoFactorDto } from './two-factor/dto';
import { TwoFactorService } from './two-factor/two-factor.service';
import { JwtAuthGuard, OriginGuard, RolesGuard } from '../common/guards';
import { CurrentUser, Roles } from '../common/decorators';
import { Role } from '@prisma/client';
import { AuthUser } from './interfaces/auth-user.interface';

/** The refresh cookie is only ever needed by /api/auth/*, so the browser must not attach it to other API calls */
const REFRESH_COOKIE_PATH = '/api/auth';
const REFRESH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

/** Cookies set before the path restriction lived on '/'; they are removed on the next login/refresh/logout */
const LEGACY_REFRESH_COOKIE = { path: '/' };

function refreshCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path: REFRESH_COOKIE_PATH,
    maxAge: REFRESH_COOKIE_MAX_AGE,
  };
}

/**
 * AuthController - handles authentication endpoints
 * Base path: /api/auth
 */
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private twoFactorService: TwoFactorService,
  ) {}

  /**
   * Login user
   * POST /api/auth/login
   * Rate limit: 10 requests per minute
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({
    status: 200, type: LoginResponseDto,
    description: 'User successfully logged in. Refresh token set in httpOnly cookie.',
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto, req.headers['user-agent']);

    // Second factor on: no session yet, so no cookie either
    if ('twoFactorRequired' in result) return result;

    return this.sendSession(result, res);
  }

  /**
   * Second login step: the challenge token from the password step and a code from the authenticator app
   * (or a recovery code). Answers like a normal login.
   * POST /api/auth/2fa/verify
   */
  @Post('2fa/verify')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Finish a login that needs the second factor' })
  @ApiResponse({ status: 200, type: LoginResponseDto, description: 'Logged in. Refresh token set in httpOnly cookie.' })
  @ApiResponse({ status: 401, description: 'Wrong or reused code, or the challenge expired' })
  @ApiResponse({ status: 429, description: 'Too many wrong codes' })
  async verifyTwoFactor(
    @Body() dto: VerifyTwoFactorDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.loginWithSecondFactor(dto, req.headers['user-agent']);
    return this.sendSession(result, res);
  }

  /**
   * Start enabling the second factor: returns the secret and a QR code (ADMIN only)
   * POST /api/auth/2fa/setup
   */
  @Post('2fa/setup')
  @UseGuards(OriginGuard, JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Start enabling two-factor login (ADMIN only)' })
  @ApiResponse({ status: 200, type: TwoFactorSetupResponseDto, description: 'Secret and QR code; the factor is not on yet' })
  @ApiResponse({ status: 409, description: 'Already enabled' })
  @ApiResponse({ status: 503, description: 'The server has no TOTP_ENCRYPTION_KEY' })
  setupTwoFactor(@CurrentUser() user: AuthUser) {
    return this.twoFactorService.setup(user.id, user.email);
  }

  /**
   * Finish enabling with the first code; returns the one-time recovery codes (ADMIN only)
   * POST /api/auth/2fa/enable
   */
  @Post('2fa/enable')
  @UseGuards(OriginGuard, JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Confirm the setup with a code and get recovery codes (ADMIN only)' })
  @ApiResponse({ status: 200, type: RecoveryCodesResponseDto, description: 'Enabled. The recovery codes are shown only now.' })
  @ApiResponse({ status: 400, description: 'No setup started, or a wrong code' })
  async enableTwoFactor(@CurrentUser() user: AuthUser, @Body() dto: EnableTwoFactorDto) {
    return { recoveryCodes: await this.twoFactorService.enable(user.id, dto.code) };
  }

  /**
   * Turn the second factor off; needs the password and a code (ADMIN only)
   * POST /api/auth/2fa/disable
   */
  @Post('2fa/disable')
  @UseGuards(OriginGuard, JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Turn two-factor login off (ADMIN only)' })
  @ApiResponse({ status: 200, type: MessageResponseDto, description: 'Disabled' })
  @ApiResponse({ status: 400, description: 'Wrong password, or the factor is not on' })
  @ApiResponse({ status: 401, description: 'Wrong code' })
  async disableTwoFactor(@CurrentUser() user: AuthUser, @Body() dto: DisableTwoFactorDto) {
    await this.twoFactorService.disable(user.id, dto.password, dto.code);
    return { message: 'Двухфакторная защита отключена' };
  }

  /** Cookie of a new session and the public part of the login result (never the refresh token itself) */
  private sendSession(
    result: { user: { id: number; email: string; role: Role }; accessToken: string; refreshToken: string },
    res: Response,
  ) {
    // Set refresh token in httpOnly cookie
    res.cookie('refreshToken', result.refreshToken, refreshCookieOptions());
    res.clearCookie('refreshToken', LEGACY_REFRESH_COOKIE);

    // The role is no longer mirrored into a JS-readable cookie (anyone could edit it); drop the old one
    res.clearCookie('userRole');

    // Return only accessToken and user data (not refreshToken)
    return {
      user: result.user,
      accessToken: result.accessToken,
    };
  }

  /**
   * Refresh access token using httpOnly cookie
   * POST /api/auth/refresh
   */
  @Post('refresh')
  @UseGuards(OriginGuard)
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiCookieAuth('refreshToken')
  @ApiOperation({ summary: 'Refresh access token using httpOnly cookie' })
  @ApiResponse({
    status: 200, type: RefreshResponseDto,
    description: 'Access token refreshed successfully. New refresh token set in cookie.',
  })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies['refreshToken'];
    const result = await this.authService.refresh(refreshToken, req.headers['user-agent']);

    // Set new refresh token in httpOnly cookie
    res.cookie('refreshToken', result.refreshToken, refreshCookieOptions());
    res.clearCookie('refreshToken', LEGACY_REFRESH_COOKIE);

    // Return only new accessToken (not refreshToken)
    return {
      accessToken: result.accessToken,
    };
  }

  /**
   * Get current user profile
   * GET /api/auth/me
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, type: MeResponseDto, description: 'User profile retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMe(@CurrentUser() user: AuthUser) {
    return this.authService.getMe(user.id);
  }

  /**
   * Logout user
   * POST /api/auth/logout
   */
  @Post('logout')
  @UseGuards(OriginGuard, JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({
    status: 200, type: MessageResponseDto,
    description: 'User logged out successfully. Refresh token cookie cleared.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async logout(
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    // Clear auth cookies
    res.clearCookie('refreshToken', { path: REFRESH_COOKIE_PATH });
    res.clearCookie('refreshToken', LEGACY_REFRESH_COOKIE);
    res.clearCookie('userRole');

    return this.authService.logout(user.id, req.cookies['refreshToken']);
  }

  /**
   * Change own password; every session of the user is revoked, so the client must log in again
   * POST /api/auth/change-password
   */
  @Post('change-password')
  @UseGuards(OriginGuard, JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change own password and sign out everywhere' })
  @ApiResponse({ status: 200, type: MessageResponseDto, description: 'Password changed, all sessions revoked' })
  @ApiResponse({ status: 400, description: 'Wrong current password or invalid new password' })
  @ApiResponse({ status: 429, description: 'Too many attempts' })
  async changePassword(
    @CurrentUser() user: AuthUser,
    @Body() dto: ChangePasswordDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.changePassword(user.id, dto);

    res.clearCookie('refreshToken', { path: REFRESH_COOKIE_PATH });
    res.clearCookie('refreshToken', LEGACY_REFRESH_COOKIE);

    return result;
  }
}
