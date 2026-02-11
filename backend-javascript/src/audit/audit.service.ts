import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditEvent } from '../common/entities/audit-event.entity';
import { SqsService } from '../queues/sqs.service';
import { WebhooksService } from '../webhooks/webhooks.service';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditEvent)
    private readonly auditRepository: Repository<AuditEvent>,
    private readonly webhooksService: WebhooksService,
    private readonly sqsService: SqsService
  ) {}

  async record(event: Partial<AuditEvent>): Promise<AuditEvent> {
    const audit = this.auditRepository.create(event);
    const saved = await this.auditRepository.save(audit);

    const payload = {
      eventType: 'audit.event',
      tenantId: saved.tenantId,
      data: {
        id: saved.id,
        action: saved.action,
        status: saved.status,
        metadata: saved.metadata
      },
      createdAt: saved.createdAt.toISOString()
    };

    try {
      await this.webhooksService.enqueue(payload);
      await this.sqsService.sendMessage({ type: 'audit.event', payload });
    } catch (error) {
      // Avoid blocking main flow on export failures.
    }

    return saved;
  }

  async list(limit = 100, tenantId?: string) {
    return this.auditRepository.find({
      where: tenantId ? { tenantId } : {},
      order: { createdAt: 'DESC' },
      take: limit
    });
  }
}
