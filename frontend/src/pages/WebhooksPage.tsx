import { useEffect, useState } from 'react';
import { api } from '../api';
import type { Webhook } from '../types';
import { PageWithDocs } from '../components/PageWithDocs';
import { FieldWithHelp } from '../components/FieldWithHelp';

export function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editingWebhookId, setEditingWebhookId] = useState<string | null>(null);
  const [webhookForm, setWebhookForm] = useState({
    tenantId: '',
    url: '',
    events: 'audit.event',
    secret: '',
    enabled: true
  });

  useEffect(() => {
    const load = async () => {
      try {
        const list = await api.getWebhooks();
        setWebhooks(list);
      } catch (err: any) {
        setError(err.message || 'Error cargando webhooks');
      }
    };
    load();
  }, []);

  const resetWebhookForm = () => {
    setEditingWebhookId(null);
    setWebhookForm({ tenantId: '', url: '', events: 'audit.event', secret: '', enabled: true });
  };

  const handleCreateOrUpdateWebhook = async () => {
    try {
      const payload = {
        tenantId: webhookForm.tenantId || undefined,
        url: webhookForm.url,
        events: webhookForm.events.split(',').map((item) => item.trim()),
        secret: webhookForm.secret || undefined,
        enabled: webhookForm.enabled
      };
      if (editingWebhookId) {
        const updated = await api.updateWebhook(editingWebhookId, payload);
        setWebhooks((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      } else {
        const created = await api.createWebhook(payload);
        setWebhooks((prev) => [created, ...prev]);
      }
      resetWebhookForm();
    } catch (err: any) {
      setError(err.message || 'Error guardando webhook');
    }
  };

  const handleEditWebhook = (hook: Webhook) => {
    setEditingWebhookId(hook.id);
    setWebhookForm({
      tenantId: hook.tenantId || '',
      url: hook.url,
      events: hook.events.join(', '),
      secret: '',
      enabled: hook.enabled
    });
  };

  const handleToggleWebhook = async (hook: Webhook) => {
    try {
      const updated = await api.updateWebhook(hook.id, { enabled: !hook.enabled });
      setWebhooks((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    } catch (err: any) {
      setError(err.message || 'Error actualizando webhook');
    }
  };

  return (
    <PageWithDocs slug="webhooks">
      <section className="grid">
        <div className="info-banner">
          Para asignar este recurso a un cliente, ve a su perfil (Resumen del cliente).
        </div>
        {error && <div className="error-banner">{error}</div>}

      <div className="card">
        <h2>Webhooks</h2>
        <p className="muted">Exportación de auditoría.</p>
        <div className="form-grid">
          <FieldWithHelp help="webhooksTenantId">
            <input
              placeholder="tenantId (opcional, ej: 7d9f...)"
              value={webhookForm.tenantId}
              onChange={(event) =>
                setWebhookForm({ ...webhookForm, tenantId: event.target.value })
              }
            />
          </FieldWithHelp>
          <FieldWithHelp help="webhooksUrl">
            <input
              placeholder="url (ej: https://hooks.tuapp.com/audit)"
              value={webhookForm.url}
              onChange={(event) => setWebhookForm({ ...webhookForm, url: event.target.value })}
            />
          </FieldWithHelp>
          <FieldWithHelp help="webhooksEvents">
            <input
              placeholder="events (comma) ej: audit.event, usage.alert"
              value={webhookForm.events}
              onChange={(event) => setWebhookForm({ ...webhookForm, events: event.target.value })}
            />
          </FieldWithHelp>
          <FieldWithHelp help="webhooksSecret">
            <input
              placeholder="secret (opcional, ej: supersecret)"
              value={webhookForm.secret}
              onChange={(event) => setWebhookForm({ ...webhookForm, secret: event.target.value })}
            />
          </FieldWithHelp>
          <FieldWithHelp help="webhooksEnabled">
            <label className="checkbox">
              <input
                type="checkbox"
                checked={webhookForm.enabled}
                onChange={(event) =>
                  setWebhookForm({ ...webhookForm, enabled: event.target.checked })
                }
              />
              Habilitado
            </label>
          </FieldWithHelp>
          <div className="form-actions">
            <button className="btn primary" onClick={handleCreateOrUpdateWebhook}>
              {editingWebhookId ? 'Actualizar' : 'Crear'} webhook
            </button>
            {editingWebhookId && (
              <button className="btn" onClick={resetWebhookForm}>
                Cancelar
              </button>
            )}
          </div>
        </div>
        <div className="mini-list">
          {webhooks.map((hook) => (
            <div className="mini-row" key={hook.id}>
              <span>{hook.tenantId || 'global'}</span>
              <span>{hook.url}</span>
              <span>{hook.events.join(', ')}</span>
              <span className={`status ${hook.enabled ? 'active' : 'disabled'}`}>
                {hook.enabled ? 'active' : 'disabled'}
              </span>
              <div className="row-actions">
                <button className="link" onClick={() => handleEditWebhook(hook)}>
                  Editar
                </button>
                <button className="link" onClick={() => handleToggleWebhook(hook)}>
                  {hook.enabled ? 'Desactivar' : 'Activar'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      </section>
    </PageWithDocs>
  );
}
