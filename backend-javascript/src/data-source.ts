import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { ApiKey } from './common/entities/api-key.entity';
import { AuditEvent } from './common/entities/audit-event.entity';
import { Policy } from './common/entities/policy.entity';
import { Provider } from './common/entities/provider.entity';
import { PricingModel } from './common/entities/pricing-model.entity';
import { SystemSetting } from './common/entities/system-setting.entity';
import { Tenant } from './common/entities/tenant.entity';
import { UsageEvent } from './common/entities/usage-event.entity';
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
import { TenantServiceConfig } from './common/entities/tenant-service-config.entity';
import { TenantServiceEndpoint } from './common/entities/tenant-service-endpoint.entity';
import { TenantServiceUser } from './common/entities/tenant-service-user.entity';

const stripQuotes = (value?: string) => (value ? value.replace(/^['"]|['"]$/g, '') : value);

export default new DataSource({
  type: 'mysql',
  host: stripQuotes(process.env.DB_HOST),
  port: Number(stripQuotes(process.env.DB_PORT) || 3306),
  username: stripQuotes(process.env.DB_USER),
  password: stripQuotes(process.env.DB_PASSWORD),
  database: stripQuotes(process.env.DB_NAME),
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
    SubscriptionPaymentRequest,
    TenantServiceConfig,
    TenantServiceEndpoint,
    TenantServiceUser
  ],
  migrations: ['src/migrations/*.ts'],
  synchronize: false
});
