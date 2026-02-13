import { createContext, useContext, useEffect, useMemo, useState } from 'react';

type AuthContextValue = {
  token: string | null;
  user: string | null;
  name: string | null;
  role: 'admin' | 'editor' | 'tenant' | null;
  tenantId: string | null;
  mustChangePassword: boolean;
  isAuthenticated: boolean;
  loading: boolean;
  login: (clientId: string, clientSecret: string) => Promise<void>;
  logout: () => void;
  refreshSession: (force?: boolean) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const AUTH_TOKEN_KEY = 'pm_auth_token';

const cookie = {
  get: (name: string) => {
    if (typeof document === 'undefined') {
      return null;
    }
    const match = document.cookie
      .split('; ')
      .find((row) => row.startsWith(`${name}=`));
    if (!match) {
      return null;
    }
    return decodeURIComponent(match.split('=')[1] || '');
  },
  set: (name: string, value: string) => {
    if (typeof document === 'undefined') {
      return;
    }
    document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; SameSite=Lax`;
  },
  clear: (name: string) => {
    if (typeof document === 'undefined') {
      return;
    }
    document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax`;
  }
};

const tokenStorage = {
  get: () => {
    if (typeof window === 'undefined') {
      return null;
    }
    return window.localStorage?.getItem(AUTH_TOKEN_KEY);
  },
  set: (value: string) => {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage?.setItem(AUTH_TOKEN_KEY, value);
  },
  clear: () => {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage?.removeItem(AUTH_TOKEN_KEY);
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<string | null>(() => cookie.get('pm_auth_user'));
  const [name, setName] = useState<string | null>(() => cookie.get('pm_auth_name'));
  const [role, setRole] = useState<'admin' | 'editor' | 'tenant' | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(() => cookie.get('pm_auth_tenant'));
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [loading, setLoading] = useState(true);

  const login = async (username: string, password: string) => {
    let baseUrl =
      import.meta.env.VITE_API_BASE_URL ||
      (import.meta.env.MODE === 'production'
        ? 'https://backend-production-fc6a.up.railway.app'
        : 'http://localhost:3000');
    if (import.meta.env.MODE === 'production' && baseUrl.includes('localhost')) {
      baseUrl = 'https://backend-production-fc6a.up.railway.app';
    }
    const response = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, password })
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || 'Credenciales inválidas');
    }

    const data = (await response.json()) as { mustChangePassword?: boolean; accessToken?: string };
    setMustChangePassword(Boolean(data.mustChangePassword));
    if (data.accessToken) {
      tokenStorage.set(data.accessToken);
      setToken(data.accessToken);
    }
    await refreshSession(true);
  };

  const logout = () => {
    let baseUrl =
      import.meta.env.VITE_API_BASE_URL ||
      (import.meta.env.MODE === 'production'
        ? 'https://backend-production-fc6a.up.railway.app'
        : 'http://localhost:3000');
    if (import.meta.env.MODE === 'production' && baseUrl.includes('localhost')) {
      baseUrl = 'https://backend-production-fc6a.up.railway.app';
    }
    const storedToken = tokenStorage.get();
    fetch(`${baseUrl}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: storedToken ? { Authorization: `Bearer ${storedToken}` } : undefined
    }).catch(() => undefined);
    cookie.clear('pm_auth_user');
    cookie.clear('pm_auth_name');
    cookie.clear('pm_auth_tenant');
    tokenStorage.clear();
    setToken(null);
    setUser(null);
    setName(null);
    setRole(null);
    setTenantId(null);
    setMustChangePassword(false);
    setLoading(false);
  };

  const refreshSession = async (force = false) => {
    let baseUrl =
      import.meta.env.VITE_API_BASE_URL ||
      (import.meta.env.MODE === 'production'
        ? 'https://backend-production-fc6a.up.railway.app'
        : 'http://localhost:3000');
    if (import.meta.env.MODE === 'production' && baseUrl.includes('localhost')) {
      baseUrl = 'https://backend-production-fc6a.up.railway.app';
    }
    setLoading(true);
    try {
      const isAuthRoute =
        typeof window !== 'undefined' &&
        (window.location.pathname.startsWith('/login') ||
          window.location.pathname.startsWith('/reset-password'));
      const hasAuthCookie = Boolean(
        cookie.get('pm_auth_user') || cookie.get('pm_auth_name') || cookie.get('pm_auth_tenant')
      );
      if (isAuthRoute && !token && !force) {
        setLoading(false);
        return;
      }
      if (!hasAuthCookie && !token && !force) {
        setLoading(false);
        return;
      }
      const storedToken = tokenStorage.get() || (token && token !== 'cookie' ? token : null);
      const response = await fetch(`${baseUrl}/auth/session`, {
        method: 'GET',
        credentials: 'include',
        headers: storedToken ? { Authorization: `Bearer ${storedToken}` } : undefined
      });
      if (!response.ok) {
        if (!storedToken) {
          tokenStorage.clear();
          setToken(null);
          setUser(null);
        }
        setLoading(false);
        return;
      }
      const data = (await response.json()) as {
        user: string | null;
        role: 'admin' | 'editor' | 'tenant' | null;
        name?: string | null;
        email?: string | null;
        mustChangePassword?: boolean;
        tenantId?: string | null;
      };
      setToken(storedToken || 'cookie');
      setUser(data.user);
      setName(data.name ?? null);
      setTenantId(data.tenantId ?? null);
      if (data.user) {
        cookie.set('pm_auth_user', data.user);
      }
      if (data.name) {
        cookie.set('pm_auth_name', data.name);
      }
      if (data.tenantId) {
        cookie.set('pm_auth_tenant', data.tenantId);
      }
      setRole(data.role ?? null);
      setMustChangePassword(Boolean(data.mustChangePassword));
    } catch {
      tokenStorage.clear();
      setToken(null);
      setUser(null);
      setName(null);
      setRole(null);
      setTenantId(null);
      setMustChangePassword(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshSession();
  }, []);

  const value = useMemo(
    () => ({
      token,
      user,
      name,
      role,
      tenantId,
      mustChangePassword,
      isAuthenticated: Boolean(token),
      loading,
      login,
      logout,
      refreshSession
    }),
    [token, user, name, role, tenantId, mustChangePassword, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
