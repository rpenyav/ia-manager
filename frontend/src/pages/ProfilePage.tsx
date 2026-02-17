import { useEffect, useState } from "react";
import { api } from "../api";
import { useAuth } from "../auth";
import { useI18n } from "../i18n/I18nProvider";
import { getStoredLanguage, isLanguage } from "../i18n";
import { PageWithDocs } from "../components/PageWithDocs";
import { InfoTooltip } from "../components/InfoTooltip";
import type { AdminUser } from "../types";

export function ProfilePage() {
  const { user, role, mustChangePassword, refreshSession } = useAuth();
  const { t, setLanguage } = useI18n();
  const isTenant = role === "tenant";
  const [profile, setProfile] = useState<AdminUser | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
    language: getStoredLanguage(),
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const current = await api.getProfile();
        setProfile(current);
        setForm({
          name: current.name || "",
          email: current.email || "",
          password: "",
          confirm: "",
          language: isLanguage(current.language || null)
            ? (current.language as any)
            : getStoredLanguage(),
        });
      } catch (err: any) {
        setError(err.message || t("Error cargando perfil"));
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      if (form.password && form.password !== form.confirm) {
        throw new Error(t("Las contraseñas no coinciden"));
      }
      const payload = isTenant
        ? {
            ...(form.name.trim() ? { name: form.name.trim() } : {}),
            ...(form.email.trim() ? { email: form.email.trim() } : {}),
            ...(form.language ? { language: form.language } : {}),
            ...(form.password ? { password: form.password } : {}),
          }
        : {
            name: form.name.trim() || null,
            email: form.email.trim() || null,
            language: form.language || null,
            ...(form.password ? { password: form.password } : {}),
          };
      const updated = await api.updateProfile(payload);
      setProfile(updated);
      if (updated?.language && isLanguage(updated.language)) {
        setLanguage(updated.language);
      }
      await refreshSession();
      setForm((prev) => ({ ...prev, password: "", confirm: "" }));
      setError(null);
    } catch (err: any) {
      setError(err.message || t("Error guardando perfil"));
    } finally {
      setSaving(false);
    }
  };

  const initial = (profile?.name || user || "U").charAt(0).toUpperCase();

  return (
    <PageWithDocs slug="settings">
      <section className="grid">
        {error && <div className="error-banner">{error}</div>}

        <div className="card profile-card">
          {mustChangePassword && (
            <div className="info-banner">
              {t("Debes actualizar tu contraseña antes de continuar.")}
            </div>
          )}
          <div className="profile-header row g-3 align-items-start">
            <div className="col-12 col-md-2 text-center">
              <div className="profile-avatar mx-auto">{initial}</div>
              <div className="profile-meta mt-3">
                <div className="eyebrow">{t("Perfil")}</div>
                <div className="muted">
                  {t("Usuario: {user}", {
                    user: user || profile?.username || "-",
                  })}
                </div>
                <div className="muted">
                  {t("Rol: {role}", { role: role || profile?.role || "-" })}
                </div>
              </div>
            </div>

            <div className="col-12 col-md-10">
              <div className="row g-3">
                <div className="col-md-12">
                  <label>
                    {t("Nombre")}
                    <input
                      className="form-control"
                      placeholder={t("Nombre público")}
                      value={form.name}
                      onChange={(event) =>
                        setForm({ ...form, name: event.target.value })
                      }
                    />
                  </label>
                </div>
                <div className="col-12">
                  <label>
                    {t("Email")}
                    <input
                      className="form-control"
                      placeholder={t("correo@empresa.com")}
                      value={form.email}
                      onChange={(event) =>
                        setForm({ ...form, email: event.target.value })
                      }
                    />
                  </label>
                </div>
                <div className="col-12 col-md-6">
                  <label>
                    <span className="label-with-tooltip">
                      {t("Idioma")}
                      <InfoTooltip text={t("Idioma de la aplicación")} />
                    </span>
                    <select
                      className="form-select"
                      value={form.language}
                      onChange={(event) => {
                        const next = event.target.value;
                        if (isLanguage(next)) {
                          setForm({ ...form, language: next });
                        }
                      }}
                    >
                      <option value="es">{t("Español")}</option>
                      <option value="en">{t("English")}</option>
                      <option value="ca">{t("Català")}</option>
                    </select>
                  </label>
                </div>
                <div className="col-12">
                  <div className="form-divider" aria-hidden="true" />
                </div>
                <div className="col-12">
                  <label>
                    {t("Usuario")}
                    <input
                      className="form-control"
                      value={profile?.username || user || ""}
                      readOnly
                    />
                  </label>
                </div>
                <div className="col-12 col-md-6">
                  <label>
                    {t("Nueva contraseña")}
                    <input
                      className="form-control"
                      type="password"
                      placeholder={t("mínimo 6 caracteres")}
                      value={form.password}
                      onChange={(event) =>
                        setForm({ ...form, password: event.target.value })
                      }
                    />
                  </label>
                </div>
                <div className="col-12 col-md-6">
                  <label>
                    {t("Confirmar contraseña")}
                    <input
                      className="form-control"
                      type="password"
                      placeholder={t("repite la contraseña")}
                      value={form.confirm}
                      onChange={(event) =>
                        setForm({ ...form, confirm: event.target.value })
                      }
                    />
                  </label>
                </div>
                {!isTenant && (
                  <div className="col-12 col-md-6">
                    <label>
                      {t("Estado")}
                      <input
                        className="form-control"
                        value={profile?.status || "active"}
                        readOnly
                      />
                    </label>
                  </div>
                )}
                <div className="col-12">
                  <div className="form-actions text-end">
                    <button
                      className="btn primary"
                      onClick={handleSave}
                      disabled={saving}
                    >
                      {saving ? t("Guardando…") : t("Guardar cambios")}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PageWithDocs>
  );
}
