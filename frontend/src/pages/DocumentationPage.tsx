import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../auth';
import { FieldWithHelp } from '../components/FieldWithHelp';
import { DataTable } from '../components/DataTable';
import { StatusBadgeIcon } from '../components/StatusBadgeIcon';
import type { DocumentationEntry } from '../types';
import Swal from 'sweetalert2';
import { useI18n } from '../i18n/I18nProvider';
import { resolveDocEntry, resolveDocTitle } from '../utils/docs';

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
  'documentation',
  'tenant-services'
];

type FilterState = {
  q: string;
  menuSlug: string;
  category: string;
  enabled: string;
};

export function DocumentationPage() {
  const { role } = useAuth();
  const { t, language } = useI18n();
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
    titleEn: '',
    contentEn: '',
    titleCa: '',
    contentCa: '',
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
      setError(err.message || t('Error cargando documentación'));
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
      titleEn: '',
      contentEn: '',
      titleCa: '',
      contentCa: '',
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
        titleEn: form.titleEn,
        contentEn: form.contentEn,
        titleCa: form.titleCa,
        contentCa: form.contentCa,
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
      setError(err.message || t('Error guardando documentación'));
    }
  };

  const handleEdit = (entry: DocumentationEntry) => {
    setEditingId(entry.id);
    setForm({
      menuSlug: entry.menuSlug,
      category: entry.category,
      title: entry.title,
      content: entry.content,
      titleEn: entry.titleEn || '',
      contentEn: entry.contentEn || '',
      titleCa: entry.titleCa || '',
      contentCa: entry.contentCa || '',
      link: entry.link || '',
      orderIndex: entry.orderIndex,
      enabled: entry.enabled
    });
  };

  const handleDelete = async (entry: DocumentationEntry) => {
    const result = await Swal.fire({
      title: t('Eliminar documentación'),
      text: t('Eliminar documentación "{title}"?', { title: entry.title }),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: t('Eliminar'),
      cancelButtonText: t('Cancelar')
    });
    if (!result.isConfirmed) {
      return;
    }
    try {
      await api.deleteDoc(entry.id);
      setDocs((prev) => prev.filter((item) => item.id !== entry.id));
    } catch (err: any) {
      setError(err.message || t('Error eliminando documentación'));
    }
  };

  const showAdminActions = role === 'admin';
  const columns = [
    { key: 'menuSlug', label: t('Menú'), sortable: true },
    { key: 'category', label: t('Categoría'), sortable: true },
    {
      key: 'title',
      label: t('Título'),
      sortable: true,
      render: (entry: DocumentationEntry) => resolveDocTitle(entry, language)
    },
    {
      key: 'enabled',
      label: t('Estado'),
      sortable: true,
      render: (entry: DocumentationEntry) => (
        <StatusBadgeIcon status={entry.enabled} />
      )
    },
    ...(showAdminActions
      ? [
          {
            key: 'actions',
            label: t('Acciones'),
            render: (entry: DocumentationEntry) => (
              <div className="row-actions">
                <button
                  className="link"
                  onClick={(event) => {
                    event.stopPropagation();
                  handleEdit(entry);
                }}
              >
                {t('Editar')}
              </button>
              <button
                className="link"
                onClick={(event) => {
                  event.stopPropagation();
                  handleDelete(entry);
                }}
              >
                {t('Eliminar')}
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
        <h2>{t('Filtro de documentación')}</h2>
        <p className="muted">{t('Busca por texto, slug y categoría.')}</p>
        <div className="form-grid form-grid-compact">
          <FieldWithHelp help="docsFilterQuery">
            <input
              placeholder={t('Buscar texto (ej: coste, rate limit)')}
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
              <option value="">{t('Todos los menús')}</option>
              {MENU_OPTIONS.map((slug) => (
                <option key={slug} value={slug}>
                  {slug}
                </option>
              ))}
            </select>
          </FieldWithHelp>
          <FieldWithHelp help="docsFilterCategory">
            <input
              placeholder={t('categoría (ej: security)')}
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
              <option value="">{t('Todos')}</option>
              <option value="true">{t('Habilitados')}</option>
              <option value="false">{t('Deshabilitados')}</option>
            </select>
          </FieldWithHelp>
          <div className="form-actions">
            <button className="btn primary" onClick={() => loadDocs()}>
              {t('Buscar')}
            </button>
            <button
              className="btn"
              onClick={() => {
                const reset = { q: '', menuSlug: '', category: '', enabled: '' };
                setFilters(reset);
                loadDocs(reset);
              }}
            >
              {t('Limpiar')}
            </button>
          </div>
        </div>
      </div>

      <div className="card full-row">
        <h2>{t('Entradas')}</h2>
        <p className="muted">{t('Listado filtrado de documentación.')}</p>
        <DataTable
          columns={columns}
          data={docs}
          getRowId={(entry) => entry.id}
          pageSize={8}
          onRowClick={(entry) => setActiveEntry(resolveDocEntry(entry, language))}
        />
        {docs.length === 0 && <div className="muted">{t('No hay resultados.')}</div>}
      </div>

      {showAdminActions && (
        <div className="card full-row">
          <h2>{editingId ? t('Editar documentación') : t('Nueva documentación')}</h2>
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
                placeholder={t('categoría (ej: workflow)')}
                value={form.category}
                onChange={(event) =>
                  setForm({ ...form, category: event.target.value })
                }
              />
            </FieldWithHelp>
            <FieldWithHelp help="docsFormTitle">
              <input
                placeholder={t('Título (es) (ej: Cómo definir límites)')}
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
              />
            </FieldWithHelp>
            <FieldWithHelp help="docsFormContent">
              <textarea
                placeholder={t('Contenido (es) (ej: Describe el uso recomendado...)')}
                value={form.content}
                onChange={(event) =>
                  setForm({ ...form, content: event.target.value })
                }
                rows={4}
              />
            </FieldWithHelp>
            <FieldWithHelp help="docsFormTitle">
              <input
                placeholder={t('Título (en)')}
                value={form.titleEn}
                onChange={(event) => setForm({ ...form, titleEn: event.target.value })}
              />
            </FieldWithHelp>
            <FieldWithHelp help="docsFormContent">
              <textarea
                placeholder={t('Contenido (en)')}
                value={form.contentEn}
                onChange={(event) =>
                  setForm({ ...form, contentEn: event.target.value })
                }
                rows={4}
              />
            </FieldWithHelp>
            <FieldWithHelp help="docsFormTitle">
              <input
                placeholder={t('Título (ca)')}
                value={form.titleCa}
                onChange={(event) => setForm({ ...form, titleCa: event.target.value })}
              />
            </FieldWithHelp>
            <FieldWithHelp help="docsFormContent">
              <textarea
                placeholder={t('Contenido (ca)')}
                value={form.contentCa}
                onChange={(event) =>
                  setForm({ ...form, contentCa: event.target.value })
                }
                rows={4}
              />
            </FieldWithHelp>
            <FieldWithHelp help="docsFormLink">
              <input
                placeholder={t('link (opcional, ej: https://docs...)')}
                value={form.link}
                onChange={(event) => setForm({ ...form, link: event.target.value })}
              />
            </FieldWithHelp>
            <FieldWithHelp help="docsFormOrderIndex">
              <input
                type="number"
                placeholder={t('orden (ej: 1)')}
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
                {t('Habilitado')}
              </label>
            </FieldWithHelp>
            <div className="form-actions">
              <button className="btn primary" onClick={handleSubmit}>
                {editingId ? t('Actualizar') : t('Crear')}
              </button>
              {editingId && (
                <button className="btn" onClick={resetForm}>
                  {t('Cancelar')}
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
                {t('Cerrar')}
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
                  {t('Abrir referencia')}
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
