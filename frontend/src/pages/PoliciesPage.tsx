import { useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import { useDashboard } from '../dashboard';
import { PageWithDocs } from '../components/PageWithDocs';
import { FieldWithHelp } from '../components/FieldWithHelp';
import { DataTable } from '../components/DataTable';
import { useAuth } from '../auth';
import type { Policy } from '../types';
import { formatUsdWithEur } from '../utils/currency';
import Swal from 'sweetalert2';
import { useI18n } from '../i18n/I18nProvider';

export function PoliciesPage() {
  const { role } = useAuth();
  const { tenants, selectedTenantId, setSelectedTenantId } = useDashboard();
  const { t } = useI18n();
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [listLoading, setListLoading] = useState(false);
  const [form, setForm] = useState({
    maxRequestsPerMinute: 60,
    maxTokensPerDay: 200000,
    maxCostPerDayUsd: 0,
    redactionEnabled: true,
    metadata: '{}'
  });

  const canEdit = role === 'admin';

  const tenantNameMap = useMemo(
    () => new Map(tenants.map((tenant) => [tenant.id, tenant.name])),
    [tenants]
  );

  useEffect(() => {
    if (!selectedTenantId) {
      return;
    }
    const load = async () => {
      try {
        const current = await api.getPolicy(selectedTenantId);
        if (current) {
          setPolicy(current);
          setForm({
            maxRequestsPerMinute: current.maxRequestsPerMinute ?? 60,
            maxTokensPerDay: current.maxTokensPerDay ?? 200000,
            maxCostPerDayUsd: Number(current.maxCostPerDayUsd ?? 0),
            redactionEnabled: Boolean(current.redactionEnabled),
            metadata: JSON.stringify(current.metadata ?? {}, null, 2)
          });
        } else {
          setPolicy(null);
        }
      } catch (err: any) {
        setError(err.message || t('Error cargando política'));
      }
    };
    load();
  }, [selectedTenantId, t]);

  useEffect(() => {
    if (role !== 'admin') {
      setPolicies([]);
      return;
    }
    const loadPolicies = async () => {
      setListLoading(true);
      try {
        const list = await api.listPolicies();
        setPolicies(list);
        setListError(null);
      } catch (err: any) {
        setListError(err.message || t('Error cargando políticas'));
      } finally {
        setListLoading(false);
      }
    };
    loadPolicies();
  }, [role, t]);

  const handleSave = async () => {
    if (!selectedTenantId) {
      return;
    }
    if (!canEdit) {
      return;
    }
    try {
      const payload = {
        maxRequestsPerMinute: Number(form.maxRequestsPerMinute),
        maxTokensPerDay: Number(form.maxTokensPerDay),
        maxCostPerDayUsd: Number(form.maxCostPerDayUsd),
        redactionEnabled: form.redactionEnabled,
        metadata: form.metadata ? JSON.parse(form.metadata) : {}
      };
      const updated = await api.upsertPolicy(selectedTenantId, payload);
      setPolicy(updated);
      setError(null);
      if (role === 'admin') {
        const list = await api.listPolicies();
        setPolicies(list);
      }
    } catch (err: any) {
      setError(err.message || t('Error guardando política'));
    }
  };

  const handleDelete = async (tenantId: string) => {
    const tenantName = tenantNameMap.get(tenantId) || tenantId;
    const result = await Swal.fire({
      title: t('Eliminar política'),
      text: t('¿Seguro que quieres eliminar la política de {name}?', { name: tenantName }),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: t('Eliminar'),
      cancelButtonText: t('Cancelar')
    });
    if (!result.isConfirmed) {
      return;
    }
    try {
      await api.deletePolicy(tenantId);
      const list = await api.listPolicies();
      setPolicies(list);
      if (selectedTenantId === tenantId) {
        setPolicy(null);
      }
      await Swal.fire({
        title: t('Política eliminada'),
        icon: 'success',
        timer: 1600,
        showConfirmButton: false
      });
    } catch (err: any) {
      await Swal.fire({
        title: t('Error'),
        text: err.message || t('No se pudo eliminar la política.'),
        icon: 'error'
      });
    }
  };

  if (!selectedTenantId) {
    return (
      <PageWithDocs slug="policies">
        <div className="muted">{t('Selecciona un tenant para configurar políticas.')}</div>
      </PageWithDocs>
    );
  }

  return (
    <PageWithDocs slug="policies">
      <section className="grid">
        <div className="info-banner">
          {t('Para asignar este recurso a un cliente, ve a su perfil (Resumen del cliente).')}
        </div>
        {error && <div className="error-banner">{error}</div>}
        {listError && <div className="error-banner">{listError}</div>}

        {role === 'admin' && (
          <div className="card full-row">
            <div className="card-header">
              <div>
                <h2>{t('Políticas creadas')}</h2>
                <p className="muted">{t('Listado global de políticas por tenant.')}</p>
              </div>
            </div>
            <DataTable
              columns={[
                {
                  key: 'tenantId',
                  label: t('Tenant'),
                  sortable: true,
                  render: (row: Policy) => tenantNameMap.get(row.tenantId) || row.tenantId
                },
                {
                  key: 'maxRequestsPerMinute',
                  label: t('RPM'),
                  sortable: true
                },
                {
                  key: 'maxTokensPerDay',
                  label: t('Tokens/día'),
                  sortable: true
                },
                {
                  key: 'maxCostPerDayUsd',
                  label: t('Coste/día'),
                  sortable: true,
                  render: (row: Policy) =>
                    `${Number(row.maxCostPerDayUsd).toFixed(2)} USD · ${formatUsdWithEur(
                      Number(row.maxCostPerDayUsd)
                    )}`
                },
                {
                  key: 'redactionEnabled',
                  label: t('Redacción'),
                  sortable: true,
                  render: (row: Policy) => (row.redactionEnabled ? t('ON') : t('OFF'))
                },
                {
                  key: 'updatedAt',
                  label: t('Actualizado'),
                  sortable: true,
                  render: (row: Policy) => new Date(row.updatedAt).toLocaleString()
                },
                {
                  key: 'actions',
                  label: t('Acciones'),
                  render: (row: Policy) => (
                    <div className="row-actions">
                      <button
                        className="link"
                        onClick={() => setSelectedTenantId(row.tenantId)}
                      >
                        {t('Editar')}
                      </button>
                      <button
                        className="link danger"
                        onClick={() => handleDelete(row.tenantId)}
                      >
                        {t('Eliminar')}
                      </button>
                    </div>
                  )
                }
              ]}
              data={policies}
              getRowId={(row) => row.id}
              pageSize={8}
              filterKeys={[
                'tenantId',
                'maxRequestsPerMinute',
                'maxTokensPerDay',
                'maxCostPerDayUsd'
              ]}
            />
            {listLoading && <div className="muted">{t('Cargando políticas…')}</div>}
            {!listLoading && policies.length === 0 && (
              <div className="muted">{t('No hay políticas creadas.')}</div>
            )}
          </div>
        )}

        <div className="card">
          <h2>{t('Políticas')}</h2>
          <p className="muted">{t('Gestión de límites y redacción por tenant.')}</p>
          <div className="form-grid">
            <FieldWithHelp help="policiesMaxRequestsPerMinute">
              <input
                type="number"
                placeholder={t('Requests por minuto (ej: 120)')}
                value={form.maxRequestsPerMinute}
                onChange={(event) =>
                  setForm({ ...form, maxRequestsPerMinute: Number(event.target.value) })
                }
                disabled={!canEdit}
              />
            </FieldWithHelp>
            <FieldWithHelp help="policiesMaxTokensPerDay">
              <input
                type="number"
                placeholder={t('Tokens por día (ej: 200000)')}
                value={form.maxTokensPerDay}
                onChange={(event) =>
                  setForm({ ...form, maxTokensPerDay: Number(event.target.value) })
                }
                disabled={!canEdit}
              />
            </FieldWithHelp>
            <FieldWithHelp help="policiesMaxCostPerDayUsd">
              <div className="field-stack">
                <input
                  type="number"
                  placeholder={t('Coste máximo diario USD (ej: 50)')}
                  value={form.maxCostPerDayUsd}
                  onChange={(event) =>
                    setForm({ ...form, maxCostPerDayUsd: Number(event.target.value) })
                  }
                  disabled={!canEdit}
                />
                <span className="muted">
                  {t('≈ {amount}', {
                    amount: formatUsdWithEur(Number(form.maxCostPerDayUsd || 0)),
                  })}
                </span>
              </div>
            </FieldWithHelp>
            <FieldWithHelp help="policiesRedactionEnabled">
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={form.redactionEnabled}
                  onChange={(event) =>
                    setForm({ ...form, redactionEnabled: event.target.checked })
                  }
                  disabled={!canEdit}
                />
                {t('Redacción habilitada')}
              </label>
            </FieldWithHelp>
            <FieldWithHelp help="policiesMetadata">
              <textarea
                placeholder={t('metadata JSON (ej: {"plan":"pro"})')}
                value={form.metadata}
                onChange={(event) => setForm({ ...form, metadata: event.target.value })}
                rows={4}
                disabled={!canEdit}
              />
            </FieldWithHelp>
            <div className="form-actions">
              {canEdit ? (
                <button className="btn primary" onClick={handleSave}>
                  {policy ? t('Actualizar') : t('Crear')} {t('política')}
                </button>
              ) : (
                <div className="muted">{t('Solo el rol admin puede editar políticas.')}</div>
              )}
            </div>
          </div>
        </div>
      </section>
    </PageWithDocs>
  );
}
