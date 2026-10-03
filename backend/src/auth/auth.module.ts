import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { LoginAttemptsService } from './login-attempts.service';
import { SessionRevocationService } from './session-revocation.service';
import { JwtStrategy } from './strategies/jwt.strategy';

/**
 * AuthModule - authentication module
 * Provides JWT-based authentication with access and refresh tokens
 */
@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      // Default configuration, can be overridden per token type
      secret: process.env.JWT_ACCESS_SECRET,
      signOptions: { expiresIn: '15m' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, LoginAttemptsService, SessionRevocationService],
  exports: [AuthService],
})
export class AuthModule {}
