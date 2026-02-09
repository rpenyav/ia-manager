import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api';

export function BillingSuccessPage() {
  const [params] = useSearchParams();
  const sessionId = params.get('session_id') || '';
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const confirm = async () => {
      try {
        if (!sessionId) {
          throw new Error('Sesión inválida');
        }
        await api.confirmStripePayment(sessionId);
        setStatus('success');
      } catch (err: any) {
        setStatus('error');
        setError(err.message || 'No se pudo confirmar el pago');
      }
    };
    confirm();
  }, [sessionId]);

  return (
    <div className="public-page">
      <div className="public-card">
        <h1>Pago confirmado</h1>
        {status === 'loading' && <div className="muted">Validando pago...</div>}
        {status === 'success' && (
          <div className="success-banner">
            ¡Gracias! Tu suscripción está activa.
          </div>
        )}
        {status === 'error' && <div className="error-banner">{error}</div>}
      </div>
    </div>
  );
}
