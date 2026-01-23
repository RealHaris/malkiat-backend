import { Module } from '@nestjs/common';
import { IdentityAccessAuthModule } from './auth/auth.module';
import { UsersController } from './users/users.controller';

@Module({
  imports: [IdentityAccessAuthModule],
  controllers: [UsersController],
})
export class IdentityAccessModule {}
