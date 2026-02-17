import { useEffect, useRef, useState } from 'react';
import { api } from '../api';
import { PageWithDocs } from '../components/PageWithDocs';
import { emitToast } from '../toast';
import { copyToClipboard } from '../utils/clipboard';
import { storeTenantApiKey } from '../utils/apiKeyStorage';
import { FieldWithHelp } from '../components/FieldWithHelp';
import { useDashboard } from '../dashboard';
import { useI18n } from '../i18n/I18nProvider';

export function ApiKeysPage() {
  const { selectedTenantId } = useDashboard();
  const { t } = useI18n();
  const [keys, setKeys] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    tenantId: selectedTenantId ?? ''
  });
  const lastAutoTenantId = useRef<string | null>(null);

  const load = async () => {
    try {
      const list = await api.listApiKeys();
      setKeys(list);
    } catch (err: any) {
      setError(err.message || t('Error cargando API keys'));
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!selectedTenantId) {
      return;
    }
    setForm((prev) => {
      if (!prev.tenantId || prev.tenantId === lastAutoTenantId.current) {
        return { ...prev, tenantId: selectedTenantId };
      }
      return prev;
    });
    lastAutoTenantId.current = selectedTenantId;
  }, [selectedTenantId]);

  const handleCreate = async () => {
    try {
      setError(null);
      const payload: any = { name: form.name };
      if (form.tenantId) {
        payload.tenantId = form.tenantId;
      }
      const created = await api.createApiKey(payload);
      setCreatedKey(created.apiKey);
      if (payload.tenantId && created?.apiKey) {
        storeTenantApiKey(payload.tenantId, created.apiKey);
      }
      emitToast(t('API key creada'));
      setForm({ name: '', tenantId: '' });
      await load();
    } catch (err: any) {
      setError(err.message || t('Error creando API key'));
    }
  };

  const handleRevoke = async (id: string) => {
    try {
      setError(null);
      await api.revokeApiKey(id);
      emitToast(t('API key revocada'));
      await load();
    } catch (err: any) {
      setError(err.message || t('Error revocando API key'));
    }
  };

  return (
    <PageWithDocs slug="api-keys">
      <section className="grid">
        <div className="info-banner">
          {t('Para asignar este recurso a un cliente, ve a su perfil (Resumen del cliente).')}
        </div>
        {error && <div className="error-banner">{error}</div>}

        <div className="card">
          <h2>{t('Crear API Key')}</h2>
          <p className="muted">{t('Genera una API key para un tenant específico o global.')}</p>
          <div className="form-grid">
            <FieldWithHelp help="apiKeysName">
              <input
                placeholder={t('name (ej: cliente-acme)')}
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
              />
            </FieldWithHelp>
            <FieldWithHelp help="apiKeysTenantId">
              <input
                placeholder={t('tenantId (opcional, ej: 7d9f...)')}
                value={form.tenantId}
                onChange={(event) => setForm({ ...form, tenantId: event.target.value })}
              />
            </FieldWithHelp>
            <div className="form-actions">
              <button className="btn primary" onClick={handleCreate} disabled={!form.name.trim()}>
                {t('Crear API key')}
              </button>
            </div>
          </div>
          {createdKey && (
            <div className="mini-list">
              <div className="mini-row">
                <span>{t('API Key')}</span>
                <span>{createdKey}</span>
                <div className="row-actions">
                  <button
                    className="link"
                    onClick={() => copyToClipboard(createdKey, 'API key')}
                  >
                    {t('Copiar')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="card">
          <h2>{t('API Keys')}</h2>
          <div className="mini-list">
            {keys.map((key) => (
              <div className="mini-row" key={key.id}>
                <span>{key.name}</span>
                <span>{key.tenantId || t('global')}</span>
                <span className={`status ${key.status}`}>{key.status}</span>
                <div className="row-actions">
                  <button className="link" onClick={() => handleRevoke(key.id)}>
                    {t('Revocar')}
                  </button>
                </div>
              </div>
            ))}
          </div>
          {keys.length === 0 && <div className="muted">{t('Sin API keys.')}</div>}
        </div>
      </section>
    </PageWithDocs>
  );
}
