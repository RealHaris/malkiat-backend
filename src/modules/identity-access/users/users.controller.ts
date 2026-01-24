import { Controller, Get } from "@nestjs/common";
import {
  AllowAnonymous,
  OptionalAuth,
  Session,
  type UserSession,
} from "@thallesp/nestjs-better-auth";
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from "@nestjs/swagger";

import { API_OPERATIONS, API_RESPONSES, API_HEADERS } from "@shared/constants/api.constants";

@ApiTags("users")
@Controller("users")
export class UsersController {
  @Get("me")
  @ApiOperation(API_OPERATIONS.GET_CURRENT_USER)
  @ApiResponse(API_RESPONSES.GET_CURRENT_USER)
  @ApiHeader(API_HEADERS.AUTHORIZATION)
  me(@Session() session: UserSession) {
    return { user: session.user };
  }

  @Get("public")
  @AllowAnonymous()
  @ApiOperation(API_OPERATIONS.PUBLIC_ROUTE)
  @ApiResponse(API_RESPONSES.PUBLIC_ROUTE)
  publicRoute() {
    return { ok: true };
  }

  @Get("optional")
  @OptionalAuth()
  @ApiOperation(API_OPERATIONS.OPTIONAL_AUTH_ROUTE)
  @ApiResponse(API_RESPONSES.OPTIONAL_AUTH_ROUTE)
  optional(@Session() session?: UserSession) {
    return { authenticated: !!session };
  }
}
