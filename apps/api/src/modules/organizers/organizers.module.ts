import { Module } from '@nestjs/common';
import { OrganizerProfileImageStorageService } from './organizer-profile-image-storage.service';
import { OrganizersController } from './organizers.controller';
import { OrganizersService } from './organizers.service';

@Module({
  controllers: [OrganizersController],
  providers: [OrganizersService, OrganizerProfileImageStorageService],
})
export class OrganizersModule {}
