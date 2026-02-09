import { useMemo, useState } from 'react';

export type DataTableColumn<T> = {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
};

type Props<T> = {
  columns: DataTableColumn<T>[];
  data: T[];
  getRowId: (row: T) => string;
  pageSize?: number;
  filterKeys?: (keyof T | string)[];
  onRowClick?: (row: T) => void;
};

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  getRowId,
  pageSize = 8,
  filterKeys,
  onRowClick
}: Props<T>) {
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    if (!query.trim() || !filterKeys || filterKeys.length === 0) {
      return data;
    }
    const needle = query.trim().toLowerCase();
    return data.filter((row) =>
      filterKeys.some((key) => {
        const value = row[key as keyof T];
        if (value === null || value === undefined) {
          return false;
        }
        return String(value).toLowerCase().includes(needle);
      })
    );
  }, [data, query, filterKeys]);

  const sorted = useMemo(() => {
    if (!sortKey) {
      return filtered;
    }
    const copy = [...filtered];
    copy.sort((a, b) => {
      const aVal = a[sortKey as keyof T];
      const bVal = b[sortKey as keyof T];
      if (aVal === undefined || aVal === null) {
        return 1;
      }
      if (bVal === undefined || bVal === null) {
        return -1;
      }
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return sortDir === 'asc'
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
    return copy;
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginated = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSort = (key: string, sortable?: boolean) => {
    if (!sortable) {
      return;
    }
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortKey(key);
    setSortDir('asc');
  };

  return (
    <div className="data-table">
      <div className="data-table-controls">
        {filterKeys && filterKeys.length > 0 && (
          <input
            type="search"
            placeholder="Buscar..."
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
          />
        )}
        <div className="muted">{sorted.length} resultados</div>
      </div>
      <div className="table">
        <div
          className="table-header"
          style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}
        >
          {columns.map((col) => (
            <button
              key={String(col.key)}
              className={`table-header-cell ${col.sortable ? 'sortable' : ''}`}
              onClick={() => handleSort(String(col.key), col.sortable)}
              type="button"
            >
              <span>{col.label}</span>
              {sortKey === col.key && (
                <span className="sort-indicator">{sortDir === 'asc' ? '▲' : '▼'}</span>
              )}
            </button>
          ))}
        </div>
        {paginated.map((row) => (
          <div
            className={`table-row${onRowClick ? ' clickable' : ''}`}
            key={getRowId(row)}
            onClick={() => onRowClick?.(row)}
            style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}
          >
            {columns.map((col) => (
              <span className="table-cell" key={`${getRowId(row)}-${String(col.key)}`}>
                {col.render ? col.render(row) : String(row[col.key as keyof T] ?? '')}
              </span>
            ))}
          </div>
        ))}
      </div>
      <div className="data-table-pagination">
        <button className="btn" onClick={() => setPage(1)} disabled={currentPage === 1}>
          «
        </button>
        <button className="btn" onClick={() => setPage((prev) => Math.max(1, prev - 1))} disabled={currentPage === 1}>
          Anterior
        </button>
        <span className="muted">
          Página {currentPage} / {totalPages}
        </span>
        <button
          className="btn"
          onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
          disabled={currentPage === totalPages}
        >
          Siguiente
        </button>
        <button className="btn" onClick={() => setPage(totalPages)} disabled={currentPage === totalPages}>
          »
        </button>
      </div>
    </div>
  );
}
