import { Injectable, Inject, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { APP_ENV } from '@shared/config/config.constants';
import type { AppEnv } from '@shared/config/env';
import { AgencyInvitationsService } from './agency-invitations.service';

const INVITE_KEY_PREFIX = 'invite:token:';

/**
 * Subscribes to Redis keyspace expiry events.
 * When an invite:token:* key expires, clears the tokenHash in DB so the
 * invite row shows as "token expired" — the audit row is never deleted.
 *
 * Requires Redis keyspace notifications enabled:
 *   redis-cli CONFIG SET notify-keyspace-events KEx
 */
@Injectable()
export class AgencyInviteExpiryListener implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AgencyInviteExpiryListener.name);
  private subscriber: Redis | null = null;

  constructor(
    @Inject(APP_ENV) private readonly env: AppEnv,
    private readonly invitationsService: AgencyInvitationsService,
  ) {}

  async onModuleInit() {
    if (!this.env.REDIS_URL) {
      this.logger.warn('REDIS_URL not set — invite expiry listener disabled');
      return;
    }

    try {
      // Dedicated subscriber connection (cannot share with the main client)
      this.subscriber = new Redis(this.env.REDIS_URL);

      await this.subscriber.subscribe('__keyevent@0__:expired');

      this.subscriber.on('message', (_channel: string, key: string) => {
        if (!key.startsWith(INVITE_KEY_PREFIX)) return;
        const tokenHash = key.slice(INVITE_KEY_PREFIX.length);
        this.invitationsService
          .handleTokenExpiry(tokenHash)
          .catch((err) => this.logger.error(`Failed to handle token expiry for ${tokenHash}`, err));
      });

      this.logger.log('✅ Agency invite expiry listener active');
    } catch (err) {
      this.logger.error('Failed to start invite expiry listener', err);
    }
  }

  async onModuleDestroy() {
    if (this.subscriber) {
      await this.subscriber.unsubscribe('__keyevent@0__:expired');
      this.subscriber.disconnect();
      this.subscriber = null;
    }
  }
}
