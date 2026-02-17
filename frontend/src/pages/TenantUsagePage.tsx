import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api";
import { Chart } from "../components/charts/Charts";
import { PageWithDocs } from "../components/PageWithDocs";
import type { UsageAlert, UsageEvent, UsageSummary } from "../types";
import { buildDailyUsage } from "../utils/chartData";
import { formatUsdWithEur } from "../utils/currency";
import { useI18n } from "../i18n/I18nProvider";

export function TenantUsagePage() {
  const { tenantId } = useParams();
  const { t } = useI18n();
  const [summary, setSummary] = useState<UsageSummary | null>(null);
  const [alerts, setAlerts] = useState<UsageAlert[]>([]);
  const [events, setEvents] = useState<UsageEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenantId) {
      return;
    }
    let active = true;
    const load = async () => {
      try {
        setLoading(true);
        const [summaryResult, alertsResult, eventsResult] = await Promise.all([
          api.getUsageSummary(tenantId),
          api.getUsageAlerts(tenantId),
          api.getUsageEvents(tenantId, 200),
        ]);
        if (!active) return;
        setSummary(summaryResult as UsageSummary);
        setAlerts((alertsResult as UsageAlert[]) || []);
        setEvents((eventsResult as UsageEvent[]) || []);
        setError(null);
      } catch (err: any) {
        if (active) {
          setError(err.message || t("Error cargando uso del tenant"));
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

  const dailyUsage = useMemo(() => buildDailyUsage(events, 7), [events]);
  const totalTokens = useMemo(
    () => events.reduce((acc, event) => acc + event.tokensIn + event.tokensOut, 0),
    [events],
  );
  const totalCost = useMemo(
    () => events.reduce((acc, event) => acc + Number(event.costUsd || 0), 0),
    [events],
  );
  const monthlyCost = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysElapsed = Math.max(1, now.getDate());
    const costToDate = events.reduce((acc, event) => {
      const created = new Date(event.createdAt);
      if (created.getFullYear() !== year || created.getMonth() !== month) {
        return acc;
      }
      return acc + Number(event.costUsd || 0);
    }, 0);
    const projected = (costToDate / daysElapsed) * daysInMonth;
    return { costToDate, projected, daysElapsed, daysInMonth };
  }, [events]);

  const usageOption = useMemo(
    () => ({
      tooltip: { trigger: "axis" },
      legend: { bottom: 0, textStyle: { color: "#6d6b67", fontSize: 12 } },
      grid: { left: 24, right: 24, top: 24, bottom: 48 },
      xAxis: {
        type: "category",
        data: dailyUsage.labels,
        axisLabel: { color: "#6d6b67" },
      },
      yAxis: [
        { type: "value", axisLabel: { color: "#6d6b67" } },
        { type: "value", axisLabel: { color: "#6d6b67", formatter: "${value}" } },
      ],
      series: [
        {
          name: t("Tokens"),
          type: "line",
          data: dailyUsage.tokens,
          smooth: true,
          symbol: "none",
          lineStyle: { color: "#1f6f78", width: 3 },
        },
        {
          name: t("Coste"),
          type: "line",
          yAxisIndex: 1,
          data: dailyUsage.cost.map((value) => Number(value.toFixed(2))),
          smooth: true,
          symbol: "none",
          lineStyle: { color: "#d8512a", width: 3 },
        },
      ],
    }),
    [dailyUsage, t],
  );

  return (
    <PageWithDocs slug="usage">
      <section className="grid">
        {error && <div className="error-banner">{error}</div>}

        <div className="card">
          <h2>{t("Uso del tenant")}</h2>
          <p className="muted">{t("Consumo detallado del tenant.")}</p>
          {loading && <div className="muted">{t("Cargando uso...")}</div>}
          {!loading && (
            <>
              <div className="usage">
                <div>
                  <div className="metric">{summary?.tokens?.toLocaleString() ?? 0}</div>
                  <span className="muted">{t("tokens (hoy)")}</span>
                </div>
                <div>
                  <div className="metric">
                    {formatUsdWithEur(summary?.costUsd ?? 0)}
                  </div>
                  <span className="muted">{t("coste (hoy)")}</span>
                </div>
                <div>
                  <div className="metric">{alerts.length}</div>
                  <span className="muted">{t("alertas activas")}</span>
                </div>
              </div>
              <div className="chart-block">
                <div className="muted">{t("Tendencia últimos 7 días")}</div>
                <Chart option={usageOption} height={220} />
              </div>
            </>
          )}
        </div>

        <div className="card">
          <h2>{t("Balance mensual")}</h2>
          <p className="muted">{t("Estimación basada en el consumo del mes actual.")}</p>
          <div className="usage">
            <div>
              <div className="metric">{formatUsdWithEur(monthlyCost.costToDate)}</div>
              <span className="muted">{t("gasto hasta hoy")}</span>
            </div>
            <div>
              <div className="metric">{formatUsdWithEur(monthlyCost.projected)}</div>
              <span className="muted">
                {t("proyección mensual ({elapsed}/{total} días)", {
                  elapsed: monthlyCost.daysElapsed,
                  total: monthlyCost.daysInMonth,
                })}
              </span>
            </div>
          </div>
        </div>

        <div className="card">
          <h2>{t("Alertas")}</h2>
          <p className="muted">{t("Señales de consumo y seguridad del tenant.")}</p>
          <div className="alerts">
            {alerts.length === 0 && <div className="muted">{t("Sin alertas activas")}</div>}
            {alerts.map((alert, index) => (
              <div className={`alert ${alert.severity}`} key={`${alert.type}-${index}`}>
                <div>
                  <div className="alert-title">{alert.message}</div>
                  <div className="muted">{alert.type.toUpperCase()}</div>
                </div>
                <div className="alert-meta">
                  {alert.value !== undefined && alert.limit !== undefined && (
                    <span>
                      {alert.value} / {alert.limit}
                    </span>
                  )}
                  <span className={`status ${alert.severity}`}>{alert.severity}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2>{t("Logs de uso")}</h2>
          <p className="muted">{t("Eventos recientes de consumo del tenant.")}</p>
          <div className="mini-list usage-logs-list">
            {events.map((event) => (
              <div className="mini-row usage-logs-row" key={event.id}>
                <div className="row align-items-center">
                  <div className="col-6">
                    <div>{event.model}</div>
                    <div className="muted">{event.serviceCode || t("general")}</div>
                  </div>
                  <div className="col-6 text-end">
                    <div>
                      {t("{count} tokens", {
                        count: event.tokensIn + event.tokensOut,
                      })}
                    </div>
                    <div className="muted">{formatUsdWithEur(event.costUsd)}</div>
                  </div>
                </div>
                <div className="row">
                  <div className="col-12 muted">
                    {new Date(event.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
            {events.length === 0 && <div className="muted">{t("Sin eventos de uso.")}</div>}
          </div>
        </div>
      </section>
    </PageWithDocs>
  );
}
