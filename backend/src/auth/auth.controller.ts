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
import { AuthService } from './auth.service';
import { ChangePasswordDto, LoginDto } from './dto';
import { JwtAuthGuard, OriginGuard } from '../common/guards';
import { CurrentUser } from '../common/decorators';
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
  constructor(private authService: AuthService) {}

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
    status: 200,
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
    status: 200,
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
  @ApiResponse({ status: 200, description: 'User profile retrieved successfully' })
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
    status: 200,
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
  @ApiResponse({ status: 200, description: 'Password changed, all sessions revoked' })
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
