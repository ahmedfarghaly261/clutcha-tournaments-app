import { Global, Module } from '@nestjs/common';
import { DATABASE_CLIENT } from './database.constants';
import { DatabaseController } from './database.controller';
import { DatabaseService } from './database.service';

@Global()
@Module({
  controllers: [DatabaseController],
  providers: [
    DatabaseService,
    {
      provide: DATABASE_CLIENT,
      inject: [DatabaseService],
      useFactory: (databaseService: DatabaseService) => databaseService.client,
    },
  ],
  exports: [DatabaseService, DATABASE_CLIENT],
})
export class DatabaseModule {}
