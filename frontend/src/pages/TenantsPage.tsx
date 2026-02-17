import { useState } from 'react';
import { api } from '../api';
import { useDashboard } from '../dashboard';
import { useAuth } from '../auth';
import type { Tenant } from '../types';
import { FieldWithHelp } from '../components/FieldWithHelp';
import { PageWithDocs } from '../components/PageWithDocs';
import { DataTable } from '../components/DataTable';
import { StatusBadgeIcon } from '../components/StatusBadgeIcon';
import { useI18n } from '../i18n/I18nProvider';

export function TenantsPage() {
  const { role } = useAuth();
  const { t } = useI18n();
  const isAdmin = role === 'admin';
  const { tenants, loading, error, refreshTenants } = useDashboard();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    status: 'active',
    killSwitch: false,
    billingEmail: '',
    authUsername: '',
    authPassword: ''
  });
  const [actionError, setActionError] = useState<string | null>(null);

  const resetForm = () => {
    setEditingId(null);
    setForm({
      name: '',
      status: 'active',
      killSwitch: false,
      billingEmail: '',
      authUsername: '',
      authPassword: ''
    });
  };

  const handleSubmit = async () => {
    try {
      setActionError(null);
      if (editingId) {
        const payload = {
          name: form.name,
          status: form.status,
          killSwitch: form.killSwitch,
          billingEmail: form.billingEmail,
          authUsername: form.authUsername || null,
          ...(form.authPassword ? { authPassword: form.authPassword } : {})
        };
        await api.updateTenant(editingId, payload);
      } else {
        await api.createTenant({
          name: form.name,
          killSwitch: form.killSwitch,
          billingEmail: form.billingEmail || undefined,
          authUsername: form.authUsername || undefined,
          authPassword: form.authPassword || undefined
        });
      }
      await refreshTenants();
      resetForm();
    } catch (err: any) {
      setActionError(err.message || t('Error guardando tenant'));
    }
  };

  const handleEdit = (tenant: Tenant) => {
    setEditingId(tenant.id);
    setForm({
      name: tenant.name,
      status: tenant.status,
      killSwitch: tenant.killSwitch,
      billingEmail: tenant.billingEmail || '',
      authUsername: tenant.authUsername || '',
      authPassword: ''
    });
  };

  const handleToggleKillSwitch = async (tenant: Tenant) => {
    try {
      setActionError(null);
      await api.toggleTenantKillSwitch(tenant.id, !tenant.killSwitch);
      await refreshTenants();
    } catch (err: any) {
      setActionError(err.message || t('Error actualizando kill switch'));
    }
  };

  return (
    <PageWithDocs slug="tenants">
      <section className="grid">
        {error && <div className="error-banner full-row">{error}</div>}
        {actionError && <div className="error-banner full-row">{actionError}</div>}

        {isAdmin && (
          <div className="card full-row">
            <h2>{editingId ? t('Editar cliente') : t('Nuevo cliente')}</h2>
            <p className="muted">{t('Crea o actualiza clientes desde el backoffice.')}</p>
            <div className="form-grid">
              <FieldWithHelp help="tenantsName">
                <input
                  placeholder={t('Nombre (ej: Cliente Acme)')}
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                />
              </FieldWithHelp>
              <FieldWithHelp help="tenantsBillingEmail">
                <input
                  placeholder={t('Email facturación (ej: billing@cliente.com)')}
                  value={form.billingEmail}
                  onChange={(event) =>
                    setForm({ ...form, billingEmail: event.target.value })
                  }
                />
              </FieldWithHelp>
              {editingId && (
                <FieldWithHelp help="tenantsStatus">
                  <select
                    value={form.status}
                    onChange={(event) => setForm({ ...form, status: event.target.value })}
                  >
                    <option value="active">{t('active')}</option>
                    <option value="suspended">{t('suspended')}</option>
                    <option value="disabled">{t('disabled')}</option>
                  </select>
                </FieldWithHelp>
              )}
            <FieldWithHelp help="tenantsKillSwitch">
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={form.killSwitch}
                  onChange={(event) => setForm({ ...form, killSwitch: event.target.checked })}
                />
                {t('Kill switch')}
              </label>
            </FieldWithHelp>
            <FieldWithHelp help="tenantsPortalUsername">
              <input
                placeholder={t('Usuario portal (ej: cliente_acme)')}
                value={form.authUsername}
                onChange={(event) => setForm({ ...form, authUsername: event.target.value })}
              />
            </FieldWithHelp>
            <FieldWithHelp help="tenantsPortalPassword">
              <input
                type="password"
                placeholder={
                  editingId
                    ? t('Nueva contraseña (opcional)')
                    : t('Contraseña inicial')
                }
                value={form.authPassword}
                onChange={(event) => setForm({ ...form, authPassword: event.target.value })}
              />
            </FieldWithHelp>
            <div className="form-actions">
              <button className="btn primary" onClick={handleSubmit}>
                {editingId ? t('Actualizar') : t('Crear')}
              </button>
                {editingId && (
                  <button className="btn" onClick={resetForm}>
                    {t('Cancelar')}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="card full-row">
          <h2>{t('Clientes')}</h2>
          <p className="muted">{t('Gestión multi-tenant y control de estado.')}</p>
          {loading && <div className="muted">{t('Cargando clientes...')}</div>}
          {!loading && tenants.length === 0 && (
            <div className="muted">{t('No hay clientes.')}</div>
          )}
          {tenants.length > 0 && (
            <DataTable
              columns={[
                { key: 'id', label: t('ID'), sortable: true },
                { key: 'name', label: t('Nombre'), sortable: true },
                {
                  key: 'status',
                  label: t('Estado'),
                  sortable: true,
                  render: (tenant: Tenant) => <StatusBadgeIcon status={tenant.status} />
                },
                ...(isAdmin
                  ? [
                      {
                        key: 'killSwitch',
                        label: t('Kill switch'),
                        sortable: true,
                        render: (tenant: Tenant) =>
                          tenant.killSwitch ? t('ON') : t('OFF')
                      }
                    ]
                  : []),
                ...(isAdmin
                  ? [
                      {
                        key: 'actions',
                        label: t('Acciones'),
                        render: (tenant: Tenant) => (
                          <div className="row-actions">
                            <button className="link" onClick={() => handleEdit(tenant)}>
                              {t('Editar')}
                            </button>
                            <button
                              className="link"
                              onClick={() => handleToggleKillSwitch(tenant)}
                            >
                              {tenant.killSwitch ? t('Desactivar') : t('Activar')}
                            </button>
                          </div>
                        )
                      }
                    ]
                  : [])
              ]}
              data={tenants}
              getRowId={(tenant) => tenant.id}
              pageSize={8}
              filterKeys={['id', 'name', 'status']}
            />
          )}
        </div>
      </section>
    </PageWithDocs>
  );
}
