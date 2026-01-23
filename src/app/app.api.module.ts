import { Module } from '@nestjs/common';
import { SharedConfigModule } from '../shared/config/config.module';
import { AppController } from '../app.controller';
import { AppService } from '../app.service';

@Module({
  imports: [SharedConfigModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppApiModule {}
