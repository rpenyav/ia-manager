import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantService } from '../common/entities/tenant-service.entity';
import { TenantsService } from '../tenants/tenants.service';
import { UpdateTenantServicesDto } from './dto/update-tenant-services.dto';

@Injectable()
export class TenantServicesService {
  constructor(
    @InjectRepository(TenantService)
    private readonly servicesRepository: Repository<TenantService>,
    private readonly tenantsService: TenantsService
  ) {}

  async getByTenantId(tenantId: string) {
    const tenant = await this.tenantsService.getById(tenantId);
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const existing = await this.servicesRepository.findOne({ where: { tenantId } });
    if (!existing) {
      return {
        tenantId,
        genericEnabled: false,
        ocrEnabled: false,
        sqlEnabled: false
      };
    }
    return existing;
  }

  async upsert(tenantId: string, dto: UpdateTenantServicesDto) {
    const tenant = await this.tenantsService.getById(tenantId);
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const existing = await this.servicesRepository.findOne({ where: { tenantId } });
    if (existing) {
      Object.assign(existing, dto);
      return this.servicesRepository.save(existing);
    }

    const created = this.servicesRepository.create({
      tenantId,
      genericEnabled: dto.genericEnabled ?? false,
      ocrEnabled: dto.ocrEnabled ?? false,
      sqlEnabled: dto.sqlEnabled ?? false
    });
    return this.servicesRepository.save(created);
  }
}
