import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth';
import { DataTable, DataTableColumn } from '../components/DataTable';
import { PageWithDocs } from '../components/PageWithDocs';
import type { AdminSubscriptionSummary } from '../types';
import { formatEur } from '../utils/currency';

export function AdminSubscriptionsPage() {
  const { role, loading } = useAuth();
  const [rows, setRows] = useState<AdminSubscriptionSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const list = await api.listAdminSubscriptions();
        setRows(list as AdminSubscriptionSummary[]);
      } catch (err: any) {
        setError(err.message || 'Error cargando suscripciones');
      }
    };
    load();
  }, []);

  const handleApprove = async (tenantId: string) => {
    try {
      await api.approveSubscriptionPayment(tenantId);
      const list = await api.listAdminSubscriptions();
      setRows(list as AdminSubscriptionSummary[]);
    } catch (err: any) {
      setError(err.message || 'Error aprobando pago');
    }
  };

  if (loading) {
    return (
      <PageWithDocs slug="settings">
        <div className="muted">Cargando...</div>
      </PageWithDocs>
    );
  }

  if (role !== 'admin') {
    return (
      <PageWithDocs slug="settings">
        <div className="muted">Solo los administradores pueden ver esta página.</div>
      </PageWithDocs>
    );
  }

  const columns: DataTableColumn<AdminSubscriptionSummary>[] = [
    {
      key: 'tenantName',
      label: 'Cliente',
      sortable: true,
      render: (row) => (
        <Link className="link" to={`/clients/${row.tenantId}`}>
          {row.tenantName}
        </Link>
      )
    },
    {
      key: 'status',
      label: 'Estado',
      sortable: true,
      render: (row) => (
        <span className={`status ${row.subscription?.status || 'disabled'}`}>
          {row.subscription?.status || 'sin'}
        </span>
      )
    },
    {
      key: 'period',
      label: 'Periodo',
      sortable: true,
      render: (row) => row.subscription?.period || '-'
    },
    {
      key: 'currentTotalEur',
      label: 'Cuota actual',
      sortable: true,
      render: (row) => formatEur(row.currentTotalEur || 0)
    },
    {
      key: 'billedSinceStartEur',
      label: 'Gastado (actual)',
      sortable: true,
      render: (row) => formatEur(row.billedSinceStartEur || 0)
    },
    {
      key: 'historyTotalEur',
      label: 'Gastado histórico',
      sortable: true,
      render: (row) => formatEur(row.historyTotalEur || 0)
    },
    {
      key: 'total',
      label: 'Acumulado',
      sortable: true,
      render: (row) => formatEur((row.billedSinceStartEur || 0) + (row.historyTotalEur || 0))
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (row) => (
        <div className="icon-actions">
          {row.subscription?.status === 'pending' && (
            <button
              className="btn"
              type="button"
              onClick={() => handleApprove(row.tenantId)}
            >
              Aprobar (mock)
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
          <h2>Suscripciones</h2>
          <p className="muted">
            Importe de cuotas desde el inicio de la suscripción actual y el histórico si
            hubo interrupciones.
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
