import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from './api';
import { useAuth } from './auth';
import type { Tenant } from './types';

type DashboardContextValue = {
  tenants: Tenant[];
  selectedTenantId: string | null;
  selectedTenant: Tenant | null;
  setSelectedTenantId: (tenantId: string | null) => void;
  refreshTenants: () => Promise<void>;
  loading: boolean;
  error: string | null;
};

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const { role, tenantId: authTenantId } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshTenants = async () => {
    try {
      setLoading(true);
      const tenantList = await api.getTenants();
      setTenants(tenantList);
      if (tenantList.length > 0) {
        setSelectedTenantId((current) => {
          if (role === 'tenant' && authTenantId) {
            return authTenantId;
          }
          return current ?? tenantList[0].id;
        });
      } else {
        setSelectedTenantId(null);
      }
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Error cargando tenants');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshTenants();
  }, [role, authTenantId]);

  const selectedTenant = useMemo(
    () => tenants.find((tenant) => tenant.id === selectedTenantId) || null,
    [tenants, selectedTenantId]
  );

  const value = useMemo(
    () => ({
      tenants,
      selectedTenantId,
      selectedTenant,
      setSelectedTenantId,
      refreshTenants,
      loading,
      error
    }),
    [tenants, selectedTenantId, selectedTenant, loading, error]
  );

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within DashboardProvider');
  }
  return context;
}
