import { Module } from '@nestjs/common';
import { InfrastructureModule } from '@infra/infrastructure.module';
import { SharedConfigModule } from '@shared/config/config.module';
import { AppLoggerModule } from '@shared/logger/logger.module';
import { AppController } from '../app.controller';
import { AppService } from '../app.service';
import { IdentityAccessModule } from '@modules/identity-access/identity-access.module';
import { ListingManagementModule } from '@modules/listing-management/listing-management.module';

@Module({
  imports: [
    SharedConfigModule,
    AppLoggerModule,
    InfrastructureModule,
    IdentityAccessModule,
    ListingManagementModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppApiModule {}
