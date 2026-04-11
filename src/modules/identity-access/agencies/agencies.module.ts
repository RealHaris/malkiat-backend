import { Module } from '@nestjs/common';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

import { DI } from '@app/di.tokens';
import { AgenciesController } from './presentation/agencies.controller';
import { DrizzleAgencyRepository } from './infrastructure/drizzle-agency.repository';

@Module({
  controllers: [AgenciesController],
  providers: [
    {
      provide: DI.AgencyRepository,
      inject: [DI.DrizzleDb],
      useFactory: (db: PostgresJsDatabase<any>) => new DrizzleAgencyRepository(db),
    },
  ],
  exports: [DI.AgencyRepository],
})
export class AgenciesModule {}
