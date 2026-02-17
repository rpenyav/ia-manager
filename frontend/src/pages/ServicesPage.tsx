import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import type { ServiceCatalogItem } from "../types";
import { PageWithDocs } from "../components/PageWithDocs";
import { formatEur } from "../utils/currency";
import { emitToast } from "../toast";
import Swal from "sweetalert2";
import { useI18n } from "../i18n/I18nProvider";

export function ServicesPage() {
  const { t } = useI18n();
  const [services, setServices] = useState<ServiceCatalogItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const list = await api.listServiceCatalog();
        setServices(list as ServiceCatalogItem[]);
        setError(null);
      } catch (err: any) {
        setError(err.message || t("Error cargando servicios"));
      }
    };
    load();
  }, [t]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) {
      return services;
    }
    return services.filter((service) => {
      return (
        service.name.toLowerCase().includes(term) ||
        service.code.toLowerCase().includes(term)
      );
    });
  }, [services, query]);

  const handleToggle = async (service: ServiceCatalogItem) => {
    try {
      setBusyId(service.id);
      const updated = await api.updateServiceCatalog(service.id, {
        enabled: !service.enabled,
      });
      setServices((prev) =>
        prev.map((item) => (item.id === service.id ? updated : item)),
      );
      emitToast(
        service.enabled ? t("Servicio desactivado") : t("Servicio activado"),
      );
      setError(null);
    } catch (err: any) {
      setError(err.message || t("Error actualizando servicio"));
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (service: ServiceCatalogItem) => {
    const result = await Swal.fire({
      title: t("Eliminar servicio"),
      text: t("¿Eliminar {name}? Esta acción es irreversible.", {
        name: service.name,
      }),
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: t("Eliminar"),
      cancelButtonText: t("Cancelar"),
    });
    if (!result.isConfirmed) {
      return;
    }
    try {
      setBusyId(service.id);
      await api.deleteServiceCatalog(service.id);
      setServices((prev) => prev.filter((item) => item.id !== service.id));
      emitToast(t("Servicio eliminado"));
      setError(null);
    } catch (err: any) {
      setError(err.message || t("Error eliminando servicio"));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <PageWithDocs slug="services">
      <section className="grid">
        {error && <div className="error-banner">{error}</div>}
        <div className="card">
          <div className="card-header">
            <div>
              <h2>{t("Servicios")}</h2>
              <p className="muted">
                {t("Catálogo de servicios disponibles para clientes.")}
              </p>
            </div>
            <div className="card-header-actions">
              <Link className="btn" to="/">
                {t("Volver")}
              </Link>
              <Link className="btn primary" to="/services/new">
                {t("Crear servicio")}
              </Link>
            </div>
          </div>
          <div className="data-table-controls">
            <input
              placeholder={t("Buscar por nombre o código")}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <div className="table table-services">
            <div className="table-header">
              <span>{t("Servicio")}</span>
              <span>{t("Código")}</span>
              <span>{t("Precio mensual")}</span>
              <span>{t("Precio anual")}</span>
              <span>{t("Endpoints")}</span>
              <span>{t("Estado")}</span>
              <span>{t("Acciones")}</span>
            </div>
            {filtered.map((service) => (
              <div className="table-row mb-3" key={service.id}>
                <div className="cell-stack">
                  <span>{service.name}</span>
                  <span className="muted">{service.description}</span>
                </div>
                <span className="muted">{service.code}</span>
                <span>{formatEur(service.priceMonthlyEur)}</span>
                <span>{formatEur(service.priceAnnualEur)}</span>
                <span className="muted">
                  {service.endpointsEnabled !== false ? t("sí") : t("no")}
                </span>
                <span
                  className={`status ${service.enabled ? "active" : "disabled"}`}
                >
                  {service.enabled ? t("activo") : t("inactivo")}
                </span>
                <div className="row-actions">
                  <Link className="link" to={`/services/${service.id}`}>
                    {t("Editar")}
                  </Link>
                  <button
                    className="link"
                    onClick={() => handleToggle(service)}
                    disabled={busyId === service.id}
                  >
                    {service.enabled ? t("Desactivar") : t("Activar")}
                  </button>
                  <button
                    className="link"
                    onClick={() => handleDelete(service)}
                    disabled={busyId === service.id}
                  >
                    {t("Eliminar")}
                  </button>
                </div>
              </div>
            ))}
          </div>
          {filtered.length === 0 && (
            <div className="muted">{t("No hay servicios disponibles.")}</div>
          )}
        </div>
      </section>
    </PageWithDocs>
  );
}
