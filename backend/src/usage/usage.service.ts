import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsageEvent } from '../common/entities/usage-event.entity';

@Injectable()
export class UsageService {
  constructor(
    @InjectRepository(UsageEvent)
    private readonly usageRepository: Repository<UsageEvent>
  ) {}

  async record(event: Partial<UsageEvent>): Promise<UsageEvent> {
    const usage = this.usageRepository.create(event);
    return this.usageRepository.save(usage);
  }

  async getDailyTotals(tenantId: string, date = new Date()) {
    const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0));
    const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 1, 0, 0, 0));

    const result = await this.usageRepository
      .createQueryBuilder('usage')
      .select('SUM(usage.tokensIn + usage.tokensOut)', 'tokens')
      .addSelect('SUM(usage.costUsd)', 'costUsd')
      .where('usage.tenantId = :tenantId', { tenantId })
      .andWhere('usage.createdAt >= :start', { start })
      .andWhere('usage.createdAt < :end', { end })
      .getRawOne();

    return {
      tokens: Number(result?.tokens || 0),
      costUsd: Number(result?.costUsd || 0)
    };
  }

  async getSummaryByTenant(tenantId: string) {
    const totals = await this.getDailyTotals(tenantId);
    return {
      tenantId,
      tokens: totals.tokens,
      costUsd: totals.costUsd
    };
  }

  async getSummaryAll(date = new Date()) {
    const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0));
    const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 1, 0, 0, 0));
    const result = await this.usageRepository
      .createQueryBuilder('usage')
      .select('usage.tenantId', 'tenantId')
      .addSelect('SUM(usage.tokensIn + usage.tokensOut)', 'tokens')
      .addSelect('SUM(usage.costUsd)', 'costUsd')
      .where('usage.createdAt >= :start', { start })
      .andWhere('usage.createdAt < :end', { end })
      .groupBy('usage.tenantId')
      .getRawMany();

    return result.map((row) => ({
      tenantId: row.tenantId,
      tokens: Number(row.tokens || 0),
      costUsd: Number(row.costUsd || 0)
    }));
  }

  async listEvents(tenantId: string, limit = 20) {
    return this.usageRepository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
      take: limit
    });
  }

  async listEventsAll(limit = 20) {
    return this.usageRepository.find({
      order: { createdAt: 'DESC' },
      take: limit
    });
  }
}
