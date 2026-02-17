import { useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import { Chart } from '../components/charts/Charts';
import type { AuditEvent } from '../types';
import { PageWithDocs } from '../components/PageWithDocs';
import { buildAuditStatusByDay, countAuditByAction } from '../utils/chartData';
import { DataTable } from '../components/DataTable';
import { StatusBadgeIcon } from '../components/StatusBadgeIcon';
import { useI18n } from '../i18n/I18nProvider';

export function AuditPage() {
  const { t } = useI18n();
  const [audit, setAudit] = useState<AuditEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const auditList = await api.getAudit(200);
        setAudit(auditList);
      } catch (err: any) {
        setError(err.message || t('Error cargando auditoría'));
      }
    };
    load();
  }, [t]);

  const actionsData = useMemo(() => countAuditByAction(audit, 6), [audit]);
  const statusByDay = useMemo(() => buildAuditStatusByDay(audit, 7), [audit]);

  const actionsOption = useMemo(
    () => ({
      tooltip: { trigger: 'axis' },
      grid: { left: 24, right: 24, top: 24, bottom: 48 },
      xAxis: {
        type: 'category',
        data: actionsData.labels,
        axisLabel: { color: '#6d6b67', rotate: 20 }
      },
      yAxis: { type: 'value', axisLabel: { color: '#6d6b67' } },
      series: [
        {
          type: 'bar',
          data: actionsData.values,
          itemStyle: { color: '#1f6f78' }
        }
      ]
    }),
    [actionsData]
  );

  const statusOption = useMemo(
    () => ({
      tooltip: { trigger: 'axis' },
      legend: { bottom: 0, textStyle: { color: '#6d6b67', fontSize: 12 } },
      grid: { left: 24, right: 24, top: 24, bottom: 48 },
      xAxis: { type: 'category', data: statusByDay.labels, axisLabel: { color: '#6d6b67' } },
      yAxis: { type: 'value', axisLabel: { color: '#6d6b67' } },
      series: statusByDay.series.map((series, index) => ({
        name: series.name,
        type: 'bar',
        stack: 'total',
        data: series.data,
        itemStyle: {
          color: ['#1f6f78', '#d8512a', '#9b8b7a', '#2f7b5b'][index % 4]
        }
      }))
    }),
    [statusByDay]
  );

  return (
    <PageWithDocs slug="audit">
      <section className="grid grid-2">
        {error && <div className="error-banner full-row">{error}</div>}

      <div className="card">
        <h2>{t('Eventos por tipo')}</h2>
        <p className="muted">{t('Distribución global de acciones recientes.')}</p>
        <Chart option={actionsOption} height={220} />
      </div>

      <div className="card">
        <h2>{t('Severidad por día')}</h2>
        <p className="muted">{t('Volumen de eventos por estado.')}</p>
        <Chart option={statusOption} height={220} />
      </div>

      <div className="card full-row">
        <h2>{t('Auditoría')}</h2>
        <p className="muted">{t('Trazabilidad global sin almacenar prompts completos.')}</p>
        <DataTable
          columns={[
            { key: 'action', label: t('Acción'), sortable: true },
            { key: 'tenantId', label: t('Tenant'), sortable: true },
            {
              key: 'status',
              label: t('Estado'),
              sortable: true,
              render: (item: AuditEvent) => <StatusBadgeIcon status={item.status} />
            },
            {
              key: 'createdAt',
              label: t('Hora'),
              sortable: true,
              render: (item: AuditEvent) =>
                new Date(item.createdAt).toLocaleString()
            }
          ]}
          data={audit}
          getRowId={(item) => item.id}
          pageSize={8}
          filterKeys={['action', 'tenantId', 'status']}
        />
        <div className="muted">
          {t('Para auditoría por tenant, entra en el perfil del cliente.')}
        </div>
        {audit.length === 0 && <div className="muted">{t('Sin eventos registrados.')}</div>}
      </div>
      </section>
    </PageWithDocs>
  );
}
