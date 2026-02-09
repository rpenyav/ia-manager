import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { TenantsModule } from './tenants/tenants.module';
import { ProvidersModule } from './providers/providers.module';
import { PoliciesModule } from './policies/policies.module';
import { RuntimeModule } from './runtime/runtime.module';
import { AdaptersModule } from './adapters/adapters.module';
import { RedactionModule } from './redaction/redaction.module';
import { UsageModule } from './usage/usage.module';
import { AuditModule } from './audit/audit.module';
import { QueuesModule } from './queues/queues.module';
import { ObservabilityModule } from './observability/observability.module';
import { Tenant } from './common/entities/tenant.entity';
import { Provider } from './common/entities/provider.entity';
import { Policy } from './common/entities/policy.entity';
import { UsageEvent } from './common/entities/usage-event.entity';
import { AuditEvent } from './common/entities/audit-event.entity';
import { ApiKey } from './common/entities/api-key.entity';
import { SystemSetting } from './common/entities/system-setting.entity';
import { PricingModel } from './common/entities/pricing-model.entity';
import { Webhook } from './common/entities/webhook.entity';
import { NotificationChannel } from './common/entities/notification-channel.entity';
import { DocumentationEntry } from './common/entities/documentation-entry.entity';
import { OcrDocument } from './common/entities/ocr-document.entity';
import { DbConnection } from './common/entities/db-connection.entity';
import { TenantService } from './common/entities/tenant-service.entity';
import { TenantPricing } from './common/entities/tenant-pricing.entity';
import { ChatUser } from './common/entities/chat-user.entity';
import { ChatConversation } from './common/entities/chat-conversation.entity';
import { ChatMessage } from './common/entities/chat-message.entity';
import { AdminUser } from './common/entities/admin-user.entity';
import { AdminPasswordReset } from './common/entities/admin-password-reset.entity';
import { ServiceCatalog } from './common/entities/service-catalog.entity';
import { Subscription } from './common/entities/subscription.entity';
import { SubscriptionService } from './common/entities/subscription-service.entity';
import { SubscriptionHistory } from './common/entities/subscription-history.entity';
import { SubscriptionPaymentRequest } from './common/entities/subscription-payment-request.entity';
import { SettingsModule } from './settings/settings.module';
import { redisStore } from 'cache-manager-ioredis-yet';
import { PricingModule } from './pricing/pricing.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SeedModule } from './seed/seed.module';
import { DocsModule } from './docs/docs.module';
import { OcrDocumentsModule } from './ocr/ocr-documents.module';
import { DbConnectionsModule } from './db-connections/db-connections.module';
import { ChatbotsModule } from './chatbots/chatbots.module';
import { TenantServicesModule } from './tenant-services/tenant-services.module';
import { TenantPricingModule } from './tenant-pricing/tenant-pricing.module';
import { ChatModule } from './chat/chat.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { ServiceCatalogModule } from './service-catalog/service-catalog.module';

const stripQuotes = (value?: string) => (value ? value.replace(/^['"]|['"]$/g, '') : value);

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true
    }),
    ScheduleModule.forRoot(),
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        const enabled = (config.get<string>('CACHE_REDIS_ENABLED') ?? 'true') === 'true';
        const host = config.get<string>('CACHE_REDIS_HOST');
        if (!enabled || !host) {
          return { ttl: 30 };
        }
        return ({
          store: await redisStore({
            host,
            port: Number(config.get<string>('CACHE_REDIS_PORT') || 6379),
            password: config.get<string>('CACHE_REDIS_PASSWORD') || undefined,
            db: Number(config.get<string>('CACHE_REDIS_DB') || 1)
          }),
          ttl: Number(config.get<string>('KILL_SWITCH_CACHE_TTL') || 30)
        } as any);
      }
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: stripQuotes(config.get<string>('DB_HOST')),
        port: Number(stripQuotes(config.get<string>('DB_PORT')) || 3306),
        username: stripQuotes(config.get<string>('DB_USER')),
        password: stripQuotes(config.get<string>('DB_PASSWORD')),
        database: stripQuotes(config.get<string>('DB_NAME')),
        ssl: stripQuotes(config.get<string>('DB_SSL')) === 'true',
        entities: [
          Tenant,
          Provider,
          Policy,
          UsageEvent,
          AuditEvent,
          ApiKey,
          SystemSetting,
          PricingModel,
          Webhook,
          NotificationChannel,
          DocumentationEntry,
          OcrDocument,
          DbConnection,
          TenantService,
          TenantPricing,
          ChatUser,
          ChatConversation,
          ChatMessage,
          AdminUser,
          AdminPasswordReset,
          ServiceCatalog,
          Subscription,
          SubscriptionService,
          SubscriptionHistory,
          SubscriptionPaymentRequest
        ],
        synchronize: false
      })
    }),
    AuthModule,
    TenantsModule,
    ProvidersModule,
    PoliciesModule,
    RuntimeModule,
    AdaptersModule,
    PricingModule,
    RedactionModule,
    UsageModule,
    AuditModule,
    QueuesModule,
    ObservabilityModule,
    SettingsModule,
    WebhooksModule,
    NotificationsModule,
    SeedModule,
    DocsModule,
    OcrDocumentsModule,
    DbConnectionsModule,
    ChatbotsModule,
    TenantServicesModule,
    TenantPricingModule,
    ChatModule,
    ServiceCatalogModule,
    SubscriptionsModule
  ]
})
export class AppModule {}
