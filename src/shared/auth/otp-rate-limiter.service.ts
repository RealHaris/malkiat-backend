import { Injectable, Inject } from '@nestjs/common';
import type { RedisClient } from '@infra/redis/client';
import { DI } from '@app/di.tokens';

const OTP_RATE_LIMIT_KEY_PREFIX = 'otp:ratelimit:';
const MAX_ATTEMPTS = 5;
const RATE_LIMIT_TTL_SECONDS = 24 * 60 * 60; // 24 hours

export interface OtpRateLimitResult {
  allowed: boolean;
  remainingAttempts: number;
  cooldownSeconds?: number;
  nextAllowedAt?: number;
}

@Injectable()
export class OtpRateLimiterService {
  constructor(@Inject(DI.RedisClient) private readonly redis: RedisClient) {}

  private getKey(identifier: string): string {
    const normalized = identifier.toLowerCase().trim();
    return `${OTP_RATE_LIMIT_KEY_PREFIX}${normalized}`;
  }

  async checkRateLimit(identifier: string): Promise<OtpRateLimitResult> {
    const key = this.getKey(identifier);
    const attempts = await this.redis.get(key);

    if (!attempts) {
      return {
        allowed: true,
        remainingAttempts: MAX_ATTEMPTS,
      };
    }

    const attemptCount = parseInt(attempts, 10);

    if (attemptCount >= MAX_ATTEMPTS) {
      const ttl = await this.redis.ttl(key);
      return {
        allowed: false,
        remainingAttempts: 0,
        cooldownSeconds: ttl > 0 ? ttl : RATE_LIMIT_TTL_SECONDS,
        nextAllowedAt: Date.now() + (ttl > 0 ? ttl : RATE_LIMIT_TTL_SECONDS) * 1000,
      };
    }

    return {
      allowed: true,
      remainingAttempts: MAX_ATTEMPTS - attemptCount,
    };
  }

  async recordAttempt(identifier: string): Promise<number> {
    const key = this.getKey(identifier);
    const exists = await this.redis.exists(key);

    if (!exists) {
      await this.redis.setex(key, RATE_LIMIT_TTL_SECONDS, '1');
      return 1;
    }

    const current = await this.redis.get(key);
    const newCount = (parseInt(current || '0', 10) + 1).toString();
    await this.redis.set(key, newCount);
    return parseInt(newCount, 10);
  }

  async getRemainingAttempts(identifier: string): Promise<number> {
    const key = this.getKey(identifier);
    const attempts = await this.redis.get(key);

    if (!attempts) {
      return MAX_ATTEMPTS;
    }

    const attemptCount = parseInt(attempts, 10);
    return Math.max(0, MAX_ATTEMPTS - attemptCount);
  }

  async getCooldownRemainingSeconds(identifier: string): Promise<number> {
    const key = this.getKey(identifier);
    const ttl = await this.redis.ttl(key);
    return ttl > 0 ? ttl : 0;
  }

  async resetRateLimit(identifier: string): Promise<void> {
    const key = this.getKey(identifier);
    await this.redis.del(key);
  }

  calculateBackoffSeconds(attemptCount: number): number {
    const baseDelay = 30;
    const delay = baseDelay * Math.pow(2, attemptCount - 1);
    return Math.min(delay, 3600);
  }

  getBackoffMessage(attemptCount: number): string {
    const seconds = this.calculateBackoffSeconds(attemptCount);
    if (seconds >= 3600) {
      return 'Please wait 1 hour before requesting another code.';
    }
    if (seconds >= 60) {
      const minutes = Math.floor(seconds / 60);
      return `Please wait ${minutes} minute${minutes > 1 ? 's' : ''} before requesting another code.`;
    }
    return `Please wait ${seconds} seconds before requesting another code.`;
  }
}