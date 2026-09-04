import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, ArrayUnique, IsArray, IsUUID } from 'class-validator';

export class GenerateOrganizerBracketDto {
  @ApiProperty({
    description:
      'Every approved team id in seed order. The first id is seed 1. The API validates that the list exactly matches the approved tournament teams.',
    example: [
      '2df149ea-a859-4553-a87a-c6cf5bbdb5b8',
      '8f42c1fc-5ef8-45d0-8730-f5cdd7c967c7',
    ],
    type: String,
    isArray: true,
    minItems: 2,
    uniqueItems: true,
  })
  @IsArray()
  @ArrayMinSize(2)
  @ArrayUnique()
  @IsUUID('4', { each: true })
  orderedTeamIds!: string[];
}
