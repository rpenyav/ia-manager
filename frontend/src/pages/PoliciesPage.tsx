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

export function PoliciesPage() {
  const { role } = useAuth();
  const { tenants, selectedTenantId, setSelectedTenantId } = useDashboard();
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
        setError(err.message || 'Error cargando política');
      }
    };
    load();
  }, [selectedTenantId]);

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
        setListError(err.message || 'Error cargando políticas');
      } finally {
        setListLoading(false);
      }
    };
    loadPolicies();
  }, [role]);

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
      setError(err.message || 'Error guardando política');
    }
  };

  const handleDelete = async (tenantId: string) => {
    const tenantName = tenantNameMap.get(tenantId) || tenantId;
    const result = await Swal.fire({
      title: 'Eliminar política',
      text: `¿Seguro que quieres eliminar la política de ${tenantName}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar'
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
        title: 'Política eliminada',
        icon: 'success',
        timer: 1600,
        showConfirmButton: false
      });
    } catch (err: any) {
      await Swal.fire({
        title: 'Error',
        text: err.message || 'No se pudo eliminar la política.',
        icon: 'error'
      });
    }
  };

  if (!selectedTenantId) {
    return (
      <PageWithDocs slug="policies">
        <div className="muted">Selecciona un tenant para configurar políticas.</div>
      </PageWithDocs>
    );
  }

  return (
    <PageWithDocs slug="policies">
      <section className="grid">
        <div className="info-banner">
          Para asignar este recurso a un cliente, ve a su perfil (Resumen del cliente).
        </div>
        {error && <div className="error-banner">{error}</div>}
        {listError && <div className="error-banner">{listError}</div>}

        {role === 'admin' && (
          <div className="card full-row">
            <div className="card-header">
              <div>
                <h2>Políticas creadas</h2>
                <p className="muted">Listado global de políticas por tenant.</p>
              </div>
            </div>
            <DataTable
              columns={[
                {
                  key: 'tenantId',
                  label: 'Tenant',
                  sortable: true,
                  render: (row: Policy) => tenantNameMap.get(row.tenantId) || row.tenantId
                },
                {
                  key: 'maxRequestsPerMinute',
                  label: 'RPM',
                  sortable: true
                },
                {
                  key: 'maxTokensPerDay',
                  label: 'Tokens/día',
                  sortable: true
                },
                {
                  key: 'maxCostPerDayUsd',
                  label: 'Coste/día',
                  sortable: true,
                  render: (row: Policy) =>
                    `${Number(row.maxCostPerDayUsd).toFixed(2)} USD · ${formatUsdWithEur(
                      Number(row.maxCostPerDayUsd)
                    )}`
                },
                {
                  key: 'redactionEnabled',
                  label: 'Redacción',
                  sortable: true,
                  render: (row: Policy) => (row.redactionEnabled ? 'ON' : 'OFF')
                },
                {
                  key: 'updatedAt',
                  label: 'Actualizado',
                  sortable: true,
                  render: (row: Policy) => new Date(row.updatedAt).toLocaleString()
                },
                {
                  key: 'actions',
                  label: 'Acciones',
                  render: (row: Policy) => (
                    <div className="row-actions">
                      <button
                        className="link"
                        onClick={() => setSelectedTenantId(row.tenantId)}
                      >
                        Editar
                      </button>
                      <button
                        className="link danger"
                        onClick={() => handleDelete(row.tenantId)}
                      >
                        Eliminar
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
            {listLoading && <div className="muted">Cargando políticas…</div>}
            {!listLoading && policies.length === 0 && (
              <div className="muted">No hay políticas creadas.</div>
            )}
          </div>
        )}

        <div className="card">
          <h2>Políticas</h2>
          <p className="muted">Gestión de límites y redacción por tenant.</p>
          <div className="form-grid">
            <FieldWithHelp help="policiesMaxRequestsPerMinute">
              <input
                type="number"
                placeholder="Requests por minuto (ej: 120)"
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
                placeholder="Tokens por día (ej: 200000)"
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
                  placeholder="Coste máximo diario USD (ej: 50)"
                  value={form.maxCostPerDayUsd}
                  onChange={(event) =>
                    setForm({ ...form, maxCostPerDayUsd: Number(event.target.value) })
                  }
                  disabled={!canEdit}
                />
                <span className="muted">≈ {formatUsdWithEur(Number(form.maxCostPerDayUsd || 0))}</span>
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
                Redacción habilitada
              </label>
            </FieldWithHelp>
            <FieldWithHelp help="policiesMetadata">
              <textarea
                placeholder='metadata JSON (ej: {"plan":"pro"})'
                value={form.metadata}
                onChange={(event) => setForm({ ...form, metadata: event.target.value })}
                rows={4}
                disabled={!canEdit}
              />
            </FieldWithHelp>
            <div className="form-actions">
              {canEdit ? (
                <button className="btn primary" onClick={handleSave}>
                  {policy ? 'Actualizar' : 'Crear'} política
                </button>
              ) : (
                <div className="muted">Solo el rol admin puede editar políticas.</div>
              )}
            </div>
          </div>
        </div>
      </section>
    </PageWithDocs>
  );
}
