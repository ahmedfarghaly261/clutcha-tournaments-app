import { type CurrentUserResponseDto } from '../auth/dto/current-user-response.dto';

export type SafeUserRecord = CurrentUserResponseDto;

export const toCurrentUserResponse = (
  user: SafeUserRecord,
): CurrentUserResponseDto => ({
  id: user.id,
  email: user.email,
  displayName: user.displayName,
  role: user.role,
  status: user.status,
  emailVerifiedAt: user.emailVerifiedAt,
  createdAt: user.createdAt,
});
