import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { WebhooksService } from './webhooks.service';

@Processor('webhooks')
export class DispatchProcessor extends WorkerHost {
  constructor(private readonly webhooksService: WebhooksService) {
    super();
  }

  async process(job: Job<{ webhookId: string; event: any }>) {
    if (job.name !== 'dispatch') {
      return;
    }
    const { webhookId, event } = job.data;
    return this.webhooksService.deliver(webhookId, event);
  }
}
