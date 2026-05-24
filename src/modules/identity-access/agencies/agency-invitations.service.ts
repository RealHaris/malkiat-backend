import { randomBytes, createHash } from 'crypto';
import { Injectable, Inject } from '@nestjs/common';
import type { RedisClient } from '@infra/redis/client';
import { DI } from '@app/di.tokens';
import { ResendEmailService } from '@shared/email/resend-email.service';
import { APP_ENV } from '@shared/config/config.constants';
import type { AppEnv } from '@shared/config/env';
import { DrizzleAgencyRepository } from './infrastructure/drizzle-agency.repository';

const INVITE_TOKEN_TTL_SECONDS = 72 * 60 * 60; // 72 hours

export type InviteTokenPayload = {
  inviteId: string;
  agencyId: string;
  inviteeEmail: string;
};

@Injectable()
export class AgencyInvitationsService {
  private readonly appPublicUrl: string;

  constructor(
    @Inject(DI.AgencyRepository) private readonly agencyRepo: DrizzleAgencyRepository,
    private readonly emailService: ResendEmailService,
    @Inject(APP_ENV) private readonly env: AppEnv,
    @Inject(DI.RedisClient) private readonly redis: RedisClient,
  ) {
    this.appPublicUrl = env.APP_PUBLIC_URL ?? 'http://localhost:3001';
  }

  async storeTokenInRedis(
    tokenHash: string,
    payload: InviteTokenPayload,
  ): Promise<void> {
    const key = `invite:${tokenHash}`;
    await this.redis.setex(key, INVITE_TOKEN_TTL_SECONDS, JSON.stringify(payload));
  }

  async deleteTokenFromRedis(tokenHash: string): Promise<void> {
    const key = `invite:${tokenHash}`;
    await this.redis.del(key);
  }

  generateToken(): string {
    return randomBytes(32).toString('hex');
  }

  hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  async sendInvitationEmail(opts: {
    to: string;
    agencyName: string;
    inviterName: string;
    role: string;
    token: string;
    agencyId: string;
  }): Promise<void> {
    const acceptUrl = `${this.appPublicUrl}/invitations/accept?token=${opts.token}&agencyId=${opts.agencyId}`;

    const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>You're invited to join ${opts.agencyName}</title>
</head>
<body style="margin:0;padding:0;background:#f4f5f7;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f5f7;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%);padding:40px 48px 32px;">
              <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;letter-spacing:-0.5px;">Malkiat</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Real Estate Platform</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px 48px 32px;">
              <h2 style="margin:0 0 16px;color:#111827;font-size:22px;font-weight:700;">You're invited to join an agency</h2>
              <p style="margin:0 0 24px;color:#4b5563;font-size:15px;line-height:1.6;">
                <strong style="color:#111827;">${opts.inviterName}</strong> has invited you to join
                <strong style="color:#6366f1;">${opts.agencyName}</strong> as a
                <strong style="color:#111827;">${opts.role}</strong>.
              </p>
              <p style="margin:0 0 32px;color:#4b5563;font-size:15px;line-height:1.6;">
                Click the button below to accept the invitation. This link expires in <strong>72 hours</strong>.
              </p>
              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%);border-radius:8px;">
                    <a href="${acceptUrl}"
                       style="display:inline-block;padding:14px 36px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;letter-spacing:0.2px;">
                      Accept Invitation →
                    </a>
                  </td>
                </tr>
              </table>
              <!-- Divider -->
              <hr style="border:none;border-top:1px solid #e5e7eb;margin:36px 0;" />
              <p style="margin:0 0 8px;color:#6b7280;font-size:13px;">Or copy and paste this URL into your browser:</p>
              <p style="margin:0;color:#6366f1;font-size:13px;word-break:break-all;">
                <a href="${acceptUrl}" style="color:#6366f1;text-decoration:none;">${acceptUrl}</a>
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 48px;background:#f9fafb;border-top:1px solid #e5e7eb;">
              <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6;">
                If you didn't expect this invitation, you can safely ignore this email.
                This invite was sent to <strong>${opts.to}</strong>.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    await this.emailService.send({
      to: opts.to,
      subject: `You're invited to join ${opts.agencyName} on Malkiat`,
      html,
    });
  }

  async handleTokenExpiry(tokenHash: string): Promise<void> {
    await this.agencyRepo.clearInvitationToken(tokenHash, 'expired');
  }

  /**
   * Issue a new token: generate and hash, return raw token.
   * Caller writes tokenHash + expiresAt to DB.
   */
  async issueToken(): Promise<string> {
    return this.generateToken();
  }

  /**
   * Revoke a token: clear token in DB.
   */
  async revokeToken(tokenHash: string): Promise<void> {
    await this.agencyRepo.clearInvitationToken(tokenHash, 'revoked');
  }

  /**
   * Validate a token from an accept request.
   * Fetches the invite by tokenHash from DB and checks expiry.
   */
  async validateToken(rawToken: string): Promise<{
    payload: InviteTokenPayload;
    tokenHash: string;
  } | null> {
    const tokenHash = this.hashToken(rawToken);

    // Primary check: Redis (fast, no DB)
    const cached = await this.redis.get(`invite:${tokenHash}`);
    if (cached) {
      return { payload: JSON.parse(cached) as InviteTokenPayload, tokenHash };
    }

    // Secondary check: DB (survives Redis restarts)
    const invite = await this.agencyRepo.getInvitationByTokenHash(tokenHash);
    if (!invite || invite.expiresAt === null) return null;
    if (new Date() > invite.expiresAt) return null;

    return {
      payload: {
        inviteId: invite.id,
        agencyId: invite.agencyId,
        inviteeEmail: invite.inviteeEmail ?? '',
      },
      tokenHash,
    };
  }

  expiresAt(): Date {
    return new Date(Date.now() + INVITE_TOKEN_TTL_SECONDS * 1000);
  }
}
