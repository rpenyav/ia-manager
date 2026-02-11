import 'dotenv/config';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Webhook } from '../common/entities/webhook.entity';
import { EncryptionService } from '../common/services/encryption.service';
import { QueuesModule } from '../queues/queues.module';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';
import { DispatchProcessor } from './dispatch.processor';

const queueRedisEnabled = (process.env.QUEUE_REDIS_ENABLED ?? 'true') === 'true';
const queueRedisHost = process.env.QUEUE_REDIS_HOST;
const queueEnabled = queueRedisEnabled && !!queueRedisHost;

@Module({
  imports: [
    TypeOrmModule.forFeature([Webhook]),
    QueuesModule
  ],
  controllers: [WebhooksController],
  providers: queueEnabled
    ? [WebhooksService, DispatchProcessor, EncryptionService]
    : [WebhooksService, EncryptionService],
  exports: [WebhooksService]
})
export class WebhooksModule {}
