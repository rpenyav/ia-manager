import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditEvent } from '../common/entities/audit-event.entity';
import { NotificationChannel } from '../common/entities/notification-channel.entity';
import { Policy } from '../common/entities/policy.entity';
import { Provider } from '../common/entities/provider.entity';
import { Tenant } from '../common/entities/tenant.entity';
import { UsageEvent } from '../common/entities/usage-event.entity';
import { Webhook } from '../common/entities/webhook.entity';
import { EncryptionService } from '../common/services/encryption.service';

@Injectable()
export class DemoSeedService implements OnModuleInit {
  constructor(
    private readonly configService: ConfigService,
    private readonly encryptionService: EncryptionService,
    @InjectRepository(Tenant)
    private readonly tenantRepo: Repository<Tenant>,
    @InjectRepository(Policy)
    private readonly policyRepo: Repository<Policy>,
    @InjectRepository(Provider)
    private readonly providerRepo: Repository<Provider>,
    @InjectRepository(UsageEvent)
    private readonly usageRepo: Repository<UsageEvent>,
    @InjectRepository(AuditEvent)
    private readonly auditRepo: Repository<AuditEvent>,
    @InjectRepository(Webhook)
    private readonly webhookRepo: Repository<Webhook>,
    @InjectRepository(NotificationChannel)
    private readonly channelRepo: Repository<NotificationChannel>
  ) {}

  async onModuleInit() {
    const enabled = this.configService.get<string>('DEMO_SEED_ON_STARTUP');
    if (enabled !== 'true') {
      return;
    }

    await this.run();
  }

  async run() {
    let tenant = await this.tenantRepo.findOne({ where: { name: 'Acme Demo' } });
    if (!tenant) {
      tenant = this.tenantRepo.create({
        name: 'Acme Demo',
        status: 'active',
        killSwitch: false
      });
      tenant = await this.tenantRepo.save(tenant);
    }

    const policy = await this.policyRepo.findOne({ where: { tenantId: tenant.id } });
    if (!policy) {
      await this.policyRepo.save(
        this.policyRepo.create({
          tenantId: tenant.id,
          maxRequestsPerMinute: 120,
          maxTokensPerDay: 200000,
          maxCostPerDayUsd: 50,
          redactionEnabled: true,
          metadata: { seeded: true }
        })
      );
    }

    let provider = await this.providerRepo.findOne({
      where: { tenantId: tenant.id, type: 'mock' }
    });
    if (!provider) {
      provider = this.providerRepo.create({
        tenantId: tenant.id,
        type: 'mock',
        displayName: 'Mock Provider',
        encryptedCredentials: this.encryptionService.encrypt(JSON.stringify({ mode: 'mock' })),
        config: {},
        enabled: true
      });
      provider = await this.providerRepo.save(provider);
    }

    const usageCount = await this.usageRepo.count({ where: { tenantId: tenant.id } });
    if (usageCount === 0) {
      await this.usageRepo.save(
        this.usageRepo.create({
          tenantId: tenant.id,
          providerId: provider.id,
          model: 'mock-model',
          tokensIn: 1200,
          tokensOut: 640,
          costUsd: 0
        })
      );
    }

    const auditCount = await this.auditRepo.count({ where: { tenantId: tenant.id } });
    if (auditCount === 0) {
      await this.auditRepo.save(
        this.auditRepo.create({
          tenantId: tenant.id,
          action: 'seed.demo',
          status: 'accepted',
          metadata: { seeded: true }
        })
      );
    }

    const webhookCount = await this.webhookRepo.count();
    if (webhookCount === 0) {
      await this.webhookRepo.save(
        this.webhookRepo.create({
          tenantId: tenant.id,
          url: 'https://example.com/webhook',
          events: ['audit.event'],
          encryptedSecret: null,
          enabled: false
        })
      );
    }

    const channelCount = await this.channelRepo.count();
    if (channelCount === 0) {
      await this.channelRepo.save(
        this.channelRepo.create({
          tenantId: tenant.id,
          type: 'email',
          config: {
            name: 'Ops Demo',
            recipients: ['ops@example.com']
          },
          encryptedSecret: null,
          enabled: false
        })
      );
    }

    return {
      tenantId: tenant.id,
      providerId: provider.id
    };
  }
}
