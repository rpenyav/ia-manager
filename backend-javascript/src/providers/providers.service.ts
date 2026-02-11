import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Provider } from '../common/entities/provider.entity';
import { EncryptionService } from '../common/services/encryption.service';
import { CreateProviderDto } from './dto/create-provider.dto';
import { UpdateProviderDto } from './dto/update-provider.dto';

@Injectable()
export class ProvidersService {
  constructor(
    @InjectRepository(Provider)
    private readonly providersRepository: Repository<Provider>,
    private readonly encryptionService: EncryptionService
  ) {}

  async list(tenantId: string): Promise<Provider[]> {
    return this.providersRepository.find({ where: { tenantId } });
  }

  async create(tenantId: string, dto: CreateProviderDto): Promise<Provider> {
    const provider = this.providersRepository.create({
      tenantId,
      type: dto.type || 'openai',
      displayName: dto.displayName,
      encryptedCredentials: this.encryptionService.encrypt(dto.credentials),
      config: dto.config,
      enabled: dto.enabled ?? true
    });
    return this.providersRepository.save(provider);
  }

  async update(tenantId: string, id: string, dto: UpdateProviderDto): Promise<Provider> {
    const provider = await this.providersRepository.findOne({ where: { id, tenantId } });
    if (!provider) {
      throw new NotFoundException('Provider not found');
    }
    if (dto.credentials) {
      provider.encryptedCredentials = this.encryptionService.encrypt(dto.credentials);
    }
    if (dto.displayName) {
      provider.displayName = dto.displayName;
    }
    if (dto.config) {
      provider.config = dto.config;
    }
    if (dto.enabled !== undefined) {
      provider.enabled = dto.enabled;
    }
    return this.providersRepository.save(provider);
  }

  async getByTenantAndId(tenantId: string, id: string): Promise<Provider | null> {
    return this.providersRepository.findOne({ where: { id, tenantId } });
  }

  async getDecryptedCredentials(provider: Provider): Promise<string> {
    return this.encryptionService.decrypt(provider.encryptedCredentials);
  }
}
