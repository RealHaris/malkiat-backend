import { Module } from '@nestjs/common';
import { IdentityAccessAuthModule } from './auth/auth.module';
import { UsersController } from './users/users.controller';
import { AgenciesModule } from './agencies/agencies.module';

@Module({
  imports: [IdentityAccessAuthModule, AgenciesModule],
  controllers: [UsersController],
})
export class IdentityAccessModule {}
