import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PricingModel } from '../common/entities/pricing-model.entity';
import { TenantPricing } from '../common/entities/tenant-pricing.entity';
import { CreatePricingDto } from './dto/create-pricing.dto';
import { UpdatePricingDto } from './dto/update-pricing.dto';

@Injectable()
export class PricingService {
  constructor(
    @InjectRepository(PricingModel)
    private readonly pricingRepository: Repository<PricingModel>,
    @InjectRepository(TenantPricing)
    private readonly tenantPricingRepository: Repository<TenantPricing>
  ) {}

  async list() {
    return this.pricingRepository.find({ order: { providerType: 'ASC', model: 'ASC' } });
  }

  async create(dto: CreatePricingDto) {
    const item = this.pricingRepository.create({
      providerType: this.normalizeProviderType(dto.providerType),
      model: dto.model,
      inputCostPer1k: dto.inputCostPer1k,
      outputCostPer1k: dto.outputCostPer1k,
      enabled: dto.enabled ?? true
    });
    return this.pricingRepository.save(item);
  }

  async update(id: string, dto: UpdatePricingDto) {
    const item = await this.pricingRepository.findOne({ where: { id } });
    if (!item) {
      throw new NotFoundException('Pricing entry not found');
    }
    Object.assign(item, dto);
    if (dto.providerType) {
      item.providerType = this.normalizeProviderType(dto.providerType);
    }
    return this.pricingRepository.save(item);
  }

  async resolve(providerType: string, model: string) {
    const normalized = this.normalizeProviderType(providerType);
    const exact = await this.pricingRepository.findOne({
      where: { providerType: normalized, model, enabled: true }
    });
    if (exact) {
      return exact;
    }

    return this.pricingRepository.findOne({
      where: { providerType: normalized, model: '*', enabled: true }
    });
  }

  async resolveForTenant(tenantId: string, providerType: string, model: string) {
    const normalized = this.normalizeProviderType(providerType);
    const baseQuery = this.pricingRepository
      .createQueryBuilder('pricing')
      .innerJoin(
        TenantPricing,
        'tp',
        'tp.pricingId = pricing.id AND tp.tenantId = :tenantId',
        { tenantId }
      )
      .where('pricing.providerType = :providerType', { providerType: normalized })
      .andWhere('pricing.enabled = :enabled', { enabled: true });

    const exact = await baseQuery
      .clone()
      .andWhere('pricing.model = :model', { model })
      .getOne();
    if (exact) {
      return exact;
    }

    return baseQuery
      .clone()
      .andWhere('pricing.model = :model', { model: '*' })
      .getOne();
  }

  calculateCost(entry: PricingModel | null, tokensIn: number, tokensOut: number) {
    if (!entry) {
      return 0;
    }
    const input = (tokensIn / 1000) * Number(entry.inputCostPer1k);
    const output = (tokensOut / 1000) * Number(entry.outputCostPer1k);
    return Number((input + output).toFixed(6));
  }

  async upsertByModel(entry: {
    providerType: string;
    model: string;
    inputCostPer1k: number;
    outputCostPer1k: number;
  }) {
    const providerType = this.normalizeProviderType(entry.providerType);
    const existing = await this.pricingRepository.findOne({
      where: { providerType, model: entry.model }
    });

    if (existing) {
      existing.inputCostPer1k = entry.inputCostPer1k;
      existing.outputCostPer1k = entry.outputCostPer1k;
      existing.enabled = true;
      return this.pricingRepository.save(existing);
    }

    const created = this.pricingRepository.create({
      providerType,
      model: entry.model,
      inputCostPer1k: entry.inputCostPer1k,
      outputCostPer1k: entry.outputCostPer1k,
      enabled: true
    });

    return this.pricingRepository.save(created);
  }

  private normalizeProviderType(providerType: string) {
    const normalized = providerType.toLowerCase();
    if (['azure', 'azure_openai', 'azure-openai'].includes(normalized)) {
      return 'azure-openai';
    }
    if (['aws', 'bedrock', 'aws-bedrock'].includes(normalized)) {
      return 'aws-bedrock';
    }
    if (['google', 'gcp', 'vertex', 'vertex-ai'].includes(normalized)) {
      return 'vertex-ai';
    }
    return normalized || 'openai';
  }
}
