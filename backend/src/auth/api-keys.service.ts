import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { Repository } from 'typeorm';
import { ApiKey } from '../common/entities/api-key.entity';

@Injectable()
export class ApiKeysService {
  private readonly salt: string;

  constructor(
    @InjectRepository(ApiKey)
    private readonly apiKeysRepository: Repository<ApiKey>
  ) {
    const salt = process.env.API_KEY_SALT || '';
    if (salt.length < 16) {
      throw new Error('API_KEY_SALT must be at least 16 characters');
    }
    this.salt = salt;
  }

  private hash(value: string): string {
    return scryptSync(value, this.salt, 32).toString('hex');
  }

  async create(name: string, tenantId?: string) {
    const plainKey = randomBytes(32).toString('hex');
    const apiKey = this.apiKeysRepository.create({
      name,
      tenantId: tenantId ?? null,
      hashedKey: this.hash(plainKey)
    });
    await this.apiKeysRepository.save(apiKey);

    return {
      id: apiKey.id,
      name: apiKey.name,
      tenantId: apiKey.tenantId,
      apiKey: plainKey
    };
  }

  async list(tenantId?: string) {
    const where = tenantId ? { tenantId } : {};
    return this.apiKeysRepository.find({ where });
  }

  async revoke(id: string) {
    const apiKey = await this.apiKeysRepository.findOne({ where: { id } });
    if (!apiKey) {
      return null;
    }
    apiKey.status = 'revoked';
    return this.apiKeysRepository.save(apiKey);
  }

  async rotate(id: string) {
    const apiKey = await this.apiKeysRepository.findOne({ where: { id } });
    if (!apiKey) {
      return null;
    }
    const plainKey = randomBytes(32).toString('hex');
    apiKey.hashedKey = this.hash(plainKey);
    apiKey.status = 'active';
    await this.apiKeysRepository.save(apiKey);
    return {
      id: apiKey.id,
      name: apiKey.name,
      tenantId: apiKey.tenantId,
      apiKey: plainKey
    };
  }

  async validate(apiKey: string) {
    const computed = this.hash(apiKey);
    const record = await this.apiKeysRepository.findOne({ where: { hashedKey: computed, status: 'active' } });
    if (!record) {
      return null;
    }
    const match = timingSafeEqual(Buffer.from(record.hashedKey, 'hex'), Buffer.from(computed, 'hex'));
    if (!match) {
      return null;
    }
    return record;
  }
}
