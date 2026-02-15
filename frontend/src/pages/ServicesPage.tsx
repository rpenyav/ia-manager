import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import type { ServiceCatalogItem } from "../types";
import { PageWithDocs } from "../components/PageWithDocs";
import { formatEur } from "../utils/currency";
import { emitToast } from "../toast";
import Swal from "sweetalert2";

export function ServicesPage() {
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
        setError(err.message || "Error cargando servicios");
      }
    };
    load();
  }, []);

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
      emitToast(service.enabled ? "Servicio desactivado" : "Servicio activado");
      setError(null);
    } catch (err: any) {
      setError(err.message || "Error actualizando servicio");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (service: ServiceCatalogItem) => {
    const result = await Swal.fire({
      title: "Eliminar servicio",
      text: `¿Eliminar ${service.name}? Esta acción es irreversible.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Eliminar",
      cancelButtonText: "Cancelar",
    });
    if (!result.isConfirmed) {
      return;
    }
    try {
      setBusyId(service.id);
      await api.deleteServiceCatalog(service.id);
      setServices((prev) => prev.filter((item) => item.id !== service.id));
      emitToast("Servicio eliminado");
      setError(null);
    } catch (err: any) {
      setError(err.message || "Error eliminando servicio");
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
              <h2>Servicios</h2>
              <p className="muted">
                Catálogo de servicios disponibles para clientes.
              </p>
            </div>
            <div className="card-header-actions">
              <Link className="btn" to="/">
                Volver
              </Link>
              <Link className="btn primary" to="/services/new">
                Crear servicio
              </Link>
            </div>
          </div>
          <div className="data-table-controls">
            <input
              placeholder="Buscar por nombre o código"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <div className="table table-services">
            <div className="table-header">
              <span>Servicio</span>
              <span>Código</span>
              <span>Precio mensual</span>
              <span>Precio anual</span>
              <span>Endpoints</span>
              <span>Estado</span>
              <span>Acciones</span>
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
                  {service.endpointsEnabled !== false ? "sí" : "no"}
                </span>
                <span
                  className={`status ${service.enabled ? "active" : "disabled"}`}
                >
                  {service.enabled ? "activo" : "inactivo"}
                </span>
                <div className="row-actions">
                  <Link className="link" to={`/services/${service.id}`}>
                    Editar
                  </Link>
                  <button
                    className="link"
                    onClick={() => handleToggle(service)}
                    disabled={busyId === service.id}
                  >
                    {service.enabled ? "Desactivar" : "Activar"}
                  </button>
                  <button
                    className="link"
                    onClick={() => handleDelete(service)}
                    disabled={busyId === service.id}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
          {filtered.length === 0 && (
            <div className="muted">No hay servicios disponibles.</div>
          )}
        </div>
      </section>
    </PageWithDocs>
  );
}
