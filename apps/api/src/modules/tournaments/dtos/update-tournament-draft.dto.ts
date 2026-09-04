import { PartialType } from '@nestjs/swagger';
import { CreateTournamentDto } from './create-tournament.dto';

export class UpdateTournamentDraftDto extends PartialType(
  CreateTournamentDto,
) {}
