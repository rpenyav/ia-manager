import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DbConnection } from '../common/entities/db-connection.entity';
import { EncryptionService } from '../common/services/encryption.service';
import { DbConnectionsController } from './db-connections.controller';
import { DbConnectionsService } from './db-connections.service';

@Module({
  imports: [TypeOrmModule.forFeature([DbConnection])],
  controllers: [DbConnectionsController],
  providers: [DbConnectionsService, EncryptionService],
  exports: [DbConnectionsService]
})
export class DbConnectionsModule {}
