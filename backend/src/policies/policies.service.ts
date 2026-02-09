import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Policy } from '../common/entities/policy.entity';
import { UpsertPolicyDto } from './dto/upsert-policy.dto';

@Injectable()
export class PoliciesService {
  constructor(
    @InjectRepository(Policy)
    private readonly policiesRepository: Repository<Policy>
  ) {}

  async getByTenant(tenantId: string): Promise<Policy | null> {
    return this.policiesRepository.findOne({ where: { tenantId } });
  }

  async upsert(tenantId: string, dto: UpsertPolicyDto): Promise<Policy> {
    const existing = await this.getByTenant(tenantId);
    if (existing) {
      Object.assign(existing, dto);
      return this.policiesRepository.save(existing);
    }

    const policy = this.policiesRepository.create({
      tenantId,
      maxRequestsPerMinute: dto.maxRequestsPerMinute ?? 60,
      maxTokensPerDay: dto.maxTokensPerDay ?? 200000,
      maxCostPerDayUsd: dto.maxCostPerDayUsd ?? 0,
      redactionEnabled: dto.redactionEnabled ?? true,
      metadata: dto.metadata ?? {}
    });

    return this.policiesRepository.save(policy);
  }
}
