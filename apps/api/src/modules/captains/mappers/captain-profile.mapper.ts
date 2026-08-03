import { type UserRole, type UserStatus } from '@clutcha/database';
import { type CaptainProfileResponseDto } from '../dto/captain-profile-response.dto';

export type CaptainProfileRecord = {
  id: string;
  email: string;
  displayName: string;
  phoneNumber: string | null;
  discordUsername: string | null;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
};

export const toCaptainProfileResponse = (
  captain: CaptainProfileRecord,
): CaptainProfileResponseDto => ({
  id: captain.id,
  displayName: captain.displayName,
  email: captain.email,
  phoneNumber: captain.phoneNumber,
  discordUsername: captain.discordUsername,
  role: captain.role,
  status: captain.status,
  profileComplete: Boolean(captain.phoneNumber),
  team: null,
  createdAt: captain.createdAt,
});
