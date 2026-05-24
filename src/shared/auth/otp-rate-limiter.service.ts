import { Injectable } from '@nestjs/common';

const OTP_RATE_LIMIT_KEY_PREFIX = 'otp:ratelimit:';
const MAX_ATTEMPTS = 5;
const RATE_LIMIT_TTL_SECONDS = 24 * 60 * 60;

interface RateLimitEntry {
  count: number;
  expiresAt: number;
}

export interface OtpRateLimitResult {
  allowed: boolean;
  remainingAttempts: number;
  cooldownSeconds?: number;
  nextAllowedAt?: number;
}

@Injectable()
export class OtpRateLimiterService {
  private store = new Map<string, RateLimitEntry>();

  private getKey(identifier: string): string {
    const normalized = identifier.toLowerCase().trim();
    return `${OTP_RATE_LIMIT_KEY_PREFIX}${normalized}`;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.expiresAt <= now) {
        this.store.delete(key);
      }
    }
  }

  async checkRateLimit(identifier: string): Promise<OtpRateLimitResult> {
    this.cleanup();
    const key = this.getKey(identifier);
    const entry = this.store.get(key);

    if (!entry) {
      return {
        allowed: true,
        remainingAttempts: MAX_ATTEMPTS,
      };
    }

    if (entry.count >= MAX_ATTEMPTS) {
      const cooldown = Math.max(0, Math.ceil((entry.expiresAt - Date.now()) / 1000));
      return {
        allowed: false,
        remainingAttempts: 0,
        cooldownSeconds: cooldown,
        nextAllowedAt: entry.expiresAt,
      };
    }

    return {
      allowed: true,
      remainingAttempts: MAX_ATTEMPTS - entry.count,
    };
  }

  async recordAttempt(identifier: string): Promise<number> {
    this.cleanup();
    const key = this.getKey(identifier);
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || entry.expiresAt <= now) {
      this.store.set(key, { count: 1, expiresAt: now + RATE_LIMIT_TTL_SECONDS * 1000 });
      return 1;
    }

    entry.count += 1;
    return entry.count;
  }

  async getRemainingAttempts(identifier: string): Promise<number> {
    this.cleanup();
    const key = this.getKey(identifier);
    const entry = this.store.get(key);
    if (!entry) return MAX_ATTEMPTS;
    return Math.max(0, MAX_ATTEMPTS - entry.count);
  }

  async getCooldownRemainingSeconds(identifier: string): Promise<number> {
    this.cleanup();
    const key = this.getKey(identifier);
    const entry = this.store.get(key);
    if (!entry) return 0;
    const remaining = Math.ceil((entry.expiresAt - Date.now()) / 1000);
    return remaining > 0 ? remaining : 0;
  }

  async resetRateLimit(identifier: string): Promise<void> {
    const key = this.getKey(identifier);
    this.store.delete(key);
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
