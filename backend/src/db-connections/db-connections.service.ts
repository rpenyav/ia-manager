import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DbConnection } from '../common/entities/db-connection.entity';
import { EncryptionService } from '../common/services/encryption.service';
import { CreateDbConnectionDto } from './dto/create-db-connection.dto';
import { UpdateDbConnectionDto } from './dto/update-db-connection.dto';

@Injectable()
export class DbConnectionsService {
  constructor(
    @InjectRepository(DbConnection)
    private readonly connectionsRepository: Repository<DbConnection>,
    private readonly encryptionService: EncryptionService
  ) {}

  async list(tenantId: string) {
    return this.connectionsRepository.find({ where: { tenantId }, order: { createdAt: 'DESC' } });
  }

  async create(tenantId: string, dto: CreateDbConnectionDto) {
    const connection = this.connectionsRepository.create({
      tenantId,
      name: dto.name,
      engine: dto.engine ?? 'mysql',
      encryptedConfig: this.encryptionService.encrypt(JSON.stringify(dto.config)),
      allowedTables: dto.allowedTables ?? [],
      readOnly: dto.readOnly ?? true,
      metadata: dto.metadata ?? {},
      enabled: dto.enabled ?? true
    });
    return this.connectionsRepository.save(connection);
  }

  async update(tenantId: string, id: string, dto: UpdateDbConnectionDto) {
    const connection = await this.connectionsRepository.findOne({ where: { id, tenantId } });
    if (!connection) {
      throw new NotFoundException('DB connection not found');
    }

    if (dto.name !== undefined) {
      connection.name = dto.name;
    }
    if (dto.engine !== undefined) {
      connection.engine = dto.engine;
    }
    if (dto.config !== undefined) {
      connection.encryptedConfig = this.encryptionService.encrypt(JSON.stringify(dto.config));
    }
    if (dto.allowedTables !== undefined) {
      connection.allowedTables = dto.allowedTables;
    }
    if (dto.readOnly !== undefined) {
      connection.readOnly = dto.readOnly;
    }
    if (dto.metadata !== undefined) {
      connection.metadata = dto.metadata;
    }
    if (dto.enabled !== undefined) {
      connection.enabled = dto.enabled;
    }

    return this.connectionsRepository.save(connection);
  }

  async getById(tenantId: string, id: string) {
    const connection = await this.connectionsRepository.findOne({ where: { id, tenantId } });
    if (!connection) {
      throw new NotFoundException('DB connection not found');
    }
    return connection;
  }

  async getDecryptedConfig(connection: DbConnection) {
    const raw = this.encryptionService.decrypt(connection.encryptedConfig);
    return JSON.parse(raw) as Record<string, unknown>;
  }
}
