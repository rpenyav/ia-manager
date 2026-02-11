import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { TenantPricing } from '../common/entities/tenant-pricing.entity';
import { PricingModel } from '../common/entities/pricing-model.entity';
import { TenantsService } from '../tenants/tenants.service';
import { UpdateTenantPricingDto } from './dto/update-tenant-pricing.dto';

@Injectable()
export class TenantPricingService {
  constructor(
    @InjectRepository(TenantPricing)
    private readonly tenantPricingRepository: Repository<TenantPricing>,
    @InjectRepository(PricingModel)
    private readonly pricingRepository: Repository<PricingModel>,
    private readonly tenantsService: TenantsService
  ) {}

  async getByTenantId(tenantId: string) {
    const tenant = await this.tenantsService.getById(tenantId);
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const assignments = await this.tenantPricingRepository.find({ where: { tenantId } });
    return {
      tenantId,
      pricingIds: assignments.map((item) => item.pricingId)
    };
  }

  async upsert(tenantId: string, dto: UpdateTenantPricingDto) {
    const tenant = await this.tenantsService.getById(tenantId);
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const uniqueIds = Array.from(new Set(dto.pricingIds || []));
    if (uniqueIds.length > 0) {
      const pricing = await this.pricingRepository.find({
        where: { id: In(uniqueIds) }
      });
      if (pricing.length !== uniqueIds.length) {
        throw new NotFoundException('One or more pricing entries not found');
      }
    }

    await this.tenantPricingRepository.delete({ tenantId });
    if (uniqueIds.length === 0) {
      return { tenantId, pricingIds: [] };
    }

    const rows = uniqueIds.map((pricingId) =>
      this.tenantPricingRepository.create({ tenantId, pricingId })
    );
    await this.tenantPricingRepository.save(rows);
    return { tenantId, pricingIds: uniqueIds };
  }
}
