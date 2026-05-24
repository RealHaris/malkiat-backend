import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { SentryModule } from '@sentry/nestjs/setup';
import { SentryGlobalFilter } from '@sentry/nestjs/setup';
import { InfrastructureModule } from '@infra/infrastructure.module';
import { SharedConfigModule } from '@shared/config/config.module';
import { AppLoggerModule } from '@shared/logger/logger.module';
import { IdentityAccessModule } from '@modules/identity-access/identity-access.module';
import { ListingManagementModule } from '@modules/listing-management/listing-management.module';
import { ListingDiscoveryModule } from '@modules/listing-discovery/listing-discovery.module';
import { UploadsModule } from '@modules/uploads/uploads.module';

@Module({
  imports: [
    SentryModule.forRoot(),
    SharedConfigModule,
    AppLoggerModule,
    InfrastructureModule,
    IdentityAccessModule,
    ListingManagementModule,
    ListingDiscoveryModule,
    UploadsModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_FILTER,
      useClass: SentryGlobalFilter,
    },
  ],
})
export class AppApiModule {}
