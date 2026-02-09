import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHmac } from 'crypto';
import { Repository } from 'typeorm';
import { Webhook } from '../common/entities/webhook.entity';
import { EncryptionService } from '../common/services/encryption.service';
import { WEBHOOKS_QUEUE, WebhooksQueue } from '../queues/webhooks-queue';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { UpdateWebhookDto } from './dto/update-webhook.dto';

export type WebhookEventPayload = {
  eventType: string;
  tenantId: string;
  data: Record<string, unknown>;
  createdAt: string;
};

@Injectable()
export class WebhooksService {
  constructor(
    @InjectRepository(Webhook)
    private readonly webhookRepository: Repository<Webhook>,
    private readonly encryptionService: EncryptionService,
    @Inject(WEBHOOKS_QUEUE)
    private readonly queue: WebhooksQueue | null
  ) {}

  async list() {
    const hooks = await this.webhookRepository.find({ order: { createdAt: 'DESC' } });
    return hooks.map((hook) => ({
      id: hook.id,
      tenantId: hook.tenantId,
      url: hook.url,
      events: hook.events,
      enabled: hook.enabled,
      createdAt: hook.createdAt,
      updatedAt: hook.updatedAt
    }));
  }

  async create(dto: CreateWebhookDto) {
    const webhook = this.webhookRepository.create({
      tenantId: dto.tenantId ?? null,
      url: dto.url,
      events: dto.events,
      encryptedSecret: dto.secret ? this.encryptionService.encrypt(dto.secret) : null,
      enabled: dto.enabled ?? true
    });
    const saved = await this.webhookRepository.save(webhook);
    return {
      id: saved.id,
      tenantId: saved.tenantId,
      url: saved.url,
      events: saved.events,
      enabled: saved.enabled,
      createdAt: saved.createdAt,
      updatedAt: saved.updatedAt
    };
  }

  async update(id: string, dto: UpdateWebhookDto) {
    const webhook = await this.webhookRepository.findOne({ where: { id } });
    if (!webhook) {
      throw new NotFoundException('Webhook not found');
    }
    if (dto.secret !== undefined) {
      webhook.encryptedSecret = dto.secret
        ? this.encryptionService.encrypt(dto.secret)
        : null;
    }
    Object.assign(webhook, {
      tenantId: dto.tenantId ?? webhook.tenantId,
      url: dto.url ?? webhook.url,
      events: dto.events ?? webhook.events,
      enabled: dto.enabled ?? webhook.enabled
    });

    const saved = await this.webhookRepository.save(webhook);
    return {
      id: saved.id,
      tenantId: saved.tenantId,
      url: saved.url,
      events: saved.events,
      enabled: saved.enabled,
      createdAt: saved.createdAt,
      updatedAt: saved.updatedAt
    };
  }

  async enqueue(event: WebhookEventPayload) {
    const hooks = await this.webhookRepository.find({ where: { enabled: true } });
    const targets = hooks.filter((hook) => {
      const matchesTenant = !hook.tenantId || hook.tenantId === event.tenantId;
      const matchesEvent = hook.events.includes('*') || hook.events.includes(event.eventType);
      return matchesTenant && matchesEvent;
    });

    if (!this.queue) {
      await Promise.all(targets.map((hook) => this.deliver(hook.id, event)));
      return;
    }

    const queue = this.queue;
    await Promise.all(
      targets.map((hook) =>
        queue.add('dispatch', {
          webhookId: hook.id,
          event
        })
      )
    );
  }

  async signPayload(secret: string, payload: string) {
    return createHmac('sha256', secret).update(payload).digest('hex');
  }

  async deliver(webhookId: string, event: WebhookEventPayload) {
    const webhook = await this.webhookRepository.findOne({ where: { id: webhookId } });
    if (!webhook || !webhook.enabled) {
      return { skipped: true };
    }

    const payload = JSON.stringify(event);
    const secret = webhook.encryptedSecret
      ? this.encryptionService.decrypt(webhook.encryptedSecret)
      : null;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'ProviderManagerWebhook/1.0'
    };

    if (secret) {
      headers['x-signature'] = await this.signPayload(secret, payload);
    }

    const response = await fetch(webhook.url, {
      method: 'POST',
      headers,
      body: payload
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Webhook delivery failed: ${response.status} ${text}`);
    }

    return { delivered: true };
  }
}
