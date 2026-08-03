import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, UserRole } from '@clutcha/database';
import { DatabaseService } from '../../database/database.service';
import { type UpdateCaptainProfileDto } from './dto/update-captain-profile.dto';
import { toCaptainProfileResponse } from './mappers/captain-profile.mapper';

const captainProfileSelect = {
  id: true,
  email: true,
  displayName: true,
  phoneNumber: true,
  discordUsername: true,
  role: true,
  status: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

type CaptainProfileMutableData = Pick<
  Prisma.UserUpdateInput,
  'displayName' | 'phoneNumber' | 'discordUsername'
>;

@Injectable()
export class CaptainsService {
  constructor(private readonly databaseService: DatabaseService) {}

  async getProfile(userId: string) {
    const captain = await this.findCaptainOrThrow(userId);

    return toCaptainProfileResponse(captain);
  }

  async updateProfile(userId: string, dto: UpdateCaptainProfileDto) {
    await this.findCaptainOrThrow(userId);

    const captain = await this.databaseService.client.user.update({
      where: { id: userId },
      data: this.toUpdateData(dto),
      select: captainProfileSelect,
    });

    return toCaptainProfileResponse(captain);
  }

  private async findCaptainOrThrow(userId: string) {
    const captain = await this.databaseService.client.user.findFirst({
      where: {
        id: userId,
        role: UserRole.CAPTAIN,
      },
      select: captainProfileSelect,
    });

    if (!captain) {
      throw new NotFoundException('Captain profile was not found');
    }

    return captain;
  }

  private toUpdateData(
    dto: UpdateCaptainProfileDto,
  ): CaptainProfileMutableData {
    return {
      displayName: dto.displayName,
      phoneNumber: dto.phoneNumber,
      discordUsername: dto.discordUsername,
    };
  }
}
