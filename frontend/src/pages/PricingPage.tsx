import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import type { PricingEntry } from '../types';
import { PageWithDocs } from '../components/PageWithDocs';
import { FieldWithHelp } from '../components/FieldWithHelp';
import { formatUsdWithEur } from '../utils/currency';
import { useI18n } from '../i18n/I18nProvider';

export function PricingPage() {
  const { t } = useI18n();
  const [pricing, setPricing] = useState<PricingEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editingPricingId, setEditingPricingId] = useState<string | null>(null);
  const [pricingForm, setPricingForm] = useState({
    providerType: 'openai',
    model: '',
    inputCostPer1k: '',
    outputCostPer1k: '',
    enabled: true
  });
  const inputCostInt = Number.isInteger(Number(pricingForm.inputCostPer1k));
  const outputCostInt = Number.isInteger(Number(pricingForm.outputCostPer1k));
  const inputCostValue = Number(pricingForm.inputCostPer1k || 0);
  const outputCostValue = Number(pricingForm.outputCostPer1k || 0);
  const canSubmit =
    pricingForm.providerType.trim().length > 0 &&
    pricingForm.model.trim().length > 0 &&
    pricingForm.inputCostPer1k !== '' &&
    pricingForm.outputCostPer1k !== '' &&
    inputCostInt &&
    outputCostInt;

  useEffect(() => {
    const load = async () => {
      try {
        const pricingList = await api.getPricing();
        setPricing(pricingList);
      } catch (err: any) {
        setError(err.message || t('Error cargando pricing'));
      }
    };
    load();
  }, [t]);

  const resetPricingForm = () => {
    setEditingPricingId(null);
    setPricingForm({
      providerType: 'openai',
      model: '',
      inputCostPer1k: '',
      outputCostPer1k: '',
      enabled: true
    });
  };

  const handleCreateOrUpdatePricing = async () => {
    try {
      const payload = {
        providerType: pricingForm.providerType,
        model: pricingForm.model,
        inputCostPer1k: Number(pricingForm.inputCostPer1k),
        outputCostPer1k: Number(pricingForm.outputCostPer1k),
        enabled: pricingForm.enabled
      };
      if (editingPricingId) {
        const updated = await api.updatePricing(editingPricingId, payload);
        setPricing((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      } else {
        const created = await api.createPricing(payload);
        setPricing((prev) => [created, ...prev]);
      }
      resetPricingForm();
    } catch (err: any) {
      setError(err.message || t('Error guardando pricing'));
    }
  };

  const handleEditPricing = (entry: PricingEntry) => {
    setEditingPricingId(entry.id);
    setPricingForm({
      providerType: entry.providerType,
      model: entry.model,
      inputCostPer1k: String(entry.inputCostPer1k),
      outputCostPer1k: String(entry.outputCostPer1k),
      enabled: entry.enabled
    });
  };

  const handleTogglePricing = async (entry: PricingEntry) => {
    try {
      const updated = await api.updatePricing(entry.id, { enabled: !entry.enabled });
      setPricing((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    } catch (err: any) {
      setError(err.message || t('Error actualizando pricing'));
    }
  };

  return (
    <PageWithDocs slug="pricing">
      <section className="grid">
        <div className="info-banner">
          {t('Para asignar este recurso a un cliente, ve a su perfil (Resumen del cliente).')}
        </div>
        {error && <div className="error-banner">{error}</div>}

      <div className="card">
        <div className="card-header">
          <div>
            <h2>{t('Pricing')}</h2>
            <p className="muted">{t('Tarifas por proveedor/modelo.')}</p>
          </div>
          <Link className="btn" to="/api-keys">
            {t('Crear API key')}
          </Link>
        </div>
        <div className="form-grid">
          <FieldWithHelp help="pricingProviderType">
            <input
              placeholder={t('providerType (ej: openai)')}
              value={pricingForm.providerType}
              onChange={(event) =>
                setPricingForm({ ...pricingForm, providerType: event.target.value })
              }
            />
          </FieldWithHelp>
          <FieldWithHelp help="pricingModel">
            <input
              placeholder={t('model (ej: gpt-4o-mini)')}
              value={pricingForm.model}
              onChange={(event) => setPricingForm({ ...pricingForm, model: event.target.value })}
            />
          </FieldWithHelp>
          <FieldWithHelp help="pricingInputCostPer1k">
            <div className="field-stack">
              <input
                placeholder={t('inputCostPer1k USD (ej: 1)')}
                value={pricingForm.inputCostPer1k}
                onChange={(event) =>
                  setPricingForm({ ...pricingForm, inputCostPer1k: event.target.value })
                }
              />
              {pricingForm.inputCostPer1k !== '' && (
                <span className="muted">
                  {t('≈ {amount}', { amount: formatUsdWithEur(inputCostValue) })}
                </span>
              )}
            </div>
          </FieldWithHelp>
          <FieldWithHelp help="pricingOutputCostPer1k">
            <div className="field-stack">
              <input
                placeholder={t('outputCostPer1k USD (ej: 2)')}
                value={pricingForm.outputCostPer1k}
                onChange={(event) =>
                  setPricingForm({ ...pricingForm, outputCostPer1k: event.target.value })
                }
              />
              {pricingForm.outputCostPer1k !== '' && (
                <span className="muted">
                  {t('≈ {amount}', { amount: formatUsdWithEur(outputCostValue) })}
                </span>
              )}
            </div>
          </FieldWithHelp>
          {!inputCostInt || !outputCostInt ? (
            <div className="muted">{t('Los costes deben ser números enteros.')}</div>
          ) : null}
          <FieldWithHelp help="pricingEnabled">
            <label className="checkbox">
              <input
                type="checkbox"
                checked={pricingForm.enabled}
                onChange={(event) =>
                  setPricingForm({ ...pricingForm, enabled: event.target.checked })
                }
              />
              {t('Habilitado')}
            </label>
          </FieldWithHelp>
          <div className="form-actions">
            <button className="btn primary" onClick={handleCreateOrUpdatePricing} disabled={!canSubmit}>
              {editingPricingId ? t('Actualizar') : t('Crear')} {t('pricing')}
            </button>
            {editingPricingId && (
              <button className="btn" onClick={resetPricingForm}>
                {t('Cancelar')}
              </button>
            )}
          </div>
        </div>
        <div className="mini-list">
          {pricing.map((entry) => (
            <div className="mini-row" key={entry.id}>
              <span>{entry.providerType}</span>
              <span>{entry.model}</span>
              <span>{formatUsdWithEur(entry.inputCostPer1k)}</span>
              <span>{formatUsdWithEur(entry.outputCostPer1k)}</span>
              <span className={`status ${entry.enabled ? 'active' : 'disabled'}`}>
                {entry.enabled ? t('active') : t('disabled')}
              </span>
              <div className="row-actions">
                <button className="link" onClick={() => handleEditPricing(entry)}>
                  {t('Editar')}
                </button>
                <button className="link" onClick={() => handleTogglePricing(entry)}>
                  {entry.enabled ? t('Desactivar') : t('Activar')}
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
