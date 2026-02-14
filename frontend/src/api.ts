const fallbackBaseUrl =
  import.meta.env.MODE === "production"
    ? "https://backend-production-fc6a.up.railway.app"
    : "http://localhost:3000";
let baseUrl = import.meta.env.VITE_API_BASE_URL || fallbackBaseUrl;
if (import.meta.env.MODE === "production" && baseUrl.includes("localhost")) {
  baseUrl = "https://backend-production-fc6a.up.railway.app";
}
const apiKey = import.meta.env.VITE_API_KEY || "";
const authTokenFallback = import.meta.env.VITE_AUTH_TOKEN || "";
const AUTH_TOKEN_KEY = "pm_auth_token";
const refreshClientId = import.meta.env.VITE_AUTH_CLIENT_ID || "";
const refreshClientSecret = import.meta.env.VITE_AUTH_CLIENT_SECRET || "";

const canRefresh = Boolean(refreshClientId && refreshClientSecret);
let authModalPromise: Promise<void> | null = null;

const defaultHeaders: Record<string, string> = {
  "Content-Type": "application/json",
};

const normalizeHeaders = (headers?: HeadersInit): Record<string, string> => {
  if (!headers) {
    return {};
  }
  if (headers instanceof Headers) {
    return Object.fromEntries(headers.entries());
  }
  if (Array.isArray(headers)) {
    return Object.fromEntries(headers);
  }
  return headers;
};

const clearCookie = (name: string) => {
  if (typeof document === "undefined") {
    return;
  }
  document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax`;
};

const getStoredToken = () => {
  if (typeof window === "undefined") {
    return authTokenFallback || "";
  }
  const stored = window.localStorage?.getItem(AUTH_TOKEN_KEY);
  return stored || authTokenFallback || "";
};

const setStoredToken = (token: string) => {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage?.setItem(AUTH_TOKEN_KEY, token);
};

const clearStoredToken = () => {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage?.removeItem(AUTH_TOKEN_KEY);
};

const showSessionExpiredModal = async () => {
  if (typeof window === "undefined") {
    return;
  }
  if (authModalPromise) {
    return authModalPromise;
  }
  authModalPromise = (async () => {
    const Swal = (await import("sweetalert2")).default;
    await Swal.fire({
      title: "Sesión expirada",
      text: "Tu sesión ha caducado. Debes iniciar sesión de nuevo.",
      icon: "warning",
      confirmButtonText: "Ir al login",
      allowOutsideClick: false,
      allowEscapeKey: false,
      backdrop: true,
    });
    clearCookie("pm_auth_user");
    clearStoredToken();
    fetch(`${baseUrl}/auth/logout`, {
      method: "POST",
      credentials: "include",
      headers: getStoredToken()
        ? { Authorization: `Bearer ${getStoredToken()}` }
        : undefined,
    }).catch(() => undefined);
    window.location.href = "/login";
  })();
  return authModalPromise;
};

async function refreshToken() {
  if (!canRefresh) {
    return null;
  }
  const authToken = getStoredToken();
  const response = await fetch(`${baseUrl}/auth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
    credentials: "include",
    body: JSON.stringify({
      clientId: refreshClientId,
      clientSecret: refreshClientSecret,
    }),
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as { accessToken: string };
  if (data?.accessToken) {
    setStoredToken(data.accessToken);
  }
  return data.accessToken;
}

async function requestJson<T>(
  path: string,
  init?: RequestInit,
  retry = true,
): Promise<T> {
  const authToken = getStoredToken();
  const mergedHeaders: Record<string, string> = {
    ...defaultHeaders,
    ...normalizeHeaders(init?.headers),
  };
  if (authToken) {
    mergedHeaders.Authorization = `Bearer ${authToken}`;
  }
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    credentials: "include",
    headers: mergedHeaders,
  });

  if (response.status === 401) {
    // debugger;
    if (retry && canRefresh) {
      const refreshed = await refreshToken();
      if (refreshed) {
        return requestJson<T>(path, init, false);
      }
    }
    const shouldRedirect = path === "/auth/session";
    if (typeof window !== "undefined" && shouldRedirect) {
      await showSessionExpiredModal();
    }
    throw new Error("Sesión expirada. Vuelve a iniciar sesión.");
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
    throw new Error("Invalid JSON response");
  }
}

export const api = {
  issueToken: (payload: { clientId: string; clientSecret: string }) =>
    requestJson<{ accessToken: string; expiresIn: number }>("/auth/token", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getTenants: () => requestJson<any[]>("/tenants"),
  createTenant: (payload: any) =>
    requestJson<any>("/tenants", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateTenant: (id: string, payload: any) =>
    requestJson<any>(`/tenants/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  updateTenantSelf: (payload: any) =>
    requestJson<any>(`/tenants/me`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  toggleTenantKillSwitch: (id: string, enabled: boolean) =>
    requestJson<any>(`/tenants/${id}/kill-switch`, {
      method: "PATCH",
      body: JSON.stringify({ enabled }),
    }),
  getProviders: (tenantId: string) =>
    requestJson<any[]>("/providers", {
      headers: {
        "x-tenant-id": tenantId,
      },
    }),
  createProvider: (tenantId: string, payload: any) =>
    requestJson<any>("/providers", {
      method: "POST",
      headers: {
        "x-tenant-id": tenantId,
      },
      body: JSON.stringify(payload),
    }),
  updateProvider: (tenantId: string, id: string, payload: any) =>
    requestJson<any>(`/providers/${id}`, {
      method: "PATCH",
      headers: {
        "x-tenant-id": tenantId,
      },
      body: JSON.stringify(payload),
    }),
  getPolicy: (tenantId: string) =>
    requestJson<any>("/policies", {
      headers: {
        "x-tenant-id": tenantId,
      },
    }),
  upsertPolicy: (tenantId: string, payload: any) =>
    requestJson<any>("/policies", {
      method: "PUT",
      headers: {
        "x-tenant-id": tenantId,
      },
      body: JSON.stringify(payload),
    }),
  listPolicies: () => requestJson<any[]>("/policies/admin"),
  deletePolicy: (tenantId: string) =>
    requestJson<any>(`/policies/${tenantId}`, {
      method: "DELETE",
    }),
  getUsageSummary: (tenantId: string) =>
    requestJson<any>(`/usage/summary?tenantId=${tenantId}`),
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
  getUsageAlerts: (tenantId: string) =>
    requestJson<any[]>(`/usage/alerts?tenantId=${tenantId}`),
  getUsageAlertsAll: () => requestJson<any[]>(`/usage/alerts`),
  getUsageEvents: (tenantId: string, limit = 20) =>
    requestJson<any[]>(`/usage/events?tenantId=${tenantId}&limit=${limit}`),
  getUsageEventsAll: (limit = 20) =>
    requestJson<any[]>(`/usage/events?limit=${limit}`),
  notifyAlerts: (tenantId: string) =>
    requestJson<any>("/usage/alerts/notify", {
      method: "POST",
      body: JSON.stringify({ tenantId }),
    }),
  getAudit: (limit = 5, tenantId?: string) =>
    requestJson<any[]>(
      tenantId
        ? `/audit?limit=${limit}&tenantId=${tenantId}`
        : `/audit?limit=${limit}`,
    ),
  getPricing: () => requestJson<any[]>("/pricing"),
  createPricing: (payload: any) =>
    requestJson<any>("/pricing", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updatePricing: (id: string, payload: any) =>
    requestJson<any>(`/pricing/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  getWebhooks: () => requestJson<any[]>("/webhooks"),
  createWebhook: (payload: any) =>
    requestJson<any>("/webhooks", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateWebhook: (id: string, payload: any) =>
    requestJson<any>(`/webhooks/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  getNotifications: () => requestJson<any[]>("/notifications"),
  createNotification: (payload: any) =>
    requestJson<any>("/notifications", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateNotification: (id: string, payload: any) =>
    requestJson<any>(`/notifications/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  seedDemo: () => requestJson<any>("/seed/demo", { method: "POST" }),
  getAlertSchedule: () => requestJson<any>("/settings/alerts-schedule"),
  updateAlertSchedule: (payload: any) =>
    requestJson<any>("/settings/alerts-schedule", {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  getDebugMode: () => requestJson<any>("/settings/debug-mode"),
  setDebugMode: (enabled: boolean) =>
    requestJson<any>("/settings/debug-mode", {
      method: "PATCH",
      body: JSON.stringify({ enabled }),
    }),
  purgeDebug: (resources: string[]) =>
    requestJson<any>("/settings/debug/purge", {
      method: "POST",
      body: JSON.stringify({ resources }),
    }),
  listApiKeys: () => requestJson<any>("/auth/api-keys"),
  createApiKey: (payload: any) =>
    requestJson<any>("/auth/api-keys", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  revokeApiKey: (id: string) =>
    requestJson<any>(`/auth/api-keys/${id}/revoke`, {
      method: "PATCH",
    }),
  rotateApiKey: (id: string) =>
    requestJson<any>(`/auth/api-keys/${id}/rotate`, {
      method: "PATCH",
    }),
  getTenantServices: (tenantId: string) =>
    requestJson<any>(`/tenants/${tenantId}/services`),
  updateTenantServiceConfig: (
    tenantId: string,
    serviceCode: string,
    payload: any,
  ) =>
    requestJson<any>(`/tenants/${tenantId}/services/${serviceCode}/config`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  listTenantServiceEndpoints: (tenantId: string, serviceCode: string) =>
    requestJson<any[]>(
      `/tenants/${tenantId}/services/${serviceCode}/endpoints`,
    ),
  createTenantServiceEndpoint: (
    tenantId: string,
    serviceCode: string,
    payload: any,
  ) =>
    requestJson<any>(`/tenants/${tenantId}/services/${serviceCode}/endpoints`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateTenantServiceEndpoint: (
    tenantId: string,
    serviceCode: string,
    id: string,
    payload: any,
  ) =>
    requestJson<any>(
      `/tenants/${tenantId}/services/${serviceCode}/endpoints/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      },
    ),
  deleteTenantServiceEndpoint: (
    tenantId: string,
    serviceCode: string,
    id: string,
  ) =>
    requestJson<any>(
      `/tenants/${tenantId}/services/${serviceCode}/endpoints/${id}`,
      {
        method: "DELETE",
      },
    ),
  listTenantServiceUsers: (tenantId: string, serviceCode: string) =>
    requestJson<any[]>(`/tenants/${tenantId}/services/${serviceCode}/users`),
  assignTenantServiceUser: (
    tenantId: string,
    serviceCode: string,
    payload: any,
  ) =>
    requestJson<any>(`/tenants/${tenantId}/services/${serviceCode}/users`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateTenantServiceUser: (
    tenantId: string,
    serviceCode: string,
    userId: string,
    payload: any,
  ) =>
    requestJson<any>(
      `/tenants/${tenantId}/services/${serviceCode}/users/${userId}`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      },
    ),
  removeTenantServiceUser: (
    tenantId: string,
    serviceCode: string,
    userId: string,
  ) =>
    requestJson<any>(
      `/tenants/${tenantId}/services/${serviceCode}/users/${userId}`,
      {
        method: "DELETE",
      },
    ),
  getTenantPricing: (tenantId: string) =>
    requestJson<any>(`/tenants/${tenantId}/pricing`),
  updateTenantPricing: (tenantId: string, payload?: any) =>
    requestJson<any>(`/tenants/${tenantId}/pricing`, {
      method: "PUT",
      body: JSON.stringify(payload ?? { pricingIds: [] }),
    }),
  listChatUsers: (tenantId: string) =>
    requestJson<any[]>(`/tenants/${tenantId}/chat/users`),
  createChatUser: (tenantId: string, payload: any) =>
    requestJson<any>(`/tenants/${tenantId}/chat/users`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateChatUser: (tenantId: string, id: string, payload: any) =>
    requestJson<any>(`/tenants/${tenantId}/chat/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  deleteChatUser: (tenantId: string, id: string) =>
    requestJson<any>(`/tenants/${tenantId}/chat/users/${id}`, {
      method: "DELETE",
    }),
  listChatConversations: (tenantId: string) =>
    requestJson<any[]>(`/tenants/${tenantId}/chat/conversations`),
  listChatMessages: (tenantId: string, conversationId: string) =>
    requestJson<any[]>(
      `/tenants/${tenantId}/chat/conversations/${conversationId}/messages`,
    ),
  deleteChatConversation: (tenantId: string, conversationId: string) =>
    requestJson<any>(
      `/tenants/${tenantId}/chat/conversations/${conversationId}`,
      {
        method: "DELETE",
      },
    ),
  listServiceCatalog: () => requestJson<any[]>("/services/catalog"),
  createServiceCatalog: (payload: any) =>
    requestJson<any>("/services/catalog", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateServiceCatalog: (id: string, payload: any) =>
    requestJson<any>(`/services/catalog/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  deleteServiceCatalog: (id: string) =>
    requestJson<any>(`/services/catalog/${id}`, {
      method: "DELETE",
    }),
  getTenantSubscription: (tenantId: string) =>
    requestJson<any>(`/tenants/${tenantId}/subscription`),
  getTenantInvoices: (tenantId: string) =>
    requestJson<any[]>(`/tenants/${tenantId}/invoices`),
  createTenantSubscription: (tenantId: string, payload: any) =>
    requestJson<any>(`/tenants/${tenantId}/subscription`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateTenantSubscription: (tenantId: string, payload: any) =>
    requestJson<any>(`/tenants/${tenantId}/subscription`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  deleteTenantServiceAssignment: (tenantId: string, tenantServiceId: string) =>
    requestJson<any>(
      `/tenants/${tenantId}/subscription/services/${tenantServiceId}`,
      {
        method: "DELETE",
      },
    ),
  deleteTenantSubscription: (tenantId: string) =>
    requestJson<any>(`/tenants/${tenantId}/subscription`, {
      method: "DELETE",
    }),
  listAdminSubscriptions: () => requestJson<any[]>("/admin/subscriptions"),
  approveSubscriptionPayment: (tenantId: string) =>
    requestJson<any>(`/admin/subscriptions/${tenantId}/approve`, {
      method: "POST",
    }),
  confirmSubscriptionPayment: (token: string) =>
    requestJson<any>("/billing/confirm", {
      method: "POST",
      body: JSON.stringify({ token }),
    }),
  confirmStripePayment: (sessionId: string) =>
    requestJson<any>("/billing/stripe/confirm", {
      method: "POST",
      body: JSON.stringify({ sessionId }),
    }),
  getGlobalKillSwitch: () => requestJson<any>("/settings/kill-switch"),
  setGlobalKillSwitch: (enabled: boolean) =>
    requestJson<any>("/settings/kill-switch", {
      method: "PATCH",
      body: JSON.stringify({ enabled }),
    }),
  executeRuntime: (tenantId: string, payload: any) =>
    requestJson<any>("/runtime/execute", {
      method: "POST",
      headers: {
        "x-tenant-id": tenantId,
        ...(apiKey ? { "x-api-key": apiKey } : {}),
      },
      body: JSON.stringify(payload),
    }),
  getProfile: () => requestJson<any>("/auth/profile"),
  updateProfile: (payload: any) =>
    requestJson<any>("/auth/profile", {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  forgotPassword: (identifier: string) =>
    requestJson<any>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ identifier }),
    }),
  resetPassword: (payload: { token: string; password: string }) =>
    requestJson<any>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  listAdminUsers: () => requestJson<any[]>("/admin/users"),
  createAdminUser: (payload: any) =>
    requestJson<any>("/admin/users", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateAdminUser: (id: string, payload: any) =>
    requestJson<any>(`/admin/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  deleteAdminUser: (id: string) =>
    requestJson<any>(`/admin/users/${id}`, {
      method: "DELETE",
    }),
  getDocs: (menuSlug: string) =>
    requestJson<any[]>(
      `/docs?menuSlug=${encodeURIComponent(menuSlug)}&enabled=true`,
    ),
  listDocs: (filters: {
    menuSlug?: string;
    category?: string;
    enabled?: boolean;
    q?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters.menuSlug) {
      params.set("menuSlug", filters.menuSlug);
    }
    if (filters.category) {
      params.set("category", filters.category);
    }
    if (typeof filters.enabled === "boolean") {
      params.set("enabled", String(filters.enabled));
    }
    if (filters.q) {
      params.set("q", filters.q);
    }
    const query = params.toString();
    return requestJson<any[]>(`/docs${query ? `?${query}` : ""}`);
  },
  getDocById: (id: string) => requestJson<any>(`/docs/${id}`),
  createDoc: (payload: any) =>
    requestJson<any>("/docs", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateDoc: (id: string, payload: any) =>
    requestJson<any>(`/docs/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  deleteDoc: (id: string) =>
    requestJson<any>(`/docs/${id}`, {
      method: "DELETE",
    }),
};
