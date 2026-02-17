import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageWithDocs } from "../components/PageWithDocs";
import { api } from "../api";
import type {
  AuditEvent,
  UsageAlert,
  UsageEvent,
  TenantServiceOverview,
} from "../types";
import { formatUsdWithEur } from "../utils/currency";
import { useI18n } from "../i18n/I18nProvider";

export function ObservabilityPage() {
  const { tenantId } = useParams();
  const navigate = useNavigate();
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<UsageAlert[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [usageEvents, setUsageEvents] = useState<UsageEvent[]>([]);
  const [services, setServices] = useState<TenantServiceOverview[]>([]);

  useEffect(() => {
    if (!tenantId) {
      return;
    }
    let active = true;
    const load = async () => {
      try {
        setLoading(true);
        const results = await Promise.allSettled([
          api.getUsageAlerts(tenantId),
          api.getAudit(15, tenantId),
          api.getUsageEvents(tenantId, 20),
          api.getTenantServices(tenantId),
        ]);

        if (!active) return;

        const [alertsResult, auditResult, usageResult, servicesResult] = results.map((res) =>
          res.status === "fulfilled" ? res.value : null,
        );

        setAlerts((alertsResult as UsageAlert[]) || []);
        setAuditEvents((auditResult as AuditEvent[]) || []);
        setUsageEvents((usageResult as UsageEvent[]) || []);
        setServices((servicesResult as TenantServiceOverview[]) || []);
        setError(null);
      } catch (err: any) {
        if (active) {
          setError(err.message || t("Error cargando observabilidad"));
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [tenantId]);

  const errorEvents = useMemo(
    () => auditEvents.filter((event) => event.status !== "success"),
    [auditEvents],
  );

  const providerHealth = useMemo(
    () =>
      services
        .filter((service) => service.providerId)
        .map((service) => ({
          serviceCode: service.serviceCode,
          providerId: service.providerId || "",
          status: t("sin comprobación"),
        })),
    [services, t],
  );

  return (
    <PageWithDocs slug="observability">
      <section className="grid grid-2">
        <div className="card">
          <div className="card-header">
            <div>
              <h2>{t("Observabilidad")}</h2>
              <p className="muted">
                {t("Salud, alertas y errores recientes del tenant.")}
              </p>
            </div>
          </div>
          {loading && <div className="muted">{t("Cargando observabilidad...")}</div>}
          {error && <div className="muted">{error}</div>}
          {!loading && !error && (
            <div className="mini-list">
              <div className="mini-row">
                <span>{t("Tenant")}</span>
                <span>{tenantId}</span>
              </div>
              <div className="mini-row">
                <span>{t("Servicios monitorizados")}</span>
                <span>{services.length}</span>
              </div>
            </div>
          )}
        </div>

        <div className="card">
          <h3>{t("Alertas activas")}</h3>
          {alerts.length === 0 ? (
            <div className="muted">{t("Sin alertas activas.")}</div>
          ) : (
            <div className="mini-list">
              {alerts.map((alert) => (
                <div
                  className="mini-row"
                  key={`${alert.type}-${alert.message}`}
                >
                  <span>{alert.type}</span>
                  <span className="muted">{alert.message}</span>
                  <span className={`status ${alert.severity}`}>
                    {alert.severity}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h3>{t("Errores recientes")}</h3>
          {errorEvents.length === 0 ? (
            <div className="muted">{t("Sin errores recientes.")}</div>
          ) : (
            <div className="mini-list">
              {errorEvents.map((event) => (
                <div className="mini-row" key={event.id}>
                  <span>{event.action}</span>
                  <span className="muted">
                    {new Date(event.createdAt).toLocaleString()}
                  </span>
                  <span className={`status ${event.status}`}>
                    {event.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h3>{t("Salud del provider")}</h3>
          {providerHealth.length === 0 ? (
            <div className="muted">{t("Sin providers configurados.")}</div>
          ) : (
            <div className="mini-list">
              {providerHealth.map((provider) => (
                <div className="mini-row" key={provider.serviceCode}>
                  <span>{provider.serviceCode}</span>
                  <span className="muted">{provider.providerId}</span>
                  <span className="status">{provider.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h3>{t("Latencia de endpoints")}</h3>
          {services.length === 0 ? (
            <div className="muted">{t("Sin servicios con endpoints.")}</div>
          ) : (
            <div className="mini-list">
              {services.map((service) => (
                <div className="mini-row" key={service.serviceCode}>
                  <span>{service.serviceCode}</span>
                  <span className="muted">
                    {t("{count} endpoints", { count: service.endpointCount })}
                  </span>
                  <span className="status">{t("sin medición")}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h3>{t("Consumo reciente")}</h3>
          {usageEvents.length === 0 ? (
            <div className="muted">{t("Sin eventos de uso recientes.")}</div>
          ) : (
            <div className="mini-list">
              {usageEvents.slice(0, 10).map((event) => (
                <div className="mini-row" key={event.id}>
                  <span>{event.model}</span>
                  <span className="muted">
                    {t("{count} tokens", {
                      count: event.tokensIn + event.tokensOut,
                    })}
                  </span>
                  <span>{formatUsdWithEur(event.costUsd)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </PageWithDocs>
  );
}
