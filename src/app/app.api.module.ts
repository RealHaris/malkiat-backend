import { Module } from '@nestjs/common';
import { InfrastructureModule } from '@infra/infrastructure.module';
import { SharedConfigModule } from '@shared/config/config.module';
import { AppLoggerModule } from '@shared/logger/logger.module';
import { IdentityAccessModule } from '@modules/identity-access/identity-access.module';
import { ListingManagementModule } from '@modules/listing-management/listing-management.module';
import { ListingDiscoveryModule } from '@modules/listing-discovery/listing-discovery.module';

@Module({
  imports: [
    SharedConfigModule,
    AppLoggerModule,
    InfrastructureModule,
    IdentityAccessModule,
    ListingManagementModule,
    ListingDiscoveryModule,
  ],
  controllers: [],
  providers: [],
})
export class AppApiModule {}
