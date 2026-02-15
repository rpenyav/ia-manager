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

export function ObservabilityPage() {
  const { tenantId } = useParams();
  const navigate = useNavigate();
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
          setError(err.message || "Error cargando observability");
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
          status: "sin comprobación",
        })),
    [services],
  );

  return (
    <PageWithDocs slug="observability">
      <section className="grid grid-2">
        <div className="card">
          <div className="card-header">
            <div>
              <h2>Observability</h2>
              <p className="muted">
                Salud, alertas y errores recientes del tenant.
              </p>
            </div>
          </div>
          {loading && <div className="muted">Cargando observability...</div>}
          {error && <div className="muted">{error}</div>}
          {!loading && !error && (
            <div className="mini-list">
              <div className="mini-row">
                <span>Tenant</span>
                <span>{tenantId}</span>
              </div>
              <div className="mini-row">
                <span>Servicios monitorizados</span>
                <span>{services.length}</span>
              </div>
            </div>
          )}
        </div>

        <div className="card">
          <h3>Alertas activas</h3>
          {alerts.length === 0 ? (
            <div className="muted">Sin alertas activas.</div>
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
          <h3>Errores recientes</h3>
          {errorEvents.length === 0 ? (
            <div className="muted">Sin errores recientes.</div>
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
          <h3>Salud del provider</h3>
          {providerHealth.length === 0 ? (
            <div className="muted">Sin providers configurados.</div>
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
          <h3>Latencia de endpoints</h3>
          {services.length === 0 ? (
            <div className="muted">Sin servicios con endpoints.</div>
          ) : (
            <div className="mini-list">
              {services.map((service) => (
                <div className="mini-row" key={service.serviceCode}>
                  <span>{service.serviceCode}</span>
                  <span className="muted">
                    {service.endpointCount} endpoints
                  </span>
                  <span className="status">sin medición</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h3>Consumo reciente</h3>
          {usageEvents.length === 0 ? (
            <div className="muted">Sin eventos de uso recientes.</div>
          ) : (
            <div className="mini-list">
              {usageEvents.slice(0, 10).map((event) => (
                <div className="mini-row" key={event.id}>
                  <span>{event.model}</span>
                  <span className="muted">
                    {event.tokensIn + event.tokensOut} tokens
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
