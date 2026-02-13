import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import { PageWithDocs } from "../components/PageWithDocs";
import { FieldWithHelp } from "../components/FieldWithHelp";
import type { ServiceCatalogItem } from "../types";
import { emitToast } from "../toast";

const CODE_REGEX = /^[a-z0-9-]{3,64}$/;
const normalizeBool = (value: boolean | undefined | null) =>
  value == null ? true : value;

export function ServiceEditorPage() {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const isNew = !serviceId;
  const [loading, setLoading] = useState(!isNew);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    code: "",
    name: "",
    description: "",
    apiBaseUrl: "",
    priceMonthlyEur: "",
    priceAnnualEur: "",
    enabled: true,
    endpointsEnabled: true,
  });
  const codeValue = form.code.trim();
  const codeValid = codeValue.length > 0 && CODE_REGEX.test(codeValue);
  const priceMonthly = Number(form.priceMonthlyEur);
  const priceAnnual = Number(form.priceAnnualEur);
  const pricesValid =
    Number.isFinite(priceMonthly) &&
    Number.isFinite(priceAnnual) &&
    priceMonthly > 0 &&
    priceAnnual > 0;

  useEffect(() => {
    if (isNew) {
      return;
    }
    const load = async () => {
      try {
        setLoading(true);
        const list = await api.listServiceCatalog();
        const match = (list as ServiceCatalogItem[]).find(
          (item) => item.id === serviceId,
        );
        if (!match) {
          throw new Error("Servicio no encontrado");
        }
        setForm({
          code: match.code || "",
          name: match.name || "",
          description: match.description || "",
          apiBaseUrl: match.apiBaseUrl || "",
          priceMonthlyEur: String(match.priceMonthlyEur ?? ""),
          priceAnnualEur: String(match.priceAnnualEur ?? ""),
          enabled: match.enabled,
          endpointsEnabled: normalizeBool(match.endpointsEnabled),
        });
        setError(null);
      } catch (err: any) {
        setError(err.message || "Error cargando servicio");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isNew, serviceId]);

  const canSubmit = useMemo(() => {
    if (!codeValid) return false;
    if (!form.name.trim()) return false;
    if (!form.description.trim()) return false;
    if (!pricesValid) return false;
    return true;
  }, [
    codeValid,
    form.name,
    form.description,
    pricesValid,
  ]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      const payload = {
        code: form.code.trim(),
        name: form.name.trim(),
        description: form.description.trim(),
        apiBaseUrl: form.apiBaseUrl.trim() || null,
        priceMonthlyEur: priceMonthly,
        priceAnnualEur: priceAnnual,
        enabled: form.enabled,
        endpointsEnabled: form.endpointsEnabled,
      };
      if (isNew) {
        await api.createServiceCatalog(payload);
        emitToast("Servicio creado");
        navigate("/services");
      } else if (serviceId) {
        await api.updateServiceCatalog(serviceId, payload);
        emitToast("Servicio actualizado");
      }
    } catch (err: any) {
      setError(err.message || "Error guardando servicio");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PageWithDocs slug="services">
        <div className="muted">Cargando servicio...</div>
      </PageWithDocs>
    );
  }

  return (
    <PageWithDocs slug="services">
      <section className="grid">
        {error && <div className="error-banner">{error}</div>}
        <div className="card">
          <div className="card-header">
            <div>
              <h2>{isNew ? "Nuevo servicio" : "Editar servicio"}</h2>
              <p className="muted">
                Configura el servicio que estará disponible para los tenants.
              </p>
            </div>
            <Link className="btn" to="/services">
              Volver
            </Link>
          </div>
          <div className="form-grid">
            <div className="info-banner full-row">
              Los endpoints se definen cuando el servicio se asigna a un tenant.
              Aquí solo indicamos si el servicio soporta endpoints.
            </div>
            <FieldWithHelp help="serviceCode">
              <div className="field-stack">
                <input
                  placeholder="Código único (ej: chatbot-general)"
                  value={form.code}
                  onChange={(event) =>
                    setForm({ ...form, code: event.target.value })
                  }
                />
                <span className="muted">
                  Usa 3-64 caracteres en minúsculas, números o guiones.
                </span>
                {form.code.length > 0 && !codeValid && (
                  <div className="error-banner">
                    Código inválido. Solo minúsculas, números o guiones.
                  </div>
                )}
              </div>
            </FieldWithHelp>
            <FieldWithHelp help="serviceName">
              <input
                placeholder="Nombre del servicio"
                value={form.name}
                onChange={(event) =>
                  setForm({ ...form, name: event.target.value })
                }
              />
            </FieldWithHelp>
            <FieldWithHelp help="serviceDescription">
              <textarea
                placeholder="Descripción principal"
                value={form.description}
                onChange={(event) =>
                  setForm({ ...form, description: event.target.value })
                }
                rows={3}
              />
            </FieldWithHelp>
            <FieldWithHelp help="serviceApiBaseUrl">
              <input
                placeholder="URL base de la API (opcional)"
                value={form.apiBaseUrl}
                onChange={(event) =>
                  setForm({ ...form, apiBaseUrl: event.target.value })
                }
              />
            </FieldWithHelp>
            <FieldWithHelp help="servicePriceMonthly">
              <input
                type="number"
                step="0.01"
                placeholder="Precio mensual EUR"
                value={form.priceMonthlyEur}
                onChange={(event) =>
                  setForm({ ...form, priceMonthlyEur: event.target.value })
                }
              />
            </FieldWithHelp>
            <FieldWithHelp help="servicePriceAnnual">
              <input
                type="number"
                step="0.01"
                placeholder="Precio anual EUR"
                value={form.priceAnnualEur}
                onChange={(event) =>
                  setForm({ ...form, priceAnnualEur: event.target.value })
                }
              />
            </FieldWithHelp>
            {!pricesValid && (
              <div className="muted">
                Los precios deben ser números mayores que 0.
              </div>
            )}
            <FieldWithHelp help="serviceEndpointsEnabled">
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={form.endpointsEnabled}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      endpointsEnabled: event.target.checked,
                    })
                  }
                />
                Permite endpoints configurables
              </label>
            </FieldWithHelp>
            <FieldWithHelp help="serviceEnabled">
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={form.enabled}
                  onChange={(event) =>
                    setForm({ ...form, enabled: event.target.checked })
                  }
                />
                Habilitado
              </label>
            </FieldWithHelp>
            <div className="form-actions">
              <button
                className="btn primary"
                onClick={handleSave}
                disabled={!canSubmit || saving}
              >
                {saving ? "Guardando..." : "Guardar servicio"}
              </button>
              <Link className="btn" to="/services">
                Cancelar
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PageWithDocs>
  );
}
