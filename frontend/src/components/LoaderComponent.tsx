type LoaderComponentProps = {
  label?: string;
};

export const LoaderComponent = ({ label = "Cargando..." }: LoaderComponentProps) => (
  <div className="loader-card">
    <div className="loader-spinner" aria-hidden="true" />
    <span>{label}</span>
  </div>
);
