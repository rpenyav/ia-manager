import { PageWithDocs } from '../components/PageWithDocs';

export function ObservabilityPage() {
  return (
    <PageWithDocs slug="observability">
      <section className="grid">
        <div className="card">
          <h2>Observability</h2>
          <p className="muted">Métricas y trazas del manager.</p>
          <div className="muted">Dashboards y logs pendientes de integrar.</div>
        </div>
      </section>
    </PageWithDocs>
  );
}
