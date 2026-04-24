import { Injectable, Inject } from '@nestjs/common';
import { Resend } from 'resend';
import { APP_ENV } from '@shared/config/config.constants';
import type { AppEnv } from '@shared/config/env';

@Injectable()
export class ResendEmailService {
  private readonly resend: Resend | null;
  private readonly fromEmail: string;

  constructor(@Inject(APP_ENV) private readonly env: AppEnv) {
    this.resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;
    this.fromEmail = env.RESEND_FROM_EMAIL;
  }

  async send(opts: { to: string; subject: string; html: string }): Promise<void> {
    if (!this.resend) {
      console.log(`[DEV] Email to ${opts.to} | Subject: ${opts.subject}`);
      return;
    }
    await this.resend.emails.send({
      from: this.fromEmail,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    });
  }
}
