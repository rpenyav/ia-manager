import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";
import { api } from "../api";
import LogoNeria from "../adapters/ui/react/components/icons/LogoNeria";

export function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const query = useMemo(
    () => new URLSearchParams(location.search),
    [location.search],
  );
  const token = query.get("token") || "";
  const isResetPath = location.pathname.startsWith("/reset-password");
  const [mode, setMode] = useState<"login" | "reset">(
    isResetPath || token ? "reset" : "login",
  );
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetIdentifier, setResetIdentifier] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [resetConfirm, setResetConfirm] = useState("");
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const todayLabel = new Date().toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(clientId.trim(), clientSecret.trim());
      navigate("/", { replace: true });
    } catch (err: any) {
      setError(err.message || "No se pudo iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (isResetPath || token) {
      setMode("reset");
    } else {
      setMode("login");
    }
  }, [isResetPath, token]);

  useEffect(() => {
    setError(null);
    setResetError(null);
  }, [mode]);

  const handleResetRequest = async () => {
    try {
      setResetLoading(true);
      setResetError(null);
      await api.forgotPassword(resetIdentifier.trim());
      setResetDone(true);
    } catch (err: any) {
      setResetError(err.message || "No se pudo enviar el email");
    } finally {
      setResetLoading(false);
    }
  };

  const handleResetPassword = async () => {
    try {
      setResetLoading(true);
      setResetError(null);
      if (!resetPassword.trim() || resetPassword !== resetConfirm) {
        throw new Error("Las contraseñas no coinciden");
      }
      await api.resetPassword({ token, password: resetPassword });
      setResetDone(true);
      setTimeout(() => navigate("/login"), 800);
    } catch (err: any) {
      setResetError(err.message || "No se pudo restablecer la contraseña");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="auth-page auth-landing">
      <header className="auth-topbar">
        <div className="container">
          <div className="auth-topbar-inner">
            <div className="auth-brand">
              <LogoNeria color="#000" size={42} />
              <div>
                <div className="auth-brand-name">Neria Manager</div>
                <div className="auth-brand-sub">AI Provider Control</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="auth-hero-band ">
        <div className="auth-hero-bg " aria-hidden="true" />
        <div className="container">
          <div className="row align-items-center gy-4 ">
            <div className="col-lg-7 order-2 order-lg-1  auth-hero-copy">
              <div className="row align-items-center g-3">
                <div className="col-12 col-md-2 auth-hero-col-logo">
                  <LogoNeria color="#000" size={150} />
                </div>
                <div className="col-12 col-md-10 auth-hero-col-text ps-4">
                  <h1>IA Manager Control.</h1>
                </div>
              </div>
              <p></p>
              <div className="auth-hero-actions">
                {/* <a className="btn primary" href="#capabilities">
                  Ver capacidades
                </a>
                <a className="btn" href="#architecture">
                  Arquitectura y seguridad
                </a> */}
              </div>
              <div className="auth-trusted"></div>
            </div>

            <div className="col-lg-5 order-1 order-lg-2 d-flex justify-content-center justify-content-lg-end">
              <div className="auth-card auth-card-float auth-card-slider">
                <div
                  className={`auth-card-track ${mode === "reset" ? "is-reset" : ""}`}
                >
                  <div className="auth-card-panel">
                    <form
                      className="auth-card-panel-inner"
                      onSubmit={handleSubmit}
                    >
                      <div className="auth-card-header">
                        <div className="eyebrow">Acceso seguro</div>
                        <h2>Iniciar sesión</h2>
                        <p className="muted">
                          Panel de control en primer plano.
                        </p>
                      </div>
                      <div className="form-grid">
                        <input
                          placeholder="usuario o email (ej: admin)"
                          value={clientId}
                          onChange={(event) => setClientId(event.target.value)}
                          required
                        />
                        <input
                          placeholder="contraseña"
                          type="password"
                          value={clientSecret}
                          onChange={(event) =>
                            setClientSecret(event.target.value)
                          }
                          required
                        />
                      </div>
                      {error && <div className="error-banner">{error}</div>}
                      <button
                        className="btn primary"
                        type="submit"
                        disabled={loading}
                      >
                        {loading ? "Validando…" : "Entrar"}
                      </button>
                      <button
                        className="btn"
                        type="button"
                        onClick={() => {
                          setMode("reset");
                          setResetDone(false);
                          setTimeout(() => navigate("/reset-password"), 350);
                        }}
                      >
                        ¿Olvidaste tu contraseña?
                      </button>
                    </form>
                  </div>
                  <div className="auth-card-panel">
                    <div className="auth-card-panel-inner">
                      <div className="auth-card-header">
                        <div className="eyebrow">Recuperación</div>
                        <h2>
                          {token ? "Nueva contraseña" : "Recuperar contraseña"}
                        </h2>
                        <p className="muted">
                          {token
                            ? "Define una nueva contraseña."
                            : "Introduce tu usuario o email y te enviaremos un enlace."}
                        </p>
                      </div>

                      {!token && !resetDone && (
                        <div className="form-grid">
                          <input
                            placeholder="usuario o email"
                            value={resetIdentifier}
                            onChange={(event) =>
                              setResetIdentifier(event.target.value)
                            }
                          />
                          <button
                            className="btn primary"
                            onClick={handleResetRequest}
                            disabled={resetLoading}
                            type="button"
                          >
                            {resetLoading ? "Enviando…" : "Enviar enlace"}
                          </button>
                        </div>
                      )}

                      {token && !resetDone && (
                        <div className="form-grid">
                          <input
                            type="password"
                            placeholder="Nueva contraseña"
                            value={resetPassword}
                            onChange={(event) =>
                              setResetPassword(event.target.value)
                            }
                          />
                          <input
                            type="password"
                            placeholder="Confirmar contraseña"
                            value={resetConfirm}
                            onChange={(event) =>
                              setResetConfirm(event.target.value)
                            }
                          />
                          <button
                            className="btn primary"
                            onClick={handleResetPassword}
                            disabled={resetLoading}
                            type="button"
                          >
                            {resetLoading
                              ? "Guardando…"
                              : "Actualizar contraseña"}
                          </button>
                        </div>
                      )}

                      {resetDone && !token && (
                        <div className="info-banner">
                          Si el usuario existe, hemos enviado un email con el
                          enlace de recuperación. En desarrollo, revisa los logs
                          del backend (Ethereal).
                        </div>
                      )}

                      {resetDone && token && (
                        <div className="info-banner">
                          Contraseña actualizada. Redirigiendo al login…
                        </div>
                      )}

                      {resetError && (
                        <div className="error-banner">{resetError}</div>
                      )}

                      <button
                        className="btn"
                        type="button"
                        onClick={() => {
                          setMode("login");
                          setTimeout(() => navigate("/login"), 350);
                        }}
                      >
                        Volver al login
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* <section className="auth-section" id="capabilities">
        <div className="container">
          <div className="auth-section-header">
            <div className="eyebrow">Capacidades clave</div>
            <h2>Todo el control de IA en un único plano</h2>
            <p>
              Neria Manager unifica proveedores LLM, políticas y auditoría para
              operar IA a escala sin perder trazabilidad ni costes.
            </p>
          </div>
          <div className="auth-section-grid">
            <div className="auth-section-card">
              <h3>Multi-tenant seguro</h3>
              <p>
                Aisla cada cliente con credenciales cifradas, límites y kill
                switch independiente. Todo pasa por un único punto de control.
              </p>
            </div>
            <div className="auth-section-card">
              <h3>Gobernanza y costes</h3>
              <p>
                Política de uso, rate limiting y pricing por modelo para
                anticipar el gasto antes de que escale.
              </p>
            </div>
            <div className="auth-section-card">
              <h3>Auditoría y cumplimiento</h3>
              <p>
                Registro completo de llamadas y eventos críticos. Sin almacenar
                prompts completos, con trazas accionables.
              </p>
            </div>
          </div>
        </div>
      </section> */}

      {/* <section className="auth-section alt" id="architecture">
        <div className="container">
          <div className="auth-section-header">
            <div className="eyebrow">Arquitectura y seguridad</div>
            <h2>Una puerta de entrada, múltiples garantías</h2>
            <p>
              Diseñado para minimizar superficie de ataque y acelerar respuestas
              con colas, cache y observabilidad integrada.
            </p>
          </div>
          <div className="auth-section-grid">
            <div className="auth-section-card">
              <h3>Runtime blindado</h3>
              <p>
                Sanitización, redacción opcional y políticas por tenant antes de
                tocar el proveedor LLM.
              </p>
            </div>
            <div className="auth-section-card">
              <h3>Observabilidad completa</h3>
              <p>
                Métricas de tokens, coste y alertas en tiempo real con auditoría
                centralizada.
              </p>
            </div>
            <div className="auth-section-card">
              <h3>Escalado controlado</h3>
              <p>
                Integración con colas y cache para mantener latencia baja
                incluso en picos de demanda.
              </p>
            </div>
          </div>
        </div>
      </section> */}

      <footer className="auth-footer">
        <div className="container auth-footer-inner">
          <div className="auth-footer-meta">
            <span>{todayLabel}</span>
            <button
              className="link"
              type="button"
              onClick={() => setPrivacyOpen(true)}
            >
              Política de privacidad
            </button>
            <div>
              Icons made from{" "}
              <a href="https://www.onlinewebfonts.com/icon">svg icons</a> is
              licensed by CC BY 4.0
            </div>
          </div>
          <div className="auth-footer-signature">Webentorn.com (Barcelona)</div>
        </div>
      </footer>

      {privacyOpen && (
        <div className="modal-backdrop" onClick={() => setPrivacyOpen(false)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>Política de privacidad</h3>
              <button className="btn" onClick={() => setPrivacyOpen(false)}>
                Cerrar
              </button>
            </div>
            <div className="modal-body">
              <p>
                Este portal procesa únicamente los datos necesarios para operar
                el servicio, aplicar límites y mantener auditoría. No se
                almacenan prompts completos ni respuestas sensibles.
              </p>
              <p>
                Puedes solicitar la rectificación o eliminación de tus datos
                contactando con el administrador del servicio.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
