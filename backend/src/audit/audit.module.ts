import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditEvent } from '../common/entities/audit-event.entity';
import { QueuesModule } from '../queues/queues.module';
import { WebhooksModule } from '../webhooks/webhooks.module';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';

@Module({
  imports: [TypeOrmModule.forFeature([AuditEvent]), QueuesModule, WebhooksModule],
  controllers: [AuditController],
  providers: [AuditService],
  exports: [AuditService]
})
export class AuditModule {}
