import 'reflect-metadata';
import dataSource from '../data-source';
import { Tenant } from '../common/entities/tenant.entity';
import { Policy } from '../common/entities/policy.entity';
import { Provider } from '../common/entities/provider.entity';
import { UsageEvent } from '../common/entities/usage-event.entity';
import { AuditEvent } from '../common/entities/audit-event.entity';
import { NotificationChannel } from '../common/entities/notification-channel.entity';
import { Webhook } from '../common/entities/webhook.entity';
import { EncryptionService } from '../common/services/encryption.service';

async function run() {
  await dataSource.initialize();

  const tenantRepo = dataSource.getRepository(Tenant);
  const policyRepo = dataSource.getRepository(Policy);
  const providerRepo = dataSource.getRepository(Provider);
  const usageRepo = dataSource.getRepository(UsageEvent);
  const auditRepo = dataSource.getRepository(AuditEvent);
  const webhookRepo = dataSource.getRepository(Webhook);
  const channelRepo = dataSource.getRepository(NotificationChannel);

  const encryption = new EncryptionService();

  let tenant = await tenantRepo.findOne({ where: { name: 'Acme Demo' } });
  if (!tenant) {
    tenant = tenantRepo.create({
      name: 'Acme Demo',
      status: 'active',
      killSwitch: false
    });
    tenant = await tenantRepo.save(tenant);
  }

  let policy = await policyRepo.findOne({ where: { tenantId: tenant.id } });
  if (!policy) {
    policy = policyRepo.create({
      tenantId: tenant.id,
      maxRequestsPerMinute: 120,
      maxTokensPerDay: 200000,
      maxCostPerDayUsd: 50,
      redactionEnabled: true,
      metadata: { seeded: true }
    });
    await policyRepo.save(policy);
  }

  let provider = await providerRepo.findOne({
    where: { tenantId: tenant.id, type: 'mock' }
  });
  if (!provider) {
    provider = providerRepo.create({
      tenantId: tenant.id,
      type: 'mock',
      displayName: 'Mock Provider',
      encryptedCredentials: encryption.encrypt(JSON.stringify({ mode: 'mock' })),
      config: {},
      enabled: true
    });
    provider = await providerRepo.save(provider);
  }

  const usageCount = await usageRepo.count({ where: { tenantId: tenant.id } });
  if (usageCount === 0) {
    const usage = usageRepo.create({
      tenantId: tenant.id,
      providerId: provider.id,
      model: 'mock-model',
      tokensIn: 1200,
      tokensOut: 640,
      costUsd: 0
    });
    await usageRepo.save(usage);
  }

  const auditCount = await auditRepo.count({ where: { tenantId: tenant.id } });
  if (auditCount === 0) {
    const audit = auditRepo.create({
      tenantId: tenant.id,
      action: 'seed.demo',
      status: 'accepted',
      metadata: { seeded: true }
    });
    await auditRepo.save(audit);
  }

  const webhookCount = await webhookRepo.count();
  if (webhookCount === 0) {
    const webhook = webhookRepo.create({
      tenantId: tenant.id,
      url: 'https://example.com/webhook',
      events: ['audit.event'],
      encryptedSecret: null,
      enabled: false
    });
    await webhookRepo.save(webhook);
  }

  const channelCount = await channelRepo.count();
  if (channelCount === 0) {
    const channel = channelRepo.create({
      tenantId: tenant.id,
      type: 'email',
      config: {
        name: 'Ops Demo',
        recipients: ['ops@example.com']
      },
      encryptedSecret: null,
      enabled: false
    });
    await channelRepo.save(channel);
  }

  await dataSource.destroy();

  console.log('Demo seed completed');
  console.log(`Tenant: ${tenant.id}`);
  console.log(`Provider: ${provider.id}`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
