import { PageWithDocs } from '../components/PageWithDocs';

export function RuntimePage() {
  return (
    <PageWithDocs slug="runtime">
      <section className="grid">
        <div className="card">
          <h2>Runtime</h2>
          <p className="muted">Endpoint único con garantías de seguridad y costes.</p>
          <div className="runtime-box">
            <div>
              <div className="label">POST</div>
              <div className="endpoint">/runtime/execute</div>
            </div>
            <div className="pill-row">
              <span className="pill">Redacción</span>
              <span className="pill">Rate limit</span>
              <span className="pill">Audit trail</span>
            </div>
          </div>
        </div>
      </section>
    </PageWithDocs>
  );
}
