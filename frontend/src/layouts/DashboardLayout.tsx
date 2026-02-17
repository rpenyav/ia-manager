import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";
import { useDashboard } from "../dashboard";
import { DocsSearch } from "../components/DocsSearch";
import type { DocumentationEntry } from "../types";
import { FieldWithHelp } from "../components/FieldWithHelp";
import { ClientOnboardingWizard } from "../components/ClientOnboardingWizard";
import LogoNeria from "../adapters/ui/react/components/icons/LogoNeria";
import { useI18n } from "../i18n/I18nProvider";
import { Breadcrumbs, type BreadcrumbItem } from "../components/Breadcrumbs";

export function DashboardLayout() {
  const { t } = useI18n();
  const {
    user,
    name,
    role,
    tenantId: authTenantId,
    mustChangePassword,
    logout,
  } = useAuth();
  const { tenants, selectedTenant, selectedTenantId, setSelectedTenantId } =
    useDashboard();
  const location = useLocation();
  const navigate = useNavigate();
  const titleMap: Record<string, string> = {
    "/": t("Resumen"),
    "/tenants": t("Clientes"),
    "/usage": t("Uso"),
    "/audit": t("Auditoría"),
    "/docs": t("Documentación"),
    "/settings": t("Configuración"),
    "/services": t("Servicios"),
    "/services/new": t("Servicios"),
    "/profile": t("Perfil"),
    "/admin/users": t("Usuarios"),
    "/admin/subscriptions": t("Suscripciones"),
  };
  const pageTitle =
    titleMap[location.pathname] ||
    (location.pathname.startsWith("/services") ? t("Servicios") : "Neria Manager");
  const [activeEntry, setActiveEntry] = useState<DocumentationEntry | null>(
    null,
  );
  const [wizardOpen, setWizardOpen] = useState(false);
  const isClientRoute = location.pathname.startsWith("/clients/");
  const isObservabilityRoute =
    isClientRoute && location.pathname.includes("/observability");
  const isUsageRoute =
    isClientRoute && location.pathname.includes("/usage");
  const navItems =
    role === "tenant"
      ? [
          {
            label: t("Cliente"),
            to: authTenantId ? `/clients/${authTenantId}` : "/",
          },
          { label: t("Docs"), to: "/docs" },
          { label: t("Perfil"), to: "/profile" },
        ]
      : [
          { label: t("Resumen"), to: "/" },
          { label: t("Clientes"), to: "/tenants" },
          ...(role === "admin" ? [{ label: t("Servicios"), to: "/services" }] : []),
          { label: t("Uso"), to: "/usage" },
          { label: t("Auditoría"), to: "/audit" },
          { label: t("Docs"), to: "/docs" },
          ...(role === "admin" ? [{ label: t("Configuración"), to: "/settings" }] : []),
          { label: t("Perfil"), to: "/profile" },
          ...(role === "admin"
            ? [
                { label: t("Usuarios"), to: "/admin/users" },
                { label: t("Suscripciones"), to: "/admin/subscriptions" },
              ]
            : []),
        ];

  const buildBreadcrumbs = (): BreadcrumbItem[] => {
    const path = location.pathname;
    const parts = path.split("/").filter(Boolean);
    if (path === "/") {
      return [];
    }
    const withHome = (items: BreadcrumbItem[]) => [
      { label: t("Inicio"), to: "/" },
      ...items,
    ];

    if (parts[0] === "clients" && parts[1]) {
      const tenantLabel = selectedTenant?.name || parts[1];
      const base: BreadcrumbItem[] = [
        { label: t("Clientes"), to: "/tenants" },
        { label: tenantLabel, to: `/clients/${parts[1]}` },
      ];
      if (parts[2] === "services" && parts[3]) {
        return withHome([
          ...base,
          { label: t("Servicios"), to: `/clients/${parts[1]}` },
          { label: parts[3] },
        ]);
      }
      if (parts[2] === "observability") {
        return withHome([...base, { label: t("Observabilidad") }]);
      }
      if (parts[2] === "usage") {
        return withHome([...base, { label: t("Uso") }]);
      }
      return withHome(base);
    }

    if (path.startsWith("/services")) {
      if (path === "/services") {
        return withHome([{ label: t("Servicios") }]);
      }
      if (path === "/services/new") {
        return withHome([
          { label: t("Servicios"), to: "/services" },
          { label: t("Nuevo") },
        ]);
      }
      return withHome([
        { label: t("Servicios"), to: "/services" },
        { label: t("Detalle") },
      ]);
    }

    const map: Record<string, BreadcrumbItem[]> = {
      "/tenants": [{ label: t("Clientes") }],
      "/providers": [{ label: t("Proveedores") }],
      "/policies": [{ label: t("Políticas") }],
      "/runtime": [{ label: t("Runtime") }],
      "/usage": [{ label: t("Uso") }],
      "/audit": [{ label: t("Auditoría") }],
      "/pricing": [{ label: t("Pricing") }],
      "/webhooks": [{ label: t("Webhooks") }],
      "/notifications": [{ label: t("Notificaciones") }],
      "/api-keys": [{ label: t("API keys") }],
      "/docs": [{ label: t("Documentación") }],
      "/profile": [{ label: t("Perfil") }],
      "/settings": [{ label: t("Configuración") }],
      "/admin/users": [{ label: t("Usuarios") }],
      "/admin/subscriptions": [{ label: t("Suscripciones") }],
    };
    const items = map[path] || [];
    return items.length ? withHome(items) : [];
  };
  const breadcrumbs = buildBreadcrumbs();

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
                  <NavLink
                    to="/profile"
                    className="avatar-link"
                    aria-label={t("Ir al perfil")}
                  >
                    <span
                      className={`avatar-circle ${
                        role === "admin" ? "avatar-admin" : "avatar-user"
                      }`}
                    >
                      {(name || user || "").trim().charAt(0).toUpperCase()}
                    </span>
                  </NavLink>
                  <span>{t("Usuario: {name}", { name: name || user || "" })}</span>
                </div>
              )}
              <button className="btn btn-ghost" onClick={logout}>
                {t("Salir")}
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
                        {t("Seleccionar cliente")}
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
                  {t("Nuevo cliente")}
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="main">
        <Breadcrumbs items={breadcrumbs} />
        <div
          className={`page-header ${isClientRoute ? "page-header-split" : ""}`}
        >
          {!isClientRoute && <h1>{pageTitle}</h1>}
          {isClientRoute && selectedTenant && (
            <>
              <h2>{selectedTenant.name}</h2>
              {(isObservabilityRoute || isUsageRoute) && (
                <button
                  className="btn"
                  onClick={() =>
                    selectedTenantId
                  ? navigate(`/clients/${selectedTenantId}`)
                  : navigate(-1)
              }
            >
              {t("Volver")}
            </button>
          )}
        </>
      )}
        </div>

        <Outlet />
      </main>

      <footer className="app-footer">
        <div className="footer-inner">
          <div className="footer-meta">
            <span className="muted">Neria Manager</span>
            <span className="footer-separator">•</span>
            <span className="muted">{t("Versión 0.1.0")}</span>
          </div>
          <div className="footer-links">
            <NavLink to="/docs" className="link">
              {t("Documentación")}
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
                {t("Cerrar")}
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
                  {t("Abrir referencia")}
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
