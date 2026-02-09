import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { Chart, Sparkline } from '../components/charts/Charts';
import { useDashboard } from '../dashboard';
import { useAuth } from '../auth';
import type { UsageAlert, UsageEvent, UsageSummary } from '../types';
import { PageWithDocs } from '../components/PageWithDocs';
import { buildDailyUsage, buildTenantSeries } from '../utils/chartData';
import { formatUsdWithEur } from '../utils/currency';

export function UsagePage() {
  const { role } = useAuth();
  const canNavigate = role === 'admin';
  const { tenants } = useDashboard();
  const navigate = useNavigate();
  const [summaryAll, setSummaryAll] = useState<UsageSummary[]>([]);
  const [alerts, setAlerts] = useState<UsageAlert[]>([]);
  const [events, setEvents] = useState<UsageEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [usageSummaryAll, usageAlerts, usageEvents] = await Promise.all([
          api.getUsageSummaryAll(),
          api.getUsageAlertsAll(),
          api.getUsageEventsAll(200)
        ]);
        setSummaryAll(usageSummaryAll);
        setAlerts(usageAlerts);
        setEvents(usageEvents);
      } catch (err: any) {
        setError(err.message || 'Error cargando uso');
      }
    };
    load();
  }, []);

  const tenantNames = useMemo(
    () => new Map(tenants.map((tenant) => [tenant.id, tenant.name])),
    [tenants]
  );

  const dailyUsage = useMemo(() => buildDailyUsage(events, 7), [events]);
  const tenantSeries = useMemo(() => buildTenantSeries(events, 7), [events]);
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
      tooltip: { trigger: 'axis' },
      legend: { bottom: 0, textStyle: { color: '#6d6b67', fontSize: 12 } },
      grid: { left: 24, right: 24, top: 24, bottom: 48 },
      xAxis: { type: 'category', data: dailyUsage.labels, axisLabel: { color: '#6d6b67' } },
      yAxis: [
        { type: 'value', axisLabel: { color: '#6d6b67' } },
        { type: 'value', axisLabel: { color: '#6d6b67', formatter: '${value}' } }
      ],
      series: [
        {
          name: 'Tokens',
          type: 'line',
          data: dailyUsage.tokens,
          smooth: true,
          symbol: 'none',
          lineStyle: { color: '#1f6f78', width: 3 }
        },
        {
          name: 'Coste',
          type: 'line',
          yAxisIndex: 1,
          data: dailyUsage.cost.map((value) => Number(value.toFixed(2))),
          smooth: true,
          symbol: 'none',
          lineStyle: { color: '#d8512a', width: 3 }
        }
      ]
    }),
    [dailyUsage]
  );

  return (
    <PageWithDocs slug="usage">
      <section className="grid">
        {error && <div className="error-banner">{error}</div>}

      <div className="card">
        <h2>Uso</h2>
        <p className="muted">Consumo agregado global por tenant (hoy).</p>
        <div className="info-banner">
          Los límites se definen en Políticas (tokens/coste diario). El pricing sólo calcula
          costes por modelo. Cuando se supera el límite, el runtime bloquea ejecuciones y
          puedes activar el kill switch del tenant.
        </div>
        <div className="usage">
          <div>
            <div className="metric">
              {summaryAll.reduce((acc, item) => acc + item.tokens, 0).toLocaleString()}
            </div>
            <span className="muted">tokens (global)</span>
          </div>
          <div>
            <div className="metric">
              {formatUsdWithEur(summaryAll.reduce((acc, item) => acc + item.costUsd, 0))}
            </div>
            <span className="muted">coste global</span>
          </div>
          <div>
            <div className="metric">{alerts.length}</div>
            <span className="muted">alertas</span>
          </div>
        </div>
        <div className="chart-block">
          <div className="muted">Tendencia últimos 7 días</div>
          <Chart option={usageOption} height={220} />
        </div>
        {summaryAll.length > 0 && (
          <div className="mini-list">
            {summaryAll.map((item) => (
              <div className="mini-row" key={item.tenantId}>
                <span>{tenantNames.get(item.tenantId) || item.tenantId}</span>
                <span>{item.tokens} tokens</span>
                <span>{formatUsdWithEur(item.costUsd)}</span>
                <div className="sparkline-cell">
                  <Sparkline
                    data={tenantSeries.labels.map((label, index) => ({
                      label,
                      value: tenantSeries.series[item.tenantId]?.[index] || 0
                    }))}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h2>Balance mensual</h2>
        <p className="muted">
          Estimación basada en el consumo del mes actual (USD/EUR).
        </p>
        <div className="usage">
          <div>
            <div className="metric">{formatUsdWithEur(monthlyCost.costToDate)}</div>
            <span className="muted">gasto hasta hoy</span>
          </div>
          <div>
            <div className="metric">{formatUsdWithEur(monthlyCost.projected)}</div>
            <span className="muted">
              proyección mensual ({monthlyCost.daysElapsed}/{monthlyCost.daysInMonth} días)
            </span>
          </div>
        </div>
      </div>

      <div className="card">
        <h2>Alertas</h2>
        <p className="muted">Señales de consumo y seguridad (global).</p>
        <div className="alerts">
          {alerts.length === 0 && <div className="muted">Sin alertas activas</div>}
          {alerts.map((alert, index) => (
            <div className={`alert ${alert.severity}`} key={`${alert.type}-${index}`}>
              <div>
                <div className="alert-title">{alert.message}</div>
                <div className="muted">
                  Tenant:{' '}
                  {canNavigate ? (
                    <button
                      type="button"
                      className="link"
                      onClick={() => navigate(`/clients/${alert.tenantId}`)}
                    >
                      {tenantNames.get(alert.tenantId) || alert.tenantId}
                    </button>
                  ) : (
                    <span>{tenantNames.get(alert.tenantId) || alert.tenantId}</span>
                  )}
                </div>
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
        <div className="muted">
          Para revisar alertas por tenant, entra en el perfil del cliente.
        </div>
      </div>

      <div className="card">
        <h2>Logs de uso</h2>
        <p className="muted">Eventos recientes de consumo.</p>
        <div className="mini-list">
          {events.map((event) => (
            <div className="mini-row" key={event.id}>
              {canNavigate ? (
                <button
                  type="button"
                  className="link"
                  onClick={() => navigate(`/clients/${event.tenantId}`)}
                >
                  {tenantNames.get(event.tenantId) || event.tenantId}
                </button>
              ) : (
                <span>{tenantNames.get(event.tenantId) || event.tenantId}</span>
              )}
              <span>{event.model}</span>
              <span>{event.tokensIn + event.tokensOut} tokens</span>
              <span>{formatUsdWithEur(event.costUsd)}</span>
            </div>
          ))}
        </div>
        {events.length === 0 && <div className="muted">Sin eventos.</div>}
      </div>
      </section>
    </PageWithDocs>
  );
}
