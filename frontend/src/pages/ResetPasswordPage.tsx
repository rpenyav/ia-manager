import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api';

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export function ResetPasswordPage() {
  const query = useQuery();
  const navigate = useNavigate();
  const token = query.get('token') || '';
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRequest = async () => {
    try {
      setLoading(true);
      setError(null);
      await api.forgotPassword(identifier.trim());
      setDone(true);
    } catch (err: any) {
      setError(err.message || 'No se pudo enviar el email');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    try {
      setLoading(true);
      setError(null);
      if (!password.trim() || password !== confirm) {
        throw new Error('Las contraseñas no coinciden');
      }
      await api.resetPassword({ token, password });
      setDone(true);
      setTimeout(() => navigate('/login'), 800);
    } catch (err: any) {
      setError(err.message || 'No se pudo restablecer la contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div>
          <div className="eyebrow">Neria Manager</div>
          <h1>Recuperar contraseña</h1>
          <p className="muted">
            {token
              ? 'Define una nueva contraseña.'
              : 'Introduce tu usuario o email y te enviaremos un enlace.'}
          </p>
        </div>

        {!token && !done && (
          <div className="form-grid">
            <input
              placeholder="usuario o email"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
            />
            <button className="btn primary" onClick={handleRequest} disabled={loading}>
              {loading ? 'Enviando…' : 'Enviar enlace'}
            </button>
          </div>
        )}

        {token && !done && (
          <div className="form-grid">
            <input
              type="password"
              placeholder="Nueva contraseña"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <input
              type="password"
              placeholder="Confirmar contraseña"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
            />
            <button className="btn primary" onClick={handleReset} disabled={loading}>
              {loading ? 'Guardando…' : 'Actualizar contraseña'}
            </button>
          </div>
        )}

        {done && !token && (
          <div className="info-banner">
            Si el usuario existe, hemos enviado un email con el enlace de recuperación.
            En desarrollo, revisa los logs del backend (Ethereal).
          </div>
        )}

        {done && token && (
          <div className="info-banner">Contraseña actualizada. Redirigiendo al login…</div>
        )}

        {error && <div className="error-banner">{error}</div>}

        <button className="btn" onClick={() => navigate('/login')}>
          Volver al login
        </button>
      </div>
    </div>
  );
}
