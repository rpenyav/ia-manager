import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";
import { useDashboard } from "../dashboard";
import { DocsSearch } from "../components/DocsSearch";
import type { DocumentationEntry } from "../types";
import { FieldWithHelp } from "../components/FieldWithHelp";
import { ClientOnboardingWizard } from "../components/ClientOnboardingWizard";
import LogoNeria from "../adapters/ui/react/components/icons/LogoNeria";

const titleMap: Record<string, string> = {
  "/": "Overview",
  "/tenants": "Tenants",
  "/usage": "Usage",
  "/audit": "Audit",
  "/docs": "Documentation",
  "/settings": "Settings",
  "/observability": "Observability",
  "/profile": "Perfil",
  "/admin/users": "Usuarios",
  "/admin/subscriptions": "Suscripciones",
};

export function DashboardLayout() {
  const { user, name, role, tenantId: authTenantId, mustChangePassword, logout } = useAuth();
  const { tenants, selectedTenant, selectedTenantId, setSelectedTenantId } =
    useDashboard();
  const location = useLocation();
  const navigate = useNavigate();
  const pageTitle = titleMap[location.pathname] || "Neria Manager";
  const [activeEntry, setActiveEntry] = useState<DocumentationEntry | null>(
    null,
  );
  const [wizardOpen, setWizardOpen] = useState(false);
  const isClientRoute = location.pathname.startsWith("/clients/");
  const navItems =
    role === "tenant"
      ? [
          { label: "Cliente", to: authTenantId ? `/clients/${authTenantId}` : "/" },
          { label: "Docs", to: "/docs" },
          { label: "Perfil", to: "/profile" },
        ]
      : [
          { label: "Overview", to: "/" },
          { label: "Tenants", to: "/tenants" },
          { label: "Usage", to: "/usage" },
          { label: "Audit", to: "/audit" },
          { label: "Docs", to: "/docs" },
          ...(role === "admin" ? [{ label: "Settings", to: "/settings" }] : []),
          { label: "Observability", to: "/observability" },
          { label: "Perfil", to: "/profile" },
          ...(role === "admin"
            ? [
                { label: "Usuarios", to: "/admin/users" },
                { label: "Suscripciones", to: "/admin/subscriptions" },
              ]
            : []),
        ];

  useEffect(() => {
    const match = location.pathname.match(/^\/clients\/([^/]+)/);
    if (!match) {
      return;
    }
    const routeTenantId = match[1];
    if (routeTenantId && routeTenantId !== selectedTenantId) {
      setSelectedTenantId(routeTenantId);
    }
  }, [location.pathname, selectedTenantId, setSelectedTenantId]);

  useEffect(() => {
    if (mustChangePassword && location.pathname !== "/profile") {
      navigate("/profile", { replace: true });
    }
  }, [mustChangePassword, location.pathname, navigate]);

  useEffect(() => {
    if (role !== "tenant" || !authTenantId) {
      return;
    }
    const allowedPrefixes = ["/docs", "/profile", `/clients/${authTenantId}`];
    const isAllowed = allowedPrefixes.some(
      (prefix) =>
        location.pathname === prefix ||
        location.pathname.startsWith(`${prefix}/`),
    );
    if (!isAllowed) {
      navigate(`/clients/${authTenantId}`, { replace: true });
    }
  }, [role, authTenantId, location.pathname, navigate]);

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-inner">
          <div className="header-brand">
            <span className="brand-mark">
              <LogoNeria size={32} />
            </span>
            <div>
              <div className="brand-title">Neria Manager</div>
            </div>
          </div>
          <nav className="nav nav-horizontal">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  `nav-item ${isActive ? "active" : ""}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="actions header-actions">
            <div className="header-actions-left">
              {(name || user) && (
                <div className="pill user-pill">
                  <NavLink to="/profile" className="avatar-link" aria-label="Ir al perfil">
                    <span
                      className={`avatar-circle ${
                        role === "admin" ? "avatar-admin" : "avatar-user"
                      }`}
                    >
                      {(name || user || "").trim().charAt(0).toUpperCase()}
                    </span>
                  </NavLink>
                  <span>Usuario: {name || user}</span>
                </div>
              )}
              <button className="btn btn-ghost" onClick={logout}>
                Salir
              </button>
            </div>
            <div className="header-actions-right">
              <DocsSearch onSelectDoc={(entry) => setActiveEntry(entry)} />
              {role !== "tenant" && tenants.length > 0 && (
                <div className="tenant-picker">
                  <FieldWithHelp help="tenantPicker">
                    <select
                      value=""
                      onChange={(event) => {
                        const nextId = event.target.value;
                        if (!nextId) {
                          return;
                        }
                        setSelectedTenantId(nextId);
                        navigate(`/clients/${nextId}`);
                      }}
                    >
                      <option value="" disabled>
                        Seleccionar cliente
                      </option>
                      {tenants.map((tenant) => (
                        <option value={tenant.id} key={tenant.id}>
                          {tenant.name}
                        </option>
                      ))}
                    </select>
                  </FieldWithHelp>
                </div>
              )}
              {role === "admin" && (
                <button
                  className="btn primary"
                  onClick={() => setWizardOpen(true)}
                >
                  Nuevo cliente
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="main">
        <div className="page-header">
          {!isClientRoute && <h1>{pageTitle}</h1>}
          {isClientRoute && selectedTenant && (
            <h2>Tenant activo: {selectedTenant.name}</h2>
          )}
        </div>

        <Outlet />
      </main>

      <footer className="app-footer">
        <div className="footer-inner">
          <div className="footer-meta">
            <span className="muted">Neria Manager</span>
            <span className="footer-separator">•</span>
            <span className="muted">Version 0.1.0</span>
          </div>
          <div className="footer-links">
            <NavLink to="/docs" className="link">
              Documentación
            </NavLink>
          </div>
        </div>
      </footer>

      {activeEntry && (
        <div
          className="docs-modal-backdrop"
          onClick={() => setActiveEntry(null)}
        >
          <div
            className="docs-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="docs-modal-header">
              <div>
                <div className="eyebrow">{activeEntry.category}</div>
                <h2>{activeEntry.title}</h2>
              </div>
              <button className="btn" onClick={() => setActiveEntry(null)}>
                Cerrar
              </button>
            </div>
            <div className="docs-modal-body">
              <p>{activeEntry.content}</p>
              {activeEntry.link && (
                <a
                  className="docs-link"
                  href={activeEntry.link}
                  target="_blank"
                  rel="noreferrer"
                >
                  Abrir referencia
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      <ClientOnboardingWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
      />
    </div>
  );
}
