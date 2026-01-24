import { Controller, Get } from '@nestjs/common';
import {
  AllowAnonymous,
  OptionalAuth,
  Session,
  type UserSession,
} from '@thallesp/nestjs-better-auth';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';

@ApiTags('users')
@Controller('users')
export class UsersController {
  @Get('me')
  @ApiOperation({ summary: 'Get current user' })
  @ApiResponse({
    status: 200,
    description: 'Returns the currently authenticated user',
  })
  @ApiHeader({
    name: 'Authorization',
    description: 'Session token',
    required: true,
  })
  me(@Session() session: UserSession) {
    return { user: session.user };
  }

  @Get('public')
  @AllowAnonymous()
  @ApiOperation({ summary: 'Public route' })
  @ApiResponse({
    status: 200,
    description: 'Public endpoint, no authentication required',
  })
  publicRoute() {
    return { ok: true };
  }

  @Get('optional')
  @OptionalAuth()
  @ApiOperation({ summary: 'Optional auth route' })
  @ApiResponse({ status: 200, description: 'Returns authentication status' })
  optional(@Session() session?: UserSession) {
    return { authenticated: !!session };
  }
}
