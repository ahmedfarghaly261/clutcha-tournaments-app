import { type AuthenticatedUser } from './types/authenticated-user.type';
import { type CurrentUserResponseDto } from './dto/current-user-response.dto';

export const toAuthenticatedUser = (
  user: CurrentUserResponseDto,
  sessionId: string,
): AuthenticatedUser => ({
  id: user.id,
  email: user.email,
  displayName: user.displayName,
  role: user.role,
  status: user.status,
  sessionId,
});
