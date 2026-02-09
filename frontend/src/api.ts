const fallbackBaseUrl =
  import.meta.env.MODE === 'production'
    ? 'https://backend-production-fc6a.up.railway.app'
    : 'http://localhost:3000';
let baseUrl = import.meta.env.VITE_API_BASE_URL || fallbackBaseUrl;
if (import.meta.env.MODE === 'production' && baseUrl.includes('localhost')) {
  baseUrl = 'https://backend-production-fc6a.up.railway.app';
}
const apiKey = import.meta.env.VITE_API_KEY || '';
const authTokenFallback = import.meta.env.VITE_AUTH_TOKEN || '';
const refreshClientId = import.meta.env.VITE_AUTH_CLIENT_ID || '';
const refreshClientSecret = import.meta.env.VITE_AUTH_CLIENT_SECRET || '';

const canRefresh = Boolean(refreshClientId && refreshClientSecret);

const defaultHeaders: Record<string, string> = {
  'Content-Type': 'application/json'
};

if (apiKey) {
  defaultHeaders['x-api-key'] = apiKey;
}

const clearCookie = (name: string) => {
  if (typeof document === 'undefined') {
    return;
  }
  document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax`;
};

const getStoredToken = () => authTokenFallback || '';

async function refreshToken() {
  if (!canRefresh) {
    return null;
  }
  const response = await fetch(`${baseUrl}/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ clientId: refreshClientId, clientSecret: refreshClientSecret })
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as { accessToken: string };
  return data.accessToken;
}

async function requestJson<T>(path: string, init?: RequestInit, retry = true): Promise<T> {
  const authToken = getStoredToken();
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      ...defaultHeaders,
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...(init?.headers || {})
    }
  });

  if (response.status === 401) {
    if (retry && canRefresh) {
      const refreshed = await refreshToken();
      if (refreshed) {
        return requestJson<T>(path, init, false);
      }
    }
    if (typeof window !== 'undefined') {
      const { emitToast } = await import('./toast');
      emitToast('Sesión expirada. Inicia sesión de nuevo.', 'error');
      clearCookie('pm_auth_user');
      fetch(`${baseUrl}/auth/logout`, { method: 'POST', credentials: 'include' }).catch(() => undefined);
      window.location.href = '/login';
    }
    throw new Error('Sesión expirada. Vuelve a iniciar sesión.');
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API error ${response.status}: ${text}`);
  }

  if (response.status === 204) {
    return {} as T;
  }

  const text = await response.text();
  if (!text) {
    return {} as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch (error) {
    throw new Error('Invalid JSON response');
  }
}

export const api = {
  issueToken: (payload: { clientId: string; clientSecret: string }) =>
    requestJson<{ accessToken: string; expiresIn: number }>('/auth/token', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  getTenants: () => requestJson<any[]>('/tenants'),
  createTenant: (payload: any) =>
    requestJson<any>('/tenants', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  updateTenant: (id: string, payload: any) =>
    requestJson<any>(`/tenants/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    }),
  updateTenantSelf: (payload: any) =>
    requestJson<any>(`/tenants/me`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    }),
  toggleTenantKillSwitch: (id: string, enabled: boolean) =>
    requestJson<any>(`/tenants/${id}/kill-switch`, {
      method: 'PATCH',
      body: JSON.stringify({ enabled })
    }),
  getProviders: (tenantId: string) =>
    requestJson<any[]>('/providers', {
      headers: {
        'x-tenant-id': tenantId
      }
    }),
  createProvider: (tenantId: string, payload: any) =>
    requestJson<any>('/providers', {
      method: 'POST',
      headers: {
        'x-tenant-id': tenantId
      },
      body: JSON.stringify(payload)
    }),
  updateProvider: (tenantId: string, id: string, payload: any) =>
    requestJson<any>(`/providers/${id}`, {
      method: 'PATCH',
      headers: {
        'x-tenant-id': tenantId
      },
      body: JSON.stringify(payload)
    }),
  getPolicy: (tenantId: string) =>
    requestJson<any>('/policies', {
      headers: {
        'x-tenant-id': tenantId
      }
    }),
  upsertPolicy: (tenantId: string, payload: any) =>
    requestJson<any>('/policies', {
      method: 'PUT',
      headers: {
        'x-tenant-id': tenantId
      },
      body: JSON.stringify(payload)
    }),
  getUsageSummary: (tenantId: string) => requestJson<any>(`/usage/summary?tenantId=${tenantId}`),
  getUsageSummaryAll: async () => {
    const result = await requestJson<any>(`/usage/summary`);
    if (Array.isArray(result)) {
      return result;
    }
    if (!result) {
      return [];
    }
    return [result];
  },
  getUsageAlerts: (tenantId: string) => requestJson<any[]>(`/usage/alerts?tenantId=${tenantId}`),
  getUsageAlertsAll: () => requestJson<any[]>(`/usage/alerts`),
  getUsageEvents: (tenantId: string, limit = 20) =>
    requestJson<any[]>(`/usage/events?tenantId=${tenantId}&limit=${limit}`),
  getUsageEventsAll: (limit = 20) =>
    requestJson<any[]>(`/usage/events?limit=${limit}`),
  notifyAlerts: (tenantId: string) =>
    requestJson<any>('/usage/alerts/notify', {
      method: 'POST',
      body: JSON.stringify({ tenantId })
    }),
  getAudit: (limit = 5, tenantId?: string) =>
    requestJson<any[]>(
      tenantId ? `/audit?limit=${limit}&tenantId=${tenantId}` : `/audit?limit=${limit}`
    ),
  getPricing: () => requestJson<any[]>('/pricing'),
  createPricing: (payload: any) =>
    requestJson<any>('/pricing', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  updatePricing: (id: string, payload: any) =>
    requestJson<any>(`/pricing/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    }),
  getWebhooks: () => requestJson<any[]>('/webhooks'),
  createWebhook: (payload: any) =>
    requestJson<any>('/webhooks', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  updateWebhook: (id: string, payload: any) =>
    requestJson<any>(`/webhooks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    }),
  getNotifications: () => requestJson<any[]>('/notifications'),
  createNotification: (payload: any) =>
    requestJson<any>('/notifications', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  updateNotification: (id: string, payload: any) =>
    requestJson<any>(`/notifications/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    }),
  seedDemo: () => requestJson<any>('/seed/demo', { method: 'POST' }),
  getAlertSchedule: () => requestJson<any>('/settings/alerts-schedule'),
  updateAlertSchedule: (payload: any) =>
    requestJson<any>('/settings/alerts-schedule', {
      method: 'PATCH',
      body: JSON.stringify(payload)
    }),
  getDebugMode: () => requestJson<any>('/settings/debug-mode'),
  setDebugMode: (enabled: boolean) =>
    requestJson<any>('/settings/debug-mode', {
      method: 'PATCH',
      body: JSON.stringify({ enabled })
    }),
  purgeDebug: (resources: string[]) =>
    requestJson<any>('/settings/debug/purge', {
      method: 'POST',
      body: JSON.stringify({ resources })
    }),
  listApiKeys: () => requestJson<any>('/auth/api-keys'),
  createApiKey: (payload: any) =>
    requestJson<any>('/auth/api-keys', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  revokeApiKey: (id: string) =>
    requestJson<any>(`/auth/api-keys/${id}/revoke`, {
      method: 'PATCH'
    }),
  rotateApiKey: (id: string) =>
    requestJson<any>(`/auth/api-keys/${id}/rotate`, {
      method: 'PATCH'
    }),
  getTenantServices: (tenantId: string) =>
    requestJson<any>(`/tenants/${tenantId}/services`),
  updateTenantServices: (tenantId: string, payload: any) =>
    requestJson<any>(`/tenants/${tenantId}/services`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    }),
  getTenantPricing: (tenantId: string) =>
    requestJson<any>(`/tenants/${tenantId}/pricing`),
  updateTenantPricing: (tenantId: string, payload: any) =>
    requestJson<any>(`/tenants/${tenantId}/pricing`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    }),
  listChatUsers: (tenantId: string) =>
    requestJson<any[]>(`/tenants/${tenantId}/chat/users`),
  createChatUser: (tenantId: string, payload: any) =>
    requestJson<any>(`/tenants/${tenantId}/chat/users`, {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  updateChatUser: (tenantId: string, id: string, payload: any) =>
    requestJson<any>(`/tenants/${tenantId}/chat/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    }),
  deleteChatUser: (tenantId: string, id: string) =>
    requestJson<any>(`/tenants/${tenantId}/chat/users/${id}`, {
      method: 'DELETE'
    }),
  listChatConversations: (tenantId: string) =>
    requestJson<any[]>(`/tenants/${tenantId}/chat/conversations`),
  listChatMessages: (tenantId: string, conversationId: string) =>
    requestJson<any[]>(`/tenants/${tenantId}/chat/conversations/${conversationId}/messages`),
  deleteChatConversation: (tenantId: string, conversationId: string) =>
    requestJson<any>(`/tenants/${tenantId}/chat/conversations/${conversationId}`, {
      method: 'DELETE'
    }),
  listServiceCatalog: () => requestJson<any[]>('/services/catalog'),
  getTenantSubscription: (tenantId: string) =>
    requestJson<any>(`/tenants/${tenantId}/subscription`),
  createTenantSubscription: (tenantId: string, payload: any) =>
    requestJson<any>(`/tenants/${tenantId}/subscription`, {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  updateTenantSubscription: (tenantId: string, payload: any) =>
    requestJson<any>(`/tenants/${tenantId}/subscription`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    }),
  listAdminSubscriptions: () => requestJson<any[]>('/admin/subscriptions'),
  approveSubscriptionPayment: (tenantId: string) =>
    requestJson<any>(`/admin/subscriptions/${tenantId}/approve`, {
      method: 'POST'
    }),
  confirmSubscriptionPayment: (token: string) =>
    requestJson<any>('/billing/confirm', {
      method: 'POST',
      body: JSON.stringify({ token })
    }),
  confirmStripePayment: (sessionId: string) =>
    requestJson<any>('/billing/stripe/confirm', {
      method: 'POST',
      body: JSON.stringify({ sessionId })
    }),
  getGlobalKillSwitch: () => requestJson<any>('/settings/kill-switch'),
  setGlobalKillSwitch: (enabled: boolean) =>
    requestJson<any>('/settings/kill-switch', {
      method: 'PATCH',
      body: JSON.stringify({ enabled })
    }),
  executeRuntime: (tenantId: string, payload: any) =>
    requestJson<any>('/runtime/execute', {
      method: 'POST',
      headers: {
        'x-tenant-id': tenantId
      },
      body: JSON.stringify(payload)
    }),
  getProfile: () => requestJson<any>('/auth/profile'),
  updateProfile: (payload: any) =>
    requestJson<any>('/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(payload)
    }),
  forgotPassword: (identifier: string) =>
    requestJson<any>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ identifier })
    }),
  resetPassword: (payload: { token: string; password: string }) =>
    requestJson<any>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  listAdminUsers: () => requestJson<any[]>('/admin/users'),
  createAdminUser: (payload: any) =>
    requestJson<any>('/admin/users', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  updateAdminUser: (id: string, payload: any) =>
    requestJson<any>(`/admin/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    }),
  deleteAdminUser: (id: string) =>
    requestJson<any>(`/admin/users/${id}`, {
      method: 'DELETE'
    }),
  getDocs: (menuSlug: string) =>
    requestJson<any[]>(`/docs?menuSlug=${encodeURIComponent(menuSlug)}&enabled=true`),
  listDocs: (filters: { menuSlug?: string; category?: string; enabled?: boolean; q?: string }) => {
    const params = new URLSearchParams();
    if (filters.menuSlug) {
      params.set('menuSlug', filters.menuSlug);
    }
    if (filters.category) {
      params.set('category', filters.category);
    }
    if (typeof filters.enabled === 'boolean') {
      params.set('enabled', String(filters.enabled));
    }
    if (filters.q) {
      params.set('q', filters.q);
    }
    const query = params.toString();
    return requestJson<any[]>(`/docs${query ? `?${query}` : ''}`);
  },
  getDocById: (id: string) => requestJson<any>(`/docs/${id}`),
  createDoc: (payload: any) =>
    requestJson<any>('/docs', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  updateDoc: (id: string, payload: any) =>
    requestJson<any>(`/docs/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    }),
  deleteDoc: (id: string) =>
    requestJson<any>(`/docs/${id}`, {
      method: 'DELETE'
    })
};
