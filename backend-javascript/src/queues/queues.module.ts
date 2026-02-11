import 'dotenv/config';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { getQueueToken } from '@nestjs/bull-shared';
import { SqsService } from './sqs.service';
import { WEBHOOKS_QUEUE } from './webhooks-queue';

const queueRedisEnabled = (process.env.QUEUE_REDIS_ENABLED ?? 'true') === 'true';
const queueRedisHost = process.env.QUEUE_REDIS_HOST;
const queueEnabled = queueRedisEnabled && !!queueRedisHost;

@Module({
  imports: queueEnabled
    ? [
        BullModule.forRoot({
          connection: {
            host: process.env.QUEUE_REDIS_HOST,
            port: Number(process.env.QUEUE_REDIS_PORT || 6379),
            password: process.env.QUEUE_REDIS_PASSWORD || undefined,
            db: Number(process.env.QUEUE_REDIS_DB || 0)
          }
        }),
        BullModule.registerQueue({ name: 'webhooks' })
      ]
    : [],
  providers: [
    SqsService,
    queueEnabled
      ? {
          provide: WEBHOOKS_QUEUE,
          useExisting: getQueueToken('webhooks')
        }
      : {
          provide: WEBHOOKS_QUEUE,
          useValue: null
        }
  ],
  exports: [SqsService, WEBHOOKS_QUEUE]
})
export class QueuesModule {}
