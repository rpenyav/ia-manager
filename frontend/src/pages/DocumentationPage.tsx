import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../auth';
import { FieldWithHelp } from '../components/FieldWithHelp';
import { DataTable } from '../components/DataTable';
import type { DocumentationEntry } from '../types';
import Swal from 'sweetalert2';

const MENU_OPTIONS = [
  'overview',
  'tenants',
  'providers',
  'policies',
  'runtime',
  'usage',
  'audit',
  'pricing',
  'webhooks',
  'notifications',
  'settings',
  'observability',
  'documentation'
];

type FilterState = {
  q: string;
  menuSlug: string;
  category: string;
  enabled: string;
};

export function DocumentationPage() {
  const { role } = useAuth();
  const [docs, setDocs] = useState<DocumentationEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeEntry, setActiveEntry] = useState<DocumentationEntry | null>(
    null,
  );
  const [filters, setFilters] = useState<FilterState>({
    q: '',
    menuSlug: '',
    category: '',
    enabled: ''
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    menuSlug: 'overview',
    category: 'general',
    title: '',
    content: '',
    link: '',
    orderIndex: 0,
    enabled: true
  });

  const loadDocs = async (override?: Partial<FilterState>) => {
    const next = { ...filters, ...override };
    try {
      const list = await api.listDocs({
        q: next.q || undefined,
        menuSlug: next.menuSlug || undefined,
        category: next.category || undefined,
        enabled: next.enabled === '' ? undefined : next.enabled === 'true'
      });
      setDocs(list);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Error cargando documentación');
    }
  };

  useEffect(() => {
    loadDocs();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setForm({
      menuSlug: 'overview',
      category: 'general',
      title: '',
      content: '',
      link: '',
      orderIndex: 0,
      enabled: true
    });
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        menuSlug: form.menuSlug,
        category: form.category,
        title: form.title,
        content: form.content,
        link: form.link || undefined,
        orderIndex: Number(form.orderIndex),
        enabled: form.enabled
      };
      if (editingId) {
        const updated = await api.updateDoc(editingId, payload);
        setDocs((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      } else {
        const created = await api.createDoc(payload);
        setDocs((prev) => [created, ...prev]);
      }
      resetForm();
    } catch (err: any) {
      setError(err.message || 'Error guardando documentación');
    }
  };

  const handleEdit = (entry: DocumentationEntry) => {
    setEditingId(entry.id);
    setForm({
      menuSlug: entry.menuSlug,
      category: entry.category,
      title: entry.title,
      content: entry.content,
      link: entry.link || '',
      orderIndex: entry.orderIndex,
      enabled: entry.enabled
    });
  };

  const handleDelete = async (entry: DocumentationEntry) => {
    const result = await Swal.fire({
      title: 'Eliminar documentación',
      text: `Eliminar documentación "${entry.title}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar'
    });
    if (!result.isConfirmed) {
      return;
    }
    try {
      await api.deleteDoc(entry.id);
      setDocs((prev) => prev.filter((item) => item.id !== entry.id));
    } catch (err: any) {
      setError(err.message || 'Error eliminando documentación');
    }
  };

  const showAdminActions = role === 'admin';
  const columns = [
    { key: 'menuSlug', label: 'Menú', sortable: true },
    { key: 'category', label: 'Categoría', sortable: true },
    { key: 'title', label: 'Título', sortable: true },
    {
      key: 'enabled',
      label: 'Estado',
      sortable: true,
      render: (entry: DocumentationEntry) => (
        <span className={`status ${entry.enabled ? 'active' : 'disabled'}`}>
          {entry.enabled ? 'active' : 'disabled'}
        </span>
      )
    },
    ...(showAdminActions
      ? [
          {
            key: 'actions',
            label: 'Acciones',
            render: (entry: DocumentationEntry) => (
              <div className="row-actions">
                <button
                  className="link"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleEdit(entry);
                  }}
                >
                  Editar
                </button>
                <button
                  className="link"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleDelete(entry);
                  }}
                >
                  Eliminar
                </button>
              </div>
            )
          }
        ]
      : [])
  ];

  return (
    <section className="grid">
      {error && <div className="error-banner full-row">{error}</div>}

      <div className="card full-row">
        <h2>Filtro de documentación</h2>
        <p className="muted">Busca por texto, slug y categoría.</p>
        <div className="form-grid form-grid-compact">
          <FieldWithHelp help="docsFilterQuery">
            <input
              placeholder="Buscar texto (ej: coste, rate limit)"
              value={filters.q}
              onChange={(event) => setFilters({ ...filters, q: event.target.value })}
            />
          </FieldWithHelp>
          <FieldWithHelp help="docsFilterMenuSlug">
            <select
              value={filters.menuSlug}
              onChange={(event) =>
                setFilters({ ...filters, menuSlug: event.target.value })
              }
            >
              <option value="">Todos los menús</option>
              {MENU_OPTIONS.map((slug) => (
                <option key={slug} value={slug}>
                  {slug}
                </option>
              ))}
            </select>
          </FieldWithHelp>
          <FieldWithHelp help="docsFilterCategory">
            <input
              placeholder="categoría (ej: security)"
              value={filters.category}
              onChange={(event) =>
                setFilters({ ...filters, category: event.target.value })
              }
            />
          </FieldWithHelp>
          <FieldWithHelp help="docsFilterEnabled">
            <select
              value={filters.enabled}
              onChange={(event) => setFilters({ ...filters, enabled: event.target.value })}
            >
              <option value="">Todos</option>
              <option value="true">Habilitados</option>
              <option value="false">Deshabilitados</option>
            </select>
          </FieldWithHelp>
          <div className="form-actions">
            <button className="btn primary" onClick={() => loadDocs()}>
              Buscar
            </button>
            <button
              className="btn"
              onClick={() => {
                const reset = { q: '', menuSlug: '', category: '', enabled: '' };
                setFilters(reset);
                loadDocs(reset);
              }}
            >
              Limpiar
            </button>
          </div>
        </div>
      </div>

      <div className="card full-row">
        <h2>Entradas</h2>
        <p className="muted">Listado filtrado de documentación.</p>
        <DataTable
          columns={columns}
          data={docs}
          getRowId={(entry) => entry.id}
          pageSize={8}
          onRowClick={(entry) => setActiveEntry(entry)}
        />
        {docs.length === 0 && <div className="muted">No hay resultados.</div>}
      </div>

      {showAdminActions && (
        <div className="card full-row">
          <h2>{editingId ? 'Editar documentación' : 'Nueva documentación'}</h2>
          <div className="form-grid">
            <FieldWithHelp help="docsFormMenuSlug">
              <select
                value={form.menuSlug}
                onChange={(event) => setForm({ ...form, menuSlug: event.target.value })}
              >
                {MENU_OPTIONS.map((slug) => (
                  <option key={slug} value={slug}>
                    {slug}
                  </option>
                ))}
              </select>
            </FieldWithHelp>
            <FieldWithHelp help="docsFormCategory">
              <input
                placeholder="categoría (ej: workflow)"
                value={form.category}
                onChange={(event) =>
                  setForm({ ...form, category: event.target.value })
                }
              />
            </FieldWithHelp>
            <FieldWithHelp help="docsFormTitle">
              <input
                placeholder="título (ej: Cómo definir límites)"
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
              />
            </FieldWithHelp>
            <FieldWithHelp help="docsFormContent">
              <textarea
                placeholder="contenido (ej: Describe el uso recomendado...)"
                value={form.content}
                onChange={(event) =>
                  setForm({ ...form, content: event.target.value })
                }
                rows={4}
              />
            </FieldWithHelp>
            <FieldWithHelp help="docsFormLink">
              <input
                placeholder="link (opcional, ej: https://docs...)"
                value={form.link}
                onChange={(event) => setForm({ ...form, link: event.target.value })}
              />
            </FieldWithHelp>
            <FieldWithHelp help="docsFormOrderIndex">
              <input
                type="number"
                placeholder="orden (ej: 1)"
                value={form.orderIndex}
                onChange={(event) =>
                  setForm({ ...form, orderIndex: Number(event.target.value) })
                }
              />
            </FieldWithHelp>
            <FieldWithHelp help="docsFormEnabled">
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
      )}

      {activeEntry && (
        <div className="docs-modal-backdrop" onClick={() => setActiveEntry(null)}>
          <div
            className="docs-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="docs-modal-header">
              <div>
                <div className="eyebrow">{activeEntry.category}</div>
                <h2>{activeEntry.title}</h2>
              </div>
              <button className="btn" onClick={() => setActiveEntry(null)}>
                Cerrar
              </button>
            </div>
            <div className="docs-modal-body">
              <p>{activeEntry.content}</p>
              {activeEntry.link && (
                <a
                  className="docs-link"
                  href={activeEntry.link}
                  target="_blank"
                  rel="noreferrer"
                >
                  Abrir referencia
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
