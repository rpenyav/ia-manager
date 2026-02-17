import { useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import { useDashboard } from '../dashboard';
import { Sparkline } from '../components/charts/Charts';
import type { Provider, UsageAlert, UsageEvent, UsageSummary } from '../types';
import { PageWithDocs } from '../components/PageWithDocs';
import { buildDailyUsage } from '../utils/chartData';
import { formatUsdWithEur } from '../utils/currency';
import { useI18n } from '../i18n/I18nProvider';

export function OverviewPage() {
  const { selectedTenantId } = useDashboard();
  const { t } = useI18n();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [alerts, setAlerts] = useState<UsageAlert[]>([]);
  const [summary, setSummary] = useState<UsageSummary | null>(null);
  const [usageEventsGlobal, setUsageEventsGlobal] = useState<UsageEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedTenantId) {
      return;
    }
    const load = async () => {
      try {
        const [providerList, usageSummary, usageAlerts] = await Promise.all([
          api.getProviders(selectedTenantId),
          api.getUsageSummary(selectedTenantId),
          api.getUsageAlerts(selectedTenantId)
        ]);
        setProviders(providerList);
        setSummary(usageSummary);
        setAlerts(usageAlerts);
      } catch (err: any) {
        setError(err.message || t('Error cargando overview'));
      }
    };
    load();
  }, [selectedTenantId, t]);

  useEffect(() => {
    const loadGlobal = async () => {
      try {
        const globalEvents = await api.getUsageEventsAll(120);
        setUsageEventsGlobal(globalEvents);
      } catch (err: any) {
        setError(err.message || t('Error cargando métricas globales'));
      }
    };
    loadGlobal();
  }, [t]);

  const dailyGlobal = useMemo(
    () => buildDailyUsage(usageEventsGlobal, 7),
    [usageEventsGlobal]
  );

  return (
    <PageWithDocs slug="overview">
      <section className="grid grid-3">
        {error && <div className="error-banner">{error}</div>}

        <div className="card full-row">
          <h2>{t('Bienvenido a Neria Manager')}</h2>
          <p className="muted">
            {t(
              'Esta aplicación es el centro de control para gestionar proveedores de IA en un entorno multi-tenant. Aquí defines límites, políticas y credenciales de forma segura, auditas el consumo y aplicas mecanismos de control como el kill switch.',
            )}
          </p>
          <p className="muted">
            {t(
              'Su objetivo es ofrecer una puerta única de acceso a modelos LLM con garantías de seguridad, control de costes y trazabilidad. Desde este panel puedes operar tenants, proveedores, pricing, alertas y documentación sin exponer datos sensibles.',
            )}
          </p>
        </div>

      <div className="card">
        <h2>{t('Runtime')}</h2>
        <p className="muted">
          {t('Endpoint único con garantías de seguridad y costes.')}
        </p>
        <div className="runtime-box">
          <div>
            <div className="label">{t('POST')}</div>
            <div className="endpoint">/runtime/execute</div>
          </div>
          <div className="runtime-metrics">
            <div>
              <div className="metric">
                {alerts.length === 0 ? t('OK') : t('ALERT')}
              </div>
              <span className="muted">{t('estado de seguridad')}</span>
            </div>
            <div>
              <div className="metric">{providers.length}</div>
              <span className="muted">{t('proveedores activos')}</span>
            </div>
          </div>
        </div>
        <div className="pill-row">
          <span className="pill">{t('Redacción')}</span>
          <span className="pill">{t('Rate limit')}</span>
          <span className="pill">{t('Audit trail')}</span>
        </div>
      </div>

      <div className="card">
        <h2>{t('Uso Hoy')}</h2>
        <p className="muted">{t('Consumo agregado del tenant activo.')}</p>
        <div className="usage">
          <div>
            <div className="metric">{summary?.tokens?.toLocaleString() ?? 0}</div>
            <span className="muted">{t('tokens')}</span>
          </div>
          <div>
            <div className="metric">
              {formatUsdWithEur(summary?.costUsd ?? 0)}
            </div>
            <span className="muted">{t('coste estimado (USD/EUR)')}</span>
          </div>
          <div>
            <div className="metric">{alerts.length}</div>
            <span className="muted">{t('alertas')}</span>
          </div>
        </div>
      </div>

      <div className="card">
        <h2>{t('Tendencia global')}</h2>
        <p className="muted">
          {t('Vista rápida de tokens y coste global (últimos 7 días).')}
        </p>
        <div className="chart-row">
          <div className="chart-metric">
            <span className="muted">{t('Tokens')}</span>
            <div className="metric">
              {dailyGlobal.tokens.reduce((acc, value) => acc + value, 0).toLocaleString()}
            </div>
            <Sparkline
              data={dailyGlobal.labels.map((label, index) => ({
                label,
                value: dailyGlobal.tokens[index] || 0
              }))}
            />
          </div>
          <div className="chart-metric">
            <span className="muted">{t('Coste')}</span>
            <div className="metric">
              {formatUsdWithEur(
                dailyGlobal.cost.reduce((acc, value) => acc + value, 0)
              )}
            </div>
            <Sparkline
              data={dailyGlobal.labels.map((label, index) => ({
                label,
                value: Number(dailyGlobal.cost[index] || 0)
              }))}
              color="#d8512a"
            />
          </div>
        </div>
      </div>
      </section>
    </PageWithDocs>
  );
}
