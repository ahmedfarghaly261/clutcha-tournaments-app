import { type UserRole } from '@clutcha/database';

export type AccessTokenPayload = {
  sub: string;
  sessionId: string;
  role: UserRole;
  type: 'access';
};
