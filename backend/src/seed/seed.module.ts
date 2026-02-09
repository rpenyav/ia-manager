import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditEvent } from '../common/entities/audit-event.entity';
import { NotificationChannel } from '../common/entities/notification-channel.entity';
import { Policy } from '../common/entities/policy.entity';
import { Provider } from '../common/entities/provider.entity';
import { Tenant } from '../common/entities/tenant.entity';
import { UsageEvent } from '../common/entities/usage-event.entity';
import { Webhook } from '../common/entities/webhook.entity';
import { EncryptionService } from '../common/services/encryption.service';
import { DemoSeedService } from './demo-seed.service';
import { SeedController } from './seed.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Tenant,
      Policy,
      Provider,
      UsageEvent,
      AuditEvent,
      Webhook,
      NotificationChannel
    ])
  ],
  controllers: [SeedController],
  providers: [DemoSeedService, EncryptionService]
})
export class SeedModule {}
