import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { AuthenticatedUser } from '../auth.types.js';

/**
 * Reads the user that JwtAuthGuard attached to the request. Safe to use only on
 * guarded routes — on a @Public one there is nothing to read.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUser => {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: AuthenticatedUser }>();

    return request.user as AuthenticatedUser;
  },
);
