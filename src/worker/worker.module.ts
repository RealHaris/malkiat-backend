import { Module } from '@nestjs/common';

import { InfrastructureModule } from '@infra/infrastructure.module';
import { ListingEventsWorkerProvider } from './listing-events.worker.provider';

@Module({
  imports: [InfrastructureModule],
  providers: [ListingEventsWorkerProvider],
})
export class WorkerModule {}
