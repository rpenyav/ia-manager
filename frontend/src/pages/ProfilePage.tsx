import { useEffect, useState } from "react";
import { api } from "../api";
import { useAuth } from "../auth";
import { PageWithDocs } from "../components/PageWithDocs";
import type { AdminUser } from "../types";

export function ProfilePage() {
  const { user, role, mustChangePassword, refreshSession } = useAuth();
  const isTenant = role === "tenant";
  const [profile, setProfile] = useState<AdminUser | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
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
        });
      } catch (err: any) {
        setError(err.message || "Error cargando perfil");
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      if (form.password && form.password !== form.confirm) {
        throw new Error("Las contraseñas no coinciden");
      }
      const payload = isTenant
        ? {
            ...(form.name.trim() ? { name: form.name.trim() } : {}),
            ...(form.email.trim() ? { email: form.email.trim() } : {}),
            ...(form.password ? { password: form.password } : {}),
          }
        : {
            name: form.name.trim() || null,
            email: form.email.trim() || null,
            ...(form.password ? { password: form.password } : {}),
          };
      const updated = await api.updateProfile(payload);
      setProfile(updated);
      await refreshSession();
      setForm((prev) => ({ ...prev, password: "", confirm: "" }));
      setError(null);
    } catch (err: any) {
      setError(err.message || "Error guardando perfil");
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
              Debes actualizar tu contraseña antes de continuar.
            </div>
          )}
          <div className="profile-header row g-3 align-items-start">
            <div className="col-12 col-md-2 text-center">
              <div className="profile-avatar mx-auto">{initial}</div>
              <div className="profile-meta mt-3">
                <div className="eyebrow">Perfil</div>
                <div className="muted">
                  Usuario: {user || profile?.username || "-"}
                </div>
                <div className="muted">Rol: {role || profile?.role || "-"}</div>
              </div>
            </div>

            <div className="col-12 col-md-10">
              <div className="row g-3">
                <div className="col-md-12">
                  <label>
                    Nombre
                    <input
                      className="form-control"
                      placeholder="Nombre público"
                      value={form.name}
                      onChange={(event) =>
                        setForm({ ...form, name: event.target.value })
                      }
                    />
                  </label>
                </div>
                <div className="col-12">
                  <label>
                    Email
                    <input
                      className="form-control"
                      placeholder="correo@empresa.com"
                      value={form.email}
                      onChange={(event) =>
                        setForm({ ...form, email: event.target.value })
                      }
                    />
                  </label>
                </div>
                <div className="col-12">
                  <div className="form-divider" aria-hidden="true" />
                </div>
                <div className="col-12">
                  <label>
                    Usuario
                    <input
                      className="form-control"
                      value={profile?.username || user || ""}
                      readOnly
                    />
                  </label>
                </div>
                <div className="col-12 col-md-6">
                  <label>
                    Nueva contraseña
                    <input
                      className="form-control"
                      type="password"
                      placeholder="mínimo 6 caracteres"
                      value={form.password}
                      onChange={(event) =>
                        setForm({ ...form, password: event.target.value })
                      }
                    />
                  </label>
                </div>
                <div className="col-12 col-md-6">
                  <label>
                    Confirmar contraseña
                    <input
                      className="form-control"
                      type="password"
                      placeholder="repite la contraseña"
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
                      Estado
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
                      {saving ? "Guardando…" : "Guardar cambios"}
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
