import { useEffect, useState } from 'react';
import { api } from '../api';
import type { NotificationChannel } from '../types';
import { PageWithDocs } from '../components/PageWithDocs';
import { FieldWithHelp } from '../components/FieldWithHelp';

export function NotificationsPage() {
  const [channels, setChannels] = useState<NotificationChannel[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editingChannelId, setEditingChannelId] = useState<string | null>(null);
  const [channelForm, setChannelForm] = useState({
    tenantId: '',
    type: 'email',
    name: '',
    recipients: '',
    webhookUrl: '',
    enabled: true
  });

  useEffect(() => {
    const load = async () => {
      try {
        const list = await api.getNotifications();
        setChannels(list);
      } catch (err: any) {
        setError(err.message || 'Error cargando canales');
      }
    };
    load();
  }, []);

  const resetChannelForm = () => {
    setEditingChannelId(null);
    setChannelForm({ tenantId: '', type: 'email', name: '', recipients: '', webhookUrl: '', enabled: true });
  };

  const handleCreateOrUpdateChannel = async () => {
    try {
      const payload = {
        tenantId: channelForm.tenantId || undefined,
        type: channelForm.type,
        name: channelForm.name || undefined,
        recipients: channelForm.recipients
          ? channelForm.recipients.split(',').map((item) => item.trim())
          : undefined,
        webhookUrl: channelForm.webhookUrl || undefined,
        enabled: channelForm.enabled
      };
      if (editingChannelId) {
        const updated = await api.updateNotification(editingChannelId, payload);
        setChannels((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      } else {
        const created = await api.createNotification(payload);
        setChannels((prev) => [created, ...prev]);
      }
      resetChannelForm();
    } catch (err: any) {
      setError(err.message || 'Error guardando canal');
    }
  };

  const handleEditChannel = (channel: NotificationChannel) => {
    setEditingChannelId(channel.id);
    setChannelForm({
      tenantId: channel.tenantId || '',
      type: channel.type,
      name: channel.config?.name || '',
      recipients: channel.config?.recipients?.join(', ') || '',
      webhookUrl: channel.config?.webhookUrl || '',
      enabled: channel.enabled
    });
  };

  const handleToggleChannel = async (channel: NotificationChannel) => {
    try {
      const updated = await api.updateNotification(channel.id, { enabled: !channel.enabled });
      setChannels((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    } catch (err: any) {
      setError(err.message || 'Error actualizando canal');
    }
  };

  return (
    <PageWithDocs slug="notifications">
      <section className="grid">
        <div className="info-banner">
          Para asignar este recurso a un cliente, ve a su perfil (Resumen del cliente).
        </div>
        {error && <div className="error-banner">{error}</div>}

      <div className="card">
        <h2>Alertas (Email/Slack)</h2>
        <p className="muted">Canales de notificación por tenant o global.</p>
        <div className="form-grid">
          <FieldWithHelp help="notificationsTenantId">
            <input
              placeholder="tenantId (opcional, ej: 7d9f...)"
              value={channelForm.tenantId}
              onChange={(event) =>
                setChannelForm({ ...channelForm, tenantId: event.target.value })
              }
            />
          </FieldWithHelp>
          <FieldWithHelp help="notificationsType">
            <select
              value={channelForm.type}
              onChange={(event) => setChannelForm({ ...channelForm, type: event.target.value })}
            >
              <option value="email">Email</option>
              <option value="slack">Slack</option>
            </select>
          </FieldWithHelp>
          <FieldWithHelp help="notificationsName">
            <input
              placeholder="name (ej: Alerts Ops)"
              value={channelForm.name}
              onChange={(event) => setChannelForm({ ...channelForm, name: event.target.value })}
            />
          </FieldWithHelp>
          <FieldWithHelp help="notificationsRecipients">
            <input
              placeholder="recipients (email, comma) ej: ops@acme.com, it@acme.com"
              value={channelForm.recipients}
              onChange={(event) =>
                setChannelForm({ ...channelForm, recipients: event.target.value })
              }
            />
          </FieldWithHelp>
          <FieldWithHelp help="notificationsWebhookUrl">
            <input
              placeholder="slack webhook url (ej: https://hooks.slack.com/services/...)"
              value={channelForm.webhookUrl}
              onChange={(event) =>
                setChannelForm({ ...channelForm, webhookUrl: event.target.value })
              }
            />
          </FieldWithHelp>
          <FieldWithHelp help="notificationsEnabled">
            <label className="checkbox">
              <input
                type="checkbox"
                checked={channelForm.enabled}
                onChange={(event) =>
                  setChannelForm({ ...channelForm, enabled: event.target.checked })
                }
              />
              Habilitado
            </label>
          </FieldWithHelp>
          <div className="form-actions">
            <button className="btn primary" onClick={handleCreateOrUpdateChannel}>
              {editingChannelId ? 'Actualizar' : 'Crear'} canal
            </button>
            {editingChannelId && (
              <button className="btn" onClick={resetChannelForm}>
                Cancelar
              </button>
            )}
          </div>
        </div>
        <div className="mini-list">
          {channels.map((channel) => (
            <div className="mini-row" key={channel.id}>
              <span>{channel.type}</span>
              <span>{channel.tenantId || 'global'}</span>
              <span>{channel.config?.name || '-'}</span>
              <span className={`status ${channel.enabled ? 'active' : 'disabled'}`}>
                {channel.enabled ? 'active' : 'disabled'}
              </span>
              <div className="row-actions">
                <button className="link" onClick={() => handleEditChannel(channel)}>
                  Editar
                </button>
                <button className="link" onClick={() => handleToggleChannel(channel)}>
                  {channel.enabled ? 'Desactivar' : 'Activar'}
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
