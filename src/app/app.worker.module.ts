import { Module } from '@nestjs/common';
import { SharedConfigModule } from '../shared/config/config.module';
import { WorkerModule } from '../worker/worker.module';

@Module({
  imports: [SharedConfigModule, WorkerModule],
})
export class AppWorkerModule {}
