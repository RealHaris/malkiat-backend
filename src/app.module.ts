import { Module } from '@nestjs/common';
import { AppApiModule } from './app/app.api.module';

// Legacy shim: keep AppModule pointing to the API module.
@Module({
  imports: [AppApiModule],
})
export class AppModule {}
