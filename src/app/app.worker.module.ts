import { Module } from "@nestjs/common";
import { SharedConfigModule } from "@shared/config/config.module";
import { AppLoggerModule } from "@shared/logger/logger.module";
import { WorkerModule } from "@worker/worker.module";

@Module({
  imports: [SharedConfigModule, AppLoggerModule, WorkerModule],
})
export class AppWorkerModule {}
