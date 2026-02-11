import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from '../common/entities/tenant.entity';
import { KillSwitchService } from '../common/services/kill-switch.service';
import { TenantAuthService } from '../auth/tenant-auth.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantSelfDto } from './dto/update-tenant-self.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantsRepository: Repository<Tenant>,
    private readonly killSwitchService: KillSwitchService,
    private readonly tenantAuthService: TenantAuthService
  ) {}

  private sanitizeTenant(tenant: Tenant) {
    const { authPasswordHash, ...rest } = tenant as Tenant & { authPasswordHash?: string | null };
    return rest;
  }

  async list(tenantId?: string): Promise<Tenant[]> {
    const where = tenantId ? { id: tenantId } : {};
    const tenants = await this.tenantsRepository.find({ where });
    return tenants.map((tenant) => this.sanitizeTenant(tenant) as Tenant);
  }

  async getById(id: string): Promise<Tenant | null> {
    const tenant = await this.tenantsRepository.findOne({ where: { id } });
    return tenant ? (this.sanitizeTenant(tenant) as Tenant) : null;
  }

  async create(dto: CreateTenantDto): Promise<Tenant> {
    if (dto.authUsername) {
      const existing = await this.tenantsRepository.findOne({
        where: { authUsername: dto.authUsername }
      });
      if (existing) {
        throw new BadRequestException('Tenant username already exists');
      }
      if (!dto.authPassword) {
        throw new BadRequestException('Tenant password is required');
      }
    }
    const tenant = this.tenantsRepository.create({
      name: dto.name,
      killSwitch: dto.killSwitch ?? false,
      billingEmail: dto.billingEmail ?? null,
      companyName: dto.companyName ?? null,
      contactName: dto.contactName ?? null,
      phone: dto.phone ?? null,
      addressLine1: dto.addressLine1 ?? null,
      addressLine2: dto.addressLine2 ?? null,
      city: dto.city ?? null,
      postalCode: dto.postalCode ?? null,
      country: dto.country ?? null,
      billingAddressLine1: dto.billingAddressLine1 ?? null,
      billingAddressLine2: dto.billingAddressLine2 ?? null,
      billingCity: dto.billingCity ?? null,
      billingPostalCode: dto.billingPostalCode ?? null,
      billingCountry: dto.billingCountry ?? null,
      taxId: dto.taxId ?? null,
      website: dto.website ?? null,
      authUsername: dto.authUsername ?? null,
      authPasswordHash: dto.authPassword
        ? this.tenantAuthService.buildPasswordHash(dto.authPassword)
        : null,
      authMustChangePassword: dto.authPassword ? true : false
    });
    const saved = await this.tenantsRepository.save(tenant);
    await this.killSwitchService.setTenantKillSwitch(saved.id, saved.killSwitch);
    return this.sanitizeTenant(saved) as Tenant;
  }

  async update(id: string, dto: UpdateTenantDto): Promise<Tenant> {
    const tenant = await this.tenantsRepository.findOne({ where: { id } });
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }
    if (dto.authUsername && dto.authUsername !== tenant.authUsername) {
      const existing = await this.tenantsRepository.findOne({
        where: { authUsername: dto.authUsername }
      });
      if (existing) {
        throw new BadRequestException('Tenant username already exists');
      }
    }
    Object.assign(tenant, { ...dto, authPassword: undefined });
    if (dto.authUsername !== undefined) {
      tenant.authUsername = dto.authUsername ?? null;
    }
    if (dto.authPassword) {
      tenant.authPasswordHash = this.tenantAuthService.buildPasswordHash(dto.authPassword);
      tenant.authMustChangePassword = true;
    }
    const saved = await this.tenantsRepository.save(tenant);
    if (dto.killSwitch !== undefined) {
      await this.killSwitchService.setTenantKillSwitch(saved.id, saved.killSwitch);
    }
    return this.sanitizeTenant(saved) as Tenant;
  }

  async updateSelf(id: string, dto: UpdateTenantSelfDto): Promise<Tenant> {
    const tenant = await this.tenantsRepository.findOne({ where: { id } });
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    Object.assign(tenant, {
      name: dto.name ?? tenant.name,
      billingEmail: dto.billingEmail ?? tenant.billingEmail,
      companyName: dto.companyName ?? tenant.companyName,
      contactName: dto.contactName ?? tenant.contactName,
      phone: dto.phone ?? tenant.phone,
      addressLine1: dto.addressLine1 ?? tenant.addressLine1,
      addressLine2: dto.addressLine2 ?? tenant.addressLine2,
      city: dto.city ?? tenant.city,
      postalCode: dto.postalCode ?? tenant.postalCode,
      country: dto.country ?? tenant.country,
      billingAddressLine1: dto.billingAddressLine1 ?? tenant.billingAddressLine1,
      billingAddressLine2: dto.billingAddressLine2 ?? tenant.billingAddressLine2,
      billingCity: dto.billingCity ?? tenant.billingCity,
      billingPostalCode: dto.billingPostalCode ?? tenant.billingPostalCode,
      billingCountry: dto.billingCountry ?? tenant.billingCountry,
      website: dto.website ?? tenant.website
    });

    const saved = await this.tenantsRepository.save(tenant);
    return this.sanitizeTenant(saved) as Tenant;
  }

  async toggleKillSwitch(id: string, enabled: boolean): Promise<Tenant> {
    return this.update(id, { killSwitch: enabled });
  }
}
