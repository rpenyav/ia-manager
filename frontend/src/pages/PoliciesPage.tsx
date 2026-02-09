import { useEffect, useState } from 'react';
import { api } from '../api';
import { useDashboard } from '../dashboard';
import { PageWithDocs } from '../components/PageWithDocs';
import { FieldWithHelp } from '../components/FieldWithHelp';
import type { Policy } from '../types';
import { formatUsdWithEur } from '../utils/currency';

export function PoliciesPage() {
  const { selectedTenantId } = useDashboard();
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    maxRequestsPerMinute: 60,
    maxTokensPerDay: 200000,
    maxCostPerDayUsd: 0,
    redactionEnabled: true,
    metadata: '{}'
  });

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

  const handleSave = async () => {
    if (!selectedTenantId) {
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
    } catch (err: any) {
      setError(err.message || 'Error guardando política');
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
              />
            </FieldWithHelp>
            <div className="form-actions">
              <button className="btn primary" onClick={handleSave}>
                {policy ? 'Actualizar' : 'Crear'} política
              </button>
            </div>
          </div>
        </div>
      </section>
    </PageWithDocs>
  );
}
