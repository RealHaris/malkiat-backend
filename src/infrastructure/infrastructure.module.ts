import { Global, Module } from '@nestjs/common';
import { DrizzleDbProvider } from '@infra/db/drizzle/provider';
import { RedisClientProvider } from '@infra/redis/provider';
import { TypesenseClientProvider } from '@infra/typesense/provider';

@Global()
@Module({
  providers: [
    DrizzleDbProvider,
    RedisClientProvider,
    TypesenseClientProvider,
  ],
  exports: [
    DrizzleDbProvider,
    RedisClientProvider,
    TypesenseClientProvider,
  ],
})
export class InfrastructureModule {}
