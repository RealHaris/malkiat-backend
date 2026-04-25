import { Module, MiddlewareConsumer, RequestMethod, Inject, type NestModule } from '@nestjs/common';
import { BullBoardModule } from '@bull-board/nestjs';
import { ExpressAdapter } from '@bull-board/express';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { DI } from '@app/di.tokens';
import { APP_ENV } from '@shared/config/config.constants';
import type { AppEnv } from '@shared/config/env';

@Module({
  imports: [
    BullBoardModule.forRoot({
      route: '/admin/queues',
      adapter: ExpressAdapter,
    }),
    BullBoardModule.forFeature({
      name: 'listing-events',
      adapter: BullMQAdapter,
    }),
  ],
  providers: [
    {
      provide: 'BullQueue_listing-events',
      useExisting: DI.ListingEventsQueue,
    },
  ],
})
export class BullmqDashboardModule implements NestModule {
  constructor(@Inject(APP_ENV) private readonly env: AppEnv) {}

  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply((req: any, res: any, next: () => void) => {
        const auth = { user: this.env.BULLMQ_DASHBOARD_USER, pass: this.env.BULLMQ_DASHBOARD_PASSWORD };
        const b64auth = (req.headers.authorization || '').split(' ')[1] || '';
        const [user, pass] = Buffer.from(b64auth, 'base64').toString().split(':');

        if (!user || !pass || user !== auth.user || pass !== auth.pass) {
          res.set('WWW-Authenticate', 'Basic realm="401"');
          res.status(401).send('Authentication required.');
          return;
        }

        next();
      })
      .forRoutes(
        { path: '/admin/queues', method: RequestMethod.ALL },
        { path: '/admin/queues/*path', method: RequestMethod.ALL }
      );
  }
}
