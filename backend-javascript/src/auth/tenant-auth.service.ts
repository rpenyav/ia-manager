import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { scryptSync, timingSafeEqual } from 'crypto';
import { Repository } from 'typeorm';
import { Tenant } from '../common/entities/tenant.entity';

@Injectable()
export class TenantAuthService {
  private readonly salt: string;

  constructor(
    @InjectRepository(Tenant)
    private readonly tenantsRepository: Repository<Tenant>
  ) {
    const salt = process.env.TENANT_PASSWORD_SALT || '';
    if (salt.length < 16) {
      throw new Error('TENANT_PASSWORD_SALT must be at least 16 characters');
    }
    this.salt = salt;
  }

  private hashPassword(value: string) {
    return scryptSync(value, this.salt, 32).toString('hex');
  }

  private comparePassword(value: string, hash: string | null | undefined) {
    if (!hash) {
      return false;
    }
    const computed = this.hashPassword(value);
    return timingSafeEqual(Buffer.from(computed, 'hex'), Buffer.from(hash, 'hex'));
  }

  buildPasswordHash(password: string) {
    return this.hashPassword(password);
  }

  async validateCredentials(username: string, password: string) {
    const tenant = await this.tenantsRepository.findOne({ where: { authUsername: username } });
    if (!tenant || tenant.status !== 'active') {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (!this.comparePassword(password, tenant.authPasswordHash)) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return tenant;
  }

  async setPassword(tenantId: string, password: string, mustChangePassword = false) {
    if (!password.trim()) {
      throw new BadRequestException('Password required');
    }
    const tenant = await this.tenantsRepository.findOne({ where: { id: tenantId } });
    if (!tenant) {
      throw new UnauthorizedException('Tenant not found');
    }
    tenant.authPasswordHash = this.hashPassword(password);
    tenant.authMustChangePassword = mustChangePassword;
    return this.tenantsRepository.save(tenant);
  }
}
