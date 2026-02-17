import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth';
import { useI18n } from '../i18n/I18nProvider';
import type { DocumentationEntry } from '../types';
import { resolveDocEntry } from '../utils/docs';

type Props = {
  slug: string;
  children: React.ReactNode;
};

type DocsGroup = {
  category: string;
  entries: DocumentationEntry[];
};

export function PageWithDocs({ slug, children }: Props) {
  const { role } = useAuth();
  const { t, language } = useI18n();
  const [entries, setEntries] = useState<DocumentationEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeEntry, setActiveEntry] = useState<DocumentationEntry | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const docs = await api.getDocs(slug);
        setEntries(docs);
      } catch (err: any) {
        setError(err.message || t('Error cargando documentación'));
      }
    };
    load();
  }, [slug]);

  const localizedEntries = useMemo(
    () => entries.map((entry) => resolveDocEntry(entry, language)),
    [entries, language],
  );

  const groups = useMemo<DocsGroup[]>(() => {
    const map = new Map<string, DocumentationEntry[]>();
    localizedEntries.forEach((entry) => {
      const key = entry.category || 'general';
      const list = map.get(key) || [];
      list.push(entry);
      map.set(key, list);
    });
    return Array.from(map.entries()).map(([category, list]) => ({
      category,
      entries: list.sort((a, b) => a.orderIndex - b.orderIndex)
    }));
  }, [localizedEntries]);

  return (
    <div className="page-with-docs">
      <div className="page-content">{children}</div>
      <aside className="docs-panel">
        <div className="docs-header">
          <div>
            <div className="eyebrow">{t('Documentación')}</div>
            <h2>{t('Guía rápida')}</h2>
          </div>
          {role === 'admin' && (
            <Link to="/docs" className="btn">
              {t('Editar')}
            </Link>
          )}
        </div>
        {error && <div className="error-banner">{error}</div>}
        {entries.length === 0 && !error && (
          <div className="muted">{t('No hay documentación para esta sección.')}</div>
        )}
        {groups.map((group) => (
          <div key={group.category} className="docs-group">
            <div className="docs-category">{group.category}</div>
            {group.entries.map((entry) => (
              <button
                type="button"
                className="docs-entry docs-entry-button"
                key={entry.id}
                onClick={() => setActiveEntry(entry)}
              >
                <div className="docs-title">{entry.title}</div>
                <div className="docs-body">{entry.content}</div>
                {entry.link && (
                  <span className="docs-link">{t('Ver referencia')}</span>
                )}
              </button>
            ))}
          </div>
        ))}
      </aside>

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
    </div>
  );
}
