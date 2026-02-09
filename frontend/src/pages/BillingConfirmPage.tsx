import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api';

export function BillingConfirmPage() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [form, setForm] = useState({
    name: '',
    card: '',
    expiry: '',
    cvc: ''
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const disabled = useMemo(
    () =>
      !token ||
      !form.name.trim() ||
      !form.card.trim() ||
      !form.expiry.trim() ||
      !form.cvc.trim() ||
      status === 'loading',
    [token, form, status]
  );

  const handleSubmit = async () => {
    try {
      setStatus('loading');
      setError(null);
      await api.confirmSubscriptionPayment(token);
      setStatus('success');
    } catch (err: any) {
      setStatus('error');
      setError(err.message || 'No se pudo confirmar el pago');
    }
  };

  return (
    <div className="public-page">
      <div className="public-card">
        <h1>Confirmar pago</h1>
        <p className="muted">
          Introduce los datos de pago para activar tu suscripción. No almacenamos
          la tarjeta en esta plataforma.
        </p>
        {status === 'success' ? (
          <div className="success-banner">
            Pago recibido. La suscripción se activará en unos instantes.
          </div>
        ) : (
          <>
            {error && <div className="error-banner">{error}</div>}
            <div className="form-grid">
              <label>
                Titular
                <input
                  placeholder="Nombre y apellidos"
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                />
              </label>
              <label>
                Número de tarjeta
                <input
                  placeholder="4242 4242 4242 4242"
                  value={form.card}
                  onChange={(event) => setForm({ ...form, card: event.target.value })}
                />
              </label>
              <label>
                Expiración
                <input
                  placeholder="MM/AA"
                  value={form.expiry}
                  onChange={(event) => setForm({ ...form, expiry: event.target.value })}
                />
              </label>
              <label>
                CVC
                <input
                  placeholder="123"
                  value={form.cvc}
                  onChange={(event) => setForm({ ...form, cvc: event.target.value })}
                />
              </label>
            </div>
            <div className="form-actions">
              <button className="btn primary" disabled={disabled} onClick={handleSubmit}>
                Confirmar pago
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
