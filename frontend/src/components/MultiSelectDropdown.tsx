import { useEffect, useMemo, useRef, useState } from "react";

type Option = {
  value: string;
  label: string;
};

type MultiSelectDropdownProps = {
  options: Option[];
  selected: string[];
  disabled?: boolean;
  placeholder?: string;
  maxHeight?: number;
  onChange: (next: string[]) => void;
};

export function MultiSelectDropdown({
  options,
  selected,
  disabled,
  placeholder = "Selecciona",
  maxHeight = 260,
  onChange,
}: MultiSelectDropdownProps) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const filtered = useMemo(() => {
    const term = filter.trim().toLowerCase();
    if (!term) {
      return options;
    }
    return options.filter((option) =>
      option.label.toLowerCase().includes(term),
    );
  }, [filter, options]);

  const allSelected = options.length > 0 && selected.length === options.length;

  const buttonText = useMemo(() => {
    const count = selected.length;
    if (count === 0) {
      return placeholder;
    }
    if (count === options.length) {
      return `Todos (${count})`;
    }
    return `${count} seleccionados`;
  }, [options.length, placeholder, selected.length]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const handleClick = (event: MouseEvent) => {
      if (!wrapperRef.current) {
        return;
      }
      if (!wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const toggleOption = (value: string) => {
    if (disabled) {
      return;
    }
    const next = selected.includes(value)
      ? selected.filter((entry) => entry !== value)
      : [...selected, value];
    onChange(next);
  };

  const handleSelectAll = () => {
    if (disabled) {
      return;
    }
    onChange(options.map((option) => option.value));
  };

  const handleClear = () => {
    if (disabled) {
      return;
    }
    onChange([]);
  };

  return (
    <div className="multi-select" ref={wrapperRef}>
      <button
        className="multi-select-button"
        type="button"
        onClick={() => !disabled && setOpen((prev) => !prev)}
        disabled={disabled}
        aria-expanded={open}
      >
        <span>{buttonText}</span>
        <span className="multi-select-caret">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="multi-select-panel" style={{ maxHeight }}>
          <div className="multi-select-actions">
            <button className="link" type="button" onClick={handleSelectAll}>
              Seleccionar todos
            </button>
            <button className="link" type="button" onClick={handleClear}>
              Limpiar
            </button>
          </div>
          <input
            className="multi-select-search"
            placeholder="Buscar"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          />
          <div className="multi-select-list">
            {filtered.map((option) => (
              <label key={option.value} className="multi-select-item">
                <input
                  type="checkbox"
                  checked={selected.includes(option.value)}
                  onChange={() => toggleOption(option.value)}
                  disabled={disabled}
                />
                <span>{option.label}</span>
              </label>
            ))}
            {filtered.length === 0 && (
              <div className="multi-select-empty">Sin resultados</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
