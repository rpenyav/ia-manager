import { useEffect, useState } from 'react';
import { api } from '../api';
import { useDashboard } from '../dashboard';
import type { Provider } from '../types';
import { PageWithDocs } from '../components/PageWithDocs';
import { emitToast } from '../toast';
import { FieldWithHelp } from '../components/FieldWithHelp';

export function ProvidersPage() {
  const { selectedTenantId } = useDashboard();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    type: 'azure-openai',
    displayName: '',
    credentials: '',
    config: '{}',
    enabled: true
  });

  useEffect(() => {
    if (!selectedTenantId) {
      return;
    }
    const load = async () => {
      try {
        const providerList = await api.getProviders(selectedTenantId);
        setProviders(providerList);
      } catch (err: any) {
        setError(err.message || 'Error cargando providers');
      }
    };
    load();
  }, [selectedTenantId]);

  const resetForm = () => {
    setEditingId(null);
    setForm({
      type: 'azure-openai',
      displayName: '',
      credentials: '',
      config: '{}',
      enabled: true
    });
  };

  const handleSubmit = async () => {
    if (!selectedTenantId) {
      return;
    }
    try {
      setActionError(null);
      let config: Record<string, unknown> = {};
      if (form.config) {
        try {
          config = JSON.parse(form.config);
        } catch {
          throw new Error('Config debe ser JSON válido');
        }
      }
      const payload: any = {
        type: form.type,
        displayName: form.displayName,
        config,
        enabled: form.enabled
      };
      if (form.credentials) {
        try {
          JSON.parse(form.credentials);
        } catch {
          throw new Error('Credenciales deben ser JSON válido');
        }
        payload.credentials = form.credentials;
      }
      if (editingId) {
        const updated = await api.updateProvider(selectedTenantId, editingId, payload);
        setProviders((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
        emitToast('Provider actualizado');
      } else {
        if (!form.credentials) {
          throw new Error('Credenciales requeridas para crear provider');
        }
        const created = await api.createProvider(selectedTenantId, payload);
        setProviders((prev) => [created, ...prev]);
        emitToast('Provider creado');
      }
      resetForm();
    } catch (err: any) {
      setActionError(err.message || 'Error guardando provider');
    }
  };

  const handleEdit = (provider: Provider) => {
    setEditingId(provider.id);
    setForm({
      type: provider.type,
      displayName: provider.displayName,
      credentials: '',
      config: JSON.stringify(provider.config ?? {}, null, 2),
      enabled: provider.enabled
    });
  };

  const handleToggle = async (provider: Provider) => {
    if (!selectedTenantId) {
      return;
    }
    try {
      setActionError(null);
      const updated = await api.updateProvider(selectedTenantId, provider.id, {
        enabled: !provider.enabled
      });
      setProviders((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    } catch (err: any) {
      setActionError(err.message || 'Error actualizando provider');
    }
  };

  if (!selectedTenantId) {
    return (
      <PageWithDocs slug="providers">
        <div className="muted">Selecciona un tenant para ver proveedores.</div>
      </PageWithDocs>
    );
  }

  return (
    <PageWithDocs slug="providers">
      <section className="grid">
        <div className="info-banner">
          Para asignar este recurso a un cliente, ve a su perfil (Resumen del cliente).
        </div>
        {error && <div className="error-banner">{error}</div>}
        {actionError && <div className="error-banner">{actionError}</div>}

        <div className="card">
          <h2>{editingId ? 'Editar provider' : 'Nuevo provider'}</h2>
          <p className="muted">Registra el proveedor LLM del cliente.</p>
          <div className="form-grid">
            <FieldWithHelp help="providersType">
              <input
                placeholder="type (ej: openai, azure-openai)"
                value={form.type}
                onChange={(event) => setForm({ ...form, type: event.target.value })}
              />
            </FieldWithHelp>
            <FieldWithHelp help="providersDisplayName">
              <input
                placeholder="displayName (ej: OpenAI Cliente X)"
                value={form.displayName}
                onChange={(event) => setForm({ ...form, displayName: event.target.value })}
              />
            </FieldWithHelp>
            <FieldWithHelp help="providersCredentials">
              <textarea
                placeholder='credentials JSON (ej: {"apiKey":"sk-...","baseUrl":"https://api.openai.com"})'
                value={form.credentials}
                onChange={(event) => setForm({ ...form, credentials: event.target.value })}
                rows={4}
              />
            </FieldWithHelp>
            <FieldWithHelp help="providersConfig">
              <textarea
                placeholder='config JSON (ej: {})'
                value={form.config}
                onChange={(event) => setForm({ ...form, config: event.target.value })}
                rows={4}
              />
            </FieldWithHelp>
            <FieldWithHelp help="providersEnabled">
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={form.enabled}
                  onChange={(event) => setForm({ ...form, enabled: event.target.checked })}
                />
                Habilitado
              </label>
            </FieldWithHelp>
            <div className="form-actions">
              <button className="btn primary" onClick={handleSubmit}>
                {editingId ? 'Actualizar' : 'Crear'}
              </button>
              {editingId && (
                <button className="btn" onClick={resetForm}>
                  Cancelar
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="card">
          <h2>Providers</h2>
          <p className="muted">Credenciales cifradas y control de estado.</p>
          <div className="providers">
            {providers.map((provider) => (
              <div className="provider" key={provider.id}>
                <div>
                  <div className="provider-title">{provider.displayName}</div>
                  <div className="muted">{provider.type}</div>
                </div>
                <div className="provider-meta">
                  <span>{provider.tenantId}</span>
                  <span className={`status ${provider.enabled ? 'active' : 'disabled'}`}>
                    {provider.enabled ? 'enabled' : 'disabled'}
                  </span>
                </div>
                <div className="row-actions">
                  <button className="link" onClick={() => handleEdit(provider)}>
                    Editar
                  </button>
                  <button className="link" onClick={() => handleToggle(provider)}>
                    {provider.enabled ? 'Desactivar' : 'Activar'}
                  </button>
                </div>
              </div>
            ))}
          </div>
          {providers.length === 0 && <div className="muted">No hay proveedores.</div>}
        </div>
      </section>
    </PageWithDocs>
  );
}
