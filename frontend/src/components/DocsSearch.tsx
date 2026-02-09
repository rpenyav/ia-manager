import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth";
import type { DocumentationEntry, Tenant } from "../types";

type Props = {
  onSelectDoc: (entry: DocumentationEntry) => void;
  onSelectTenant?: (tenant: Tenant) => void;
};

export function DocsSearch({ onSelectDoc, onSelectTenant }: Props) {
  const navigate = useNavigate();
  const { role } = useAuth();
  const isTenant = role === "tenant";
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<DocumentationEntry[]>([]);
  const [tenantResults, setTenantResults] = useState<Tenant[]>([]);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".docs-search")) {
        setOpen(false);
      }
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setTenantResults([]);
      setOpen(false);
      return;
    }

    const handle = setTimeout(async () => {
      try {
        const trimmed = query.trim();
        const docs = await api.listDocs({ q: trimmed, enabled: true });
        setResults((docs as DocumentationEntry[]).slice(0, 8));
        if (!isTenant) {
          const tenants = await api.getTenants();
          const filteredTenants = (tenants as Tenant[]).filter((tenant) => {
            const haystack = `${tenant.name} ${tenant.id}`.toLowerCase();
            return haystack.includes(trimmed.toLowerCase());
          });
          setTenantResults(filteredTenants.slice(0, 6));
        } else {
          setTenantResults([]);
        }
        setOpen(true);
        setError(null);
      } catch (err: any) {
        setError(err.message || "Error buscando documentación");
      }
    }, 250);

    return () => clearTimeout(handle);
  }, [query, isTenant]);

  useEffect(() => {
    if (isTenant) {
      setTenantResults([]);
    }
  }, [isTenant]);

  const hint = useMemo(() => {
    if (error) {
      return error;
    }
    if (!query) {
      return isTenant ? "Busca documentación" : "Busca documentación o clientes";
    }
    if (results.length === 0 && tenantResults.length === 0) {
      return "Sin resultados";
    }
    return "";
  }, [query, results, tenantResults, error, isTenant]);

  return (
    <div className="docs-search">
      <div className="docs-search-field">
        <span className="docs-search-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <path
              d="M16.5 16.5L21 21"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </span>
        <input
          className="docs-search-input"
          type="search"
          placeholder={isTenant ? "Buscar documentación..." : "Buscar documentación o clientes..."}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => {
            if (results.length > 0) {
              setOpen(true);
            }
          }}
        />
      </div>

      {open && (
        <div className="docs-search-dropdown">
          {hint && <div className="docs-search-hint">{hint}</div>}
          {tenantResults.length > 0 && (
            <div className="docs-search-section">Clientes</div>
          )}
          {tenantResults.map((tenant) => (
            <button
              key={tenant.id}
              className="docs-search-item"
              type="button"
              onClick={() => {
                if (onSelectTenant) {
                  onSelectTenant(tenant);
                } else {
                  navigate(`/clients/${tenant.id}`);
                }
                setOpen(false);
              }}
            >
              <div className="docs-search-title">{tenant.name}</div>
              <div className="docs-search-meta">
                <span>tenant</span>
                <span>{tenant.id}</span>
              </div>
            </button>
          ))}
          {results.length > 0 && (
            <div className="docs-search-section">Documentación</div>
          )}
          {results.map((entry) => (
            <button
              key={entry.id}
              className="docs-search-item"
              type="button"
              onClick={() => {
                onSelectDoc(entry);
                setOpen(false);
              }}
            >
              <div className="docs-search-title">{entry.title}</div>
              <div className="docs-search-meta">
                <span>{entry.menuSlug}</span>
                <span>{entry.category}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
