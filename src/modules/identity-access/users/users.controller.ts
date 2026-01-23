import { Controller, Get } from '@nestjs/common';
import {
  AllowAnonymous,
  OptionalAuth,
  Session,
  type UserSession,
} from '@thallesp/nestjs-better-auth';

@Controller('users')
export class UsersController {
  @Get('me')
  me(@Session() session: UserSession) {
    return { user: session.user };
  }

  @Get('public')
  @AllowAnonymous()
  publicRoute() {
    return { ok: true };
  }

  @Get('optional')
  @OptionalAuth()
  optional(@Session() session?: UserSession) {
    return { authenticated: !!session };
  }
}
