import { Link } from "react-router-dom";

export type BreadcrumbItem = {
  label: string;
  to?: string;
};

type Props = {
  items: BreadcrumbItem[];
};

export function Breadcrumbs({ items }: Props) {
  if (!items.length) {
    return null;
  }
  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <ol>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`}>
              {item.to && !isLast ? (
                <Link className="breadcrumb-link" to={item.to}>
                  {item.label}
                </Link>
              ) : (
                <span className="breadcrumb-current">{item.label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
