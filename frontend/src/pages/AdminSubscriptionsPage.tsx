import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth';
import { DataTable, DataTableColumn } from '../components/DataTable';
import { StatusBadgeIcon } from '../components/StatusBadgeIcon';
import { PageWithDocs } from '../components/PageWithDocs';
import type { AdminSubscriptionSummary } from '../types';
import { formatEur } from '../utils/currency';
import { useI18n } from '../i18n/I18nProvider';

export function AdminSubscriptionsPage() {
  const { role, loading } = useAuth();
  const { t } = useI18n();
  const [rows, setRows] = useState<AdminSubscriptionSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const list = await api.listAdminSubscriptions();
        setRows(list as AdminSubscriptionSummary[]);
      } catch (err: any) {
        setError(err.message || t('Error cargando suscripciones'));
      }
    };
    load();
  }, [t]);

  const handleApprove = async (tenantId: string) => {
    try {
      await api.approveSubscriptionPayment(tenantId);
      const list = await api.listAdminSubscriptions();
      setRows(list as AdminSubscriptionSummary[]);
    } catch (err: any) {
      setError(err.message || t('Error aprobando pago'));
    }
  };

  if (loading) {
    return (
      <PageWithDocs slug="settings">
        <div className="muted">{t('Cargando...')}</div>
      </PageWithDocs>
    );
  }

  if (role !== 'admin') {
    return (
      <PageWithDocs slug="settings">
        <div className="muted">{t('Solo los administradores pueden ver esta página.')}</div>
      </PageWithDocs>
    );
  }

  const columns: DataTableColumn<AdminSubscriptionSummary>[] = [
    {
      key: 'tenantName',
      label: t('Cliente'),
      sortable: true,
      render: (row) => (
        <Link className="link" to={`/clients/${row.tenantId}`}>
          {row.tenantName}
        </Link>
      )
    },
    {
      key: 'status',
      label: t('Estado'),
      sortable: true,
      render: (row) => (
        <StatusBadgeIcon status={row.subscription?.status || 'disabled'} />
      )
    },
    {
      key: 'period',
      label: t('Periodo'),
      sortable: true,
      render: (row) => row.subscription?.period || '-'
    },
    {
      key: 'currentTotalEur',
      label: t('Cuota actual'),
      sortable: true,
      render: (row) => formatEur(row.currentTotalEur || 0)
    },
    {
      key: 'billedSinceStartEur',
      label: t('Gastado (actual)'),
      sortable: true,
      render: (row) => formatEur(row.billedSinceStartEur || 0)
    },
    {
      key: 'historyTotalEur',
      label: t('Gastado histórico'),
      sortable: true,
      render: (row) => formatEur(row.historyTotalEur || 0)
    },
    {
      key: 'total',
      label: t('Acumulado'),
      sortable: true,
      render: (row) => formatEur((row.billedSinceStartEur || 0) + (row.historyTotalEur || 0))
    },
    {
      key: 'actions',
      label: t('Acciones'),
      render: (row) => (
        <div className="icon-actions">
          {row.subscription?.status === 'pending' && (
            <button
              className="btn"
              type="button"
              onClick={() => handleApprove(row.tenantId)}
            >
              {t('Aprobar (mock)')}
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <PageWithDocs slug="settings">
      <section className="grid">
        {error && <div className="error-banner full-row">{error}</div>}
        <div className="card full-row">
          <h2>{t('Suscripciones')}</h2>
          <p className="muted">
            {t(
              'Importe de cuotas desde el inicio de la suscripción actual y el histórico si hubo interrupciones.',
            )}
          </p>
          <DataTable
            columns={columns}
            data={rows}
            getRowId={(row) => row.tenantId}
            pageSize={8}
            filterKeys={['tenantName', 'tenantId', 'status', 'period']}
          />
        </div>
      </section>
    </PageWithDocs>
  );
}
