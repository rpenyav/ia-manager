const STORAGE_PREFIX = "tenant_api_key:";

export const storeTenantApiKey = (tenantId: string, apiKey: string) => {
  if (typeof window === "undefined") {
    return;
  }
  if (!tenantId || !apiKey) {
    return;
  }
  window.localStorage.setItem(`${STORAGE_PREFIX}${tenantId}`, apiKey);
};

export const getTenantApiKey = (tenantId: string) => {
  if (typeof window === "undefined") {
    return null;
  }
  if (!tenantId) {
    return null;
  }
  return window.localStorage.getItem(`${STORAGE_PREFIX}${tenantId}`);
};

export const clearTenantApiKey = (tenantId: string) => {
  if (typeof window === "undefined") {
    return;
  }
  if (!tenantId) {
    return;
  }
  window.localStorage.removeItem(`${STORAGE_PREFIX}${tenantId}`);
};
