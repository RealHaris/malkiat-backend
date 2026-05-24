import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Inject,
  Post,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { z } from 'zod';
import { ZodValidationPipe } from '@shared/pipes/zod-validation.pipe';
import { OtpRateLimiterService } from '@shared/auth/otp-rate-limiter.service';
import { DI } from '@app/di.tokens';

const signInWithEmailSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

type SignInWithEmailDto = z.infer<typeof signInWithEmailSchema>;

const verifyOtpSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  code: z.string().length(6, 'Code must be 6 digits'),
});

type VerifyOtpDto = z.infer<typeof verifyOtpSchema>;

@ApiTags('auth')
@Controller('auth')
export class AuthOtpController {
  constructor(
    @Inject(DI.BetterAuth) private readonly auth: any,
    private readonly otpRateLimiter: OtpRateLimiterService,
  ) {}

  @Post('sign-in/email')
  @HttpCode(200)
  @ApiOperation({ summary: 'Sign in with email OTP (rate limited)' })
  @ApiResponse({
    status: 200,
    description: 'OTP sent successfully or rate limit applied',
  })
  async signInWithEmail(
    @Body(new ZodValidationPipe(signInWithEmailSchema)) dto: SignInWithEmailDto,
  ) {
    const rateLimit = await this.otpRateLimiter.checkRateLimit(dto.email);

    if (!rateLimit.allowed) {
      const cooldown = await this.otpRateLimiter.getCooldownRemainingSeconds(dto.email);
      return {
        allowed: false,
        remainingAttempts: 0,
        cooldownSeconds: cooldown,
        nextAllowedAt: rateLimit.nextAllowedAt,
        message: `You have exceeded the maximum number of OTP requests. Please try again in ${cooldown >= 3600 ? Math.floor(cooldown / 3600) + ' hour(s)' : cooldown >= 60 ? Math.floor(cooldown / 60) + ' minute(s)' : cooldown + ' second(s)'}.`,
      };
    }

    try {
      await this.auth.api.signIn.email({
        email: dto.email,
      });

      await this.otpRateLimiter.recordAttempt(dto.email);

      const remaining = await this.otpRateLimiter.getRemainingAttempts(dto.email);

      return {
        allowed: true,
        remainingAttempts: remaining,
        message: remaining <= 2
          ? `OTP sent. ${this.otpRateLimiter.getBackoffMessage(5 - remaining)}`
          : undefined,
      };
    } catch (error: any) {
      if (error.code === 'USER_NOT_FOUND' || error.code === 'INVALID_CREDENTIALS') {
        return {
          allowed: true,
          remainingAttempts: await this.otpRateLimiter.getRemainingAttempts(dto.email),
          message: 'If this email exists, an OTP will be sent.',
        };
      }
      throw error;
    }
  }

  @Post('email/verify-otp')
  @HttpCode(200)
  @ApiOperation({ summary: 'Verify email OTP' })
  @ApiResponse({ status: 200, description: 'OTP verified successfully' })
  async verifyOtp(@Body(new ZodValidationPipe(verifyOtpSchema)) dto: VerifyOtpDto) {
    try {
      const result = await this.auth.api.signIn.emailOTP({
        email: dto.email,
        code: dto.code,
      });

      await this.otpRateLimiter.resetRateLimit(dto.email);

      return {
        success: true,
        userId: result.user?.id,
      };
    } catch (error: any) {
      if (error.code === 'INVALID_OTP' || error.code === 'EXPIRED_OTP') {
        const remaining = await this.otpRateLimiter.getRemainingAttempts(dto.email);
        throw new BadRequestException({
          message: 'Invalid or expired OTP',
          remainingAttempts: remaining,
        });
      }
      throw error;
    }
  }

  @Post('otp/rate-limit-status')
  @HttpCode(200)
  @ApiOperation({ summary: 'Get OTP rate limit status for an email' })
  @ApiResponse({
    status: 200,
    description: 'Current rate limit status',
  })
  async getRateLimitStatus(@Body(new ZodValidationPipe(signInWithEmailSchema)) dto: SignInWithEmailDto) {
    const status = await this.otpRateLimiter.checkRateLimit(dto.email);
    const cooldown = status.allowed ? 0 : await this.otpRateLimiter.getCooldownRemainingSeconds(dto.email);
    
    return {
      ...status,
      cooldownSeconds: status.allowed ? undefined : cooldown,
    };
  }

  @Post('otp/reset-rate-limit')
  @HttpCode(200)
  @ApiOperation({ summary: 'Reset OTP rate limit for an email (admin)' })
  @ApiResponse({ status: 200, description: 'Rate limit reset successfully' })
  async resetRateLimit(@Body(new ZodValidationPipe(signInWithEmailSchema)) dto: SignInWithEmailDto) {
    await this.otpRateLimiter.resetRateLimit(dto.email);
    return { success: true, message: 'Rate limit has been reset' };
  }
}