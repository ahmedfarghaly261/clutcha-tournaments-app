import { type UserRole, type UserStatus } from '@clutcha/database';

export type AuthenticatedUser = {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  status: UserStatus;
  sessionId: string;
};
