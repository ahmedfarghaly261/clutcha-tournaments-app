import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import { DatabaseService } from './database.service';
import { DatabaseHealthResponseDto } from './dto/database-health-response.dto';
import { Public } from '../modules/auth/decorators/public.decorator';

@ApiTags('Database')
@Public()
@Controller('database')
export class DatabaseController {
  constructor(private readonly databaseService: DatabaseService) {}

  @Get('health')
  @ApiOperation({
    summary: 'Check database connectivity',
    description:
      'Checks whether the CLUTCHA API can communicate with PostgreSQL.',
  })
  @ApiOkResponse({
    description: 'The database connection is healthy.',
    type: DatabaseHealthResponseDto,
  })
  @ApiServiceUnavailableResponse({
    description: 'The database cannot currently be reached.',
  })
  async health(): Promise<DatabaseHealthResponseDto> {
    try {
      await this.databaseService.healthCheck();

      return {
        status: 'ok',
        database: 'connected',
      };
    } catch {
      throw new ServiceUnavailableException(
        'Database connection is unavailable',
      );
    }
  }
}
