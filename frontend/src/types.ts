export type Tenant = {
  id: string;
  name: string;
  status: string;
  killSwitch: boolean;
  billingEmail?: string | null;
  companyName?: string | null;
  contactName?: string | null;
  phone?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  postalCode?: string | null;
  country?: string | null;
  billingAddressLine1?: string | null;
  billingAddressLine2?: string | null;
  billingCity?: string | null;
  billingPostalCode?: string | null;
  billingCountry?: string | null;
  taxId?: string | null;
  website?: string | null;
  authUsername?: string | null;
};

export type Provider = {
  id: string;
  tenantId: string;
  type: string;
  displayName: string;
  enabled: boolean;
  config?: Record<string, unknown>;
};

export type Policy = {
  id: string;
  tenantId: string;
  maxRequestsPerMinute: number;
  maxTokensPerDay: number;
  maxCostPerDayUsd: number;
  redactionEnabled: boolean;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type UsageSummary = {
  tenantId: string;
  tokens: number;
  costUsd: number;
};

export type UsageAlert = {
  tenantId: string;
  type: string;
  severity: 'warning' | 'critical';
  message: string;
  value?: number;
  limit?: number;
};

export type AuditEvent = {
  id: string;
  action: string;
  status: string;
  tenantId: string;
  createdAt: string;
};

export type UsageEvent = {
  id: string;
  tenantId: string;
  providerId: string;
  model: string;
  tokensIn: number;
  tokensOut: number;
  costUsd: number;
  createdAt: string;
};

export type PricingEntry = {
  id: string;
  providerType: string;
  model: string;
  inputCostPer1k: number;
  outputCostPer1k: number;
  enabled: boolean;
};

export type Webhook = {
  id: string;
  tenantId: string | null;
  url: string;
  events: string[];
  enabled: boolean;
};

export type NotificationChannel = {
  id: string;
  tenantId: string | null;
  type: string;
  config: { name?: string; recipients?: string[]; webhookUrl?: string };
  enabled: boolean;
};

export type AlertSchedule = {
  cron: string;
  minIntervalMinutes: number;
};

export type DocumentationEntry = {
  id: string;
  menuSlug: string;
  category: string;
  title: string;
  content: string;
  link: string | null;
  orderIndex: number;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type TenantServiceSettings = {
  tenantId: string;
  genericEnabled: boolean;
  ocrEnabled: boolean;
  sqlEnabled: boolean;
};

export type ServiceCatalogItem = {
  id: string;
  code: string;
  name: string;
  description: string;
  priceMonthlyEur: number;
  priceAnnualEur: number;
  enabled: boolean;
};

export type Subscription = {
  id: string;
  tenantId: string;
  status: 'active' | 'pending' | 'cancelled';
  period: 'monthly' | 'annual';
  basePriceEur: number;
  currency: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SubscriptionServiceItem = {
  serviceCode: string;
  status: 'active' | 'pending' | 'pending_removal';
  activateAt: string | null;
  deactivateAt?: string | null;
  priceEur: number;
  name?: string;
  description?: string;
  priceMonthlyEur?: number;
  priceAnnualEur?: number;
};

export type SubscriptionSummary = {
  subscription: Subscription | null;
  services: SubscriptionServiceItem[];
  totals: {
    basePriceEur: number;
    servicesPriceEur: number;
    totalEur: number;
    billedSinceStartEur: number;
  } | null;
};

export type AdminSubscriptionSummary = {
  tenantId: string;
  tenantName: string;
  subscription: Subscription | null;
  currentTotalEur: number;
  billedSinceStartEur: number;
  historyTotalEur: number;
};

export type ApiKeySummary = {
  id: string;
  tenantId: string | null;
  name: string;
  status: string;
  createdAt: string;
};

export type TenantPricingAssignment = {
  tenantId: string;
  pricingIds: string[];
};

export type AdminUser = {
  id: string;
  username: string;
  name?: string | null;
  email?: string | null;
  mustChangePassword?: boolean;
  role: 'admin' | 'editor';
  status: 'active' | 'disabled';
  createdAt: string;
  updatedAt: string;
};

export type Profile = {
  user: string | null;
  role: 'admin' | 'editor' | 'tenant' | null;
  name?: string | null;
  email?: string | null;
  status?: string | null;
  mustChangePassword?: boolean;
};

export type ChatUserSummary = {
  id: string;
  tenantId: string;
  email: string;
  name?: string | null;
  status: 'active' | 'disabled';
  createdAt: string;
  updatedAt: string;
};

export type ChatConversation = {
  id: string;
  tenantId: string;
  userId: string;
  providerId: string;
  model: string;
  title?: string | null;
  apiKeyId?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ChatMessage = {
  id: string;
  conversationId: string;
  tenantId: string;
  userId: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
  tokensIn: number;
  tokensOut: number;
  createdAt: string;
};
