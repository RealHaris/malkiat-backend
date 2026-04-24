import { Module } from '@nestjs/common';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

import { DI } from '@app/di.tokens';
import { ResendEmailService } from '@shared/email/resend-email.service';
import { AgenciesController } from './presentation/agencies.controller';
import { DrizzleAgencyRepository } from './infrastructure/drizzle-agency.repository';
import { AgencyInvitationsService } from './agency-invitations.service';
import { AgencyInviteExpiryListener } from './agency-invite-expiry.listener';

@Module({
  controllers: [AgenciesController],
  providers: [
    {
      provide: DI.AgencyRepository,
      inject: [DI.DrizzleDb],
      useFactory: (db: PostgresJsDatabase<any>) => new DrizzleAgencyRepository(db),
    },
    ResendEmailService,
    AgencyInvitationsService,
    AgencyInviteExpiryListener,
  ],
  exports: [DI.AgencyRepository],
})
export class AgenciesModule {}
