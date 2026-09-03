import type { UserRole } from '@prisma/client';

/** Claims carried by an access token. `sub` is the user id, per JWT convention. */
export type JwtPayload = {
  sub: string;
  email: string;
  role: UserRole;
};

/** What JwtAuthGuard attaches to the request once a token verifies. */
export type AuthenticatedUser = {
  id: string;
  email: string;
  role: UserRole;
};
