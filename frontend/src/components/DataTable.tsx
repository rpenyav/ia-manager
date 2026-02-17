import { useMemo, useState } from "react";
import { useI18n } from "../i18n/I18nProvider";

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
  onRowClick,
}: Props<T>) {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
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
      }),
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
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDir === "asc" ? aVal - bVal : bVal - aVal;
      }
      return sortDir === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
    return copy;
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginated = sorted.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const handleSort = (key: string, sortable?: boolean) => {
    if (!sortable) {
      return;
    }
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDir("asc");
  };

  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <div className="data-table">
      <div className="data-table-controls">
        {filterKeys && filterKeys.length > 0 && (
          <div className="data-table-search">
            <span className="data-table-search-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" role="img" focusable="false">
                <path
                  d="M15.5 14h-.79l-.28-.27A6.18 6.18 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16a6.18 6.18 0 0 0 4.23-1.57l.27.28v.79L20 21.5 21.5 20zm-6 0A4.5 4.5 0 1 1 14 9.5 4.5 4.5 0 0 1 9.5 14"
                />
              </svg>
            </span>
            <input
              type="search"
              placeholder={t("Buscar...")}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              className="form-control data-table-search-input"
            />
          </div>
        )}
        <div className="muted">
          {t("{count} resultados", { count: sorted.length })}
        </div>
      </div>
      <table className="table">
        <thead>
          <tr>
            {columns.map((col) => {
              const columnKey = String(col.key);
              const isSorted = sortKey === columnKey;
              return (
                <th
                  scope="col"
                  key={columnKey}
                  aria-sort={
                    isSorted ? (sortDir === "asc" ? "ascending" : "descending") : "none"
                  }
                >
                  {col.sortable ? (
                    <button
                      className="table-header-cell sortable"
                      onClick={() => handleSort(columnKey, col.sortable)}
                      type="button"
                    >
                      <span>{col.label}</span>
                      {isSorted && (
                        <span className="sort-indicator">
                          {sortDir === "asc" ? "▲" : "▼"}
                        </span>
                      )}
                    </button>
                  ) : (
                    <span className="table-header-cell">{col.label}</span>
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {paginated.map((row) => (
            <tr
              key={getRowId(row)}
              onClick={() => onRowClick?.(row)}
              className={onRowClick ? "data-table-row clickable" : "data-table-row"}
            >
              {columns.map((col) => {
                const cellValue = col.render
                  ? col.render(row)
                  : String(row[col.key as keyof T] ?? "");
                return (
                  <td key={`${getRowId(row)}-${String(col.key)}`}>
                    {cellValue}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {totalPages > 1 && (
        <nav aria-label={t("Paginación")}>
          <ul className="pagination justify-content-center">
            <li className={`page-item${currentPage === 1 ? " disabled" : ""}`}>
              <button
                className="page-link"
                type="button"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                {t("Anterior")}
              </button>
            </li>
            {pageNumbers.map((pageNumber) => (
              <li
                className={`page-item${pageNumber === currentPage ? " active" : ""}`}
                key={pageNumber}
              >
                <button
                  className="page-link"
                  type="button"
                  onClick={() => setPage(pageNumber)}
                >
                  {pageNumber}
                </button>
              </li>
            ))}
            <li className={`page-item${currentPage === totalPages ? " disabled" : ""}`}>
              <button
                className="page-link"
                type="button"
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                {t("Siguiente")}
              </button>
            </li>
          </ul>
        </nav>
      )}
    </div>
  );
}
