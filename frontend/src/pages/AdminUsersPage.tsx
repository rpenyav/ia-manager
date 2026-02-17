import { useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../auth';
import { DataTable, DataTableColumn } from '../components/DataTable';
import { StatusBadgeIcon } from '../components/StatusBadgeIcon';
import { PageWithDocs } from '../components/PageWithDocs';
import type { AdminUser } from '../types';
import Swal from 'sweetalert2';
import { useI18n } from '../i18n/I18nProvider';

export function AdminUsersPage() {
  const { role, loading, user } = useAuth();
  const { t } = useI18n();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const [createForm, setCreateForm] = useState({
    username: '',
    name: '',
    email: '',
    password: '',
    role: 'editor',
    status: 'active'
  });
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    role: 'editor',
    status: 'active',
    password: ''
  });
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loadUsers = async () => {
    try {
      const list = await api.listAdminUsers();
      setUsers(list as AdminUser[]);
    } catch (err: any) {
      setError(err.message || t('Error cargando usuarios'));
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (selected) {
      setEditForm({
        name: selected.name || '',
        email: selected.email || '',
        role: selected.role || 'editor',
        status: selected.status || 'active',
        password: ''
      });
    }
  }, [selected]);

  const handleCreate = async () => {
    if (!createForm.username.trim()) {
      return;
    }
    try {
      setSaving(true);
      const created = await api.createAdminUser({
        username: createForm.username.trim(),
        name: createForm.name.trim() || null,
        email: createForm.email.trim() || null,
        password: createForm.password,
        role: createForm.role,
        status: createForm.status
      });
      setUsers((prev) => [created as AdminUser, ...prev]);
      setCreateForm({ username: '', name: '', email: '', password: '', role: 'editor', status: 'active' });
      setError(null);
    } catch (err: any) {
      setError(err.message || t('Error creando usuario'));
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!selected) {
      return;
    }
    try {
      setSaving(true);
      const updated = await api.updateAdminUser(selected.id, {
        name: editForm.name.trim() || null,
        email: editForm.email.trim() || null,
        role: editForm.role,
        status: editForm.status,
        ...(editForm.password ? { password: editForm.password } : {})
      });
      setUsers((prev) => prev.map((item) => (item.id === selected.id ? updated : item)));
      setSelected(updated as AdminUser);
      setEditModalOpen(false);
      setError(null);
    } catch (err: any) {
      setError(err.message || t('Error actualizando usuario'));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (user: AdminUser) => {
    const nextStatus = user.status === 'active' ? 'disabled' : 'active';
    const result = await Swal.fire({
      title: t('Confirmar acción'),
      text:
        nextStatus === 'disabled'
          ? t('¿Desactivar al usuario {name}?', { name: user.username })
          : t('¿Activar al usuario {name}?', { name: user.username }),
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: t('Confirmar'),
      cancelButtonText: t('Cancelar')
    });
    if (!result.isConfirmed) {
      return;
    }
    try {
      setSaving(true);
      const updated = await api.updateAdminUser(user.id, { status: nextStatus });
      setUsers((prev) => prev.map((item) => (item.id === user.id ? updated : item)));
      setError(null);
    } catch (err: any) {
      setError(err.message || t('Error actualizando estado'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (target: AdminUser) => {
    if (target.username === user) {
      return;
    }
    const result = await Swal.fire({
      title: t('Eliminar usuario'),
      text: t('¿Eliminar al usuario {name}?', { name: target.username }),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: t('Eliminar'),
      cancelButtonText: t('Cancelar')
    });
    if (!result.isConfirmed) {
      return;
    }
    try {
      setSaving(true);
      await api.deleteAdminUser(target.id);
      setUsers((prev) => prev.filter((item) => item.id !== target.id));
      setError(null);
    } catch (err: any) {
      setError(err.message || t('Error eliminando usuario'));
    } finally {
      setSaving(false);
    }
  };

  const columns: DataTableColumn<AdminUser>[] = useMemo(
    () => [
      { key: 'username', label: t('Usuario'), sortable: true },
      { key: 'name', label: t('Nombre'), sortable: true },
      { key: 'email', label: t('Email'), sortable: true },
      {
        key: 'mustChangePassword',
        label: t('Cambio password'),
        sortable: true,
        render: (row) => (row.mustChangePassword ? t('pendiente') : t('ok'))
      },
      {
        key: 'role',
        label: t('Rol'),
        sortable: true,
        render: (row) => <span className={`status ${row.role}`}>{row.role}</span>
      },
      {
        key: 'status',
        label: t('Estado'),
        sortable: true,
        render: (row) => <StatusBadgeIcon status={row.status} />
      },
      {
        key: 'actions',
        label: t('Acciones'),
        render: (row) => (
          <div className="icon-actions">
            <button
              type="button"
              className="icon-button"
              title={t('Editar')}
              onClick={() => {
                setSelected(row);
                setEditModalOpen(true);
              }}
            >
              ✎
            </button>
            <button
              type="button"
              className="icon-button danger"
              title={row.status === 'active' ? t('Desactivar') : t('Activar')}
              onClick={() => handleToggleStatus(row)}
              disabled={saving}
            >
              {row.status === 'active' ? '⏸' : '▶'}
            </button>
            <button
              type="button"
              className="icon-button danger"
              title={t('Eliminar')}
              onClick={() => handleDelete(row)}
              disabled={saving || row.username === user}
            >
              🗑
            </button>
          </div>
        )
      }
    ],
    [saving, user, t]
  );

  if (loading) {
    return (
      <PageWithDocs slug="settings">
        <div className="muted">{t('Cargando...')}</div>
      </PageWithDocs>
    );
  }

  if (role !== 'admin') {
    return (
      <PageWithDocs slug="settings">
        <div className="muted">{t('Solo los administradores pueden ver esta página.')}</div>
      </PageWithDocs>
    );
  }

  return (
    <PageWithDocs slug="settings">
      <section className="grid">
        {error && <div className="error-banner full-row">{error}</div>}

        <div className="card full-row">
          <h2>{t('Crear usuario')}</h2>
          <div className="form-grid">
            <label>
              {t('Usuario')}
              <input
                placeholder="admin-soporte"
                value={createForm.username}
                onChange={(event) =>
                  setCreateForm({ ...createForm, username: event.target.value })
                }
              />
            </label>
            <label>
              {t('Nombre')}
              <input
                placeholder={t('Soporte')}
                value={createForm.name}
                onChange={(event) => setCreateForm({ ...createForm, name: event.target.value })}
              />
            </label>
            <label>
              {t('Email')}
              <input
                placeholder={t('soporte@empresa.com')}
                value={createForm.email}
                onChange={(event) => setCreateForm({ ...createForm, email: event.target.value })}
              />
            </label>
            <label>
              {t('Contraseña')}
              <input
                type="password"
                placeholder={t('mínimo 6 caracteres')}
                value={createForm.password}
                onChange={(event) => setCreateForm({ ...createForm, password: event.target.value })}
              />
            </label>
            <label>
              {t('Rol')}
              <select
                value={createForm.role}
                onChange={(event) => setCreateForm({ ...createForm, role: event.target.value })}
              >
                <option value="admin">admin</option>
                <option value="editor">editor</option>
              </select>
            </label>
            <label>
              {t('Estado')}
              <select
                value={createForm.status}
                onChange={(event) => setCreateForm({ ...createForm, status: event.target.value })}
              >
                <option value="active">{t('active')}</option>
                <option value="disabled">{t('disabled')}</option>
              </select>
            </label>
            <div className="form-actions">
              <button
                className="btn primary"
                onClick={handleCreate}
                disabled={saving || !createForm.username.trim() || !createForm.password}
              >
                {t('Crear usuario')}
              </button>
            </div>
          </div>
        </div>

        <div className="card full-row">
          <h2>{t('Usuarios admin')}</h2>
          <p className="muted">{t('Gestiona los usuarios del backoffice.')}</p>
          <DataTable
            columns={columns}
            data={users}
            getRowId={(row) => row.id}
            filterKeys={['username', 'name', 'email', 'role', 'status']}
            pageSize={8}
          />
        </div>
      </section>

      {editModalOpen && selected && (
        <div className="modal-backdrop" onClick={() => setEditModalOpen(false)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div className="eyebrow">{t('Editar usuario')}</div>
                <h3>{selected.username}</h3>
              </div>
              <button className="btn" onClick={() => setEditModalOpen(false)}>
                {t('Cerrar')}
              </button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <label>
                  {t('Nombre')}
                  <input
                    value={editForm.name}
                    onChange={(event) => setEditForm({ ...editForm, name: event.target.value })}
                  />
                </label>
                <label>
                  {t('Email')}
                  <input
                    value={editForm.email}
                    onChange={(event) => setEditForm({ ...editForm, email: event.target.value })}
                  />
                </label>
                <label>
                  {t('Rol')}
                  <select
                    value={editForm.role}
                    onChange={(event) => setEditForm({ ...editForm, role: event.target.value })}
                  >
                    <option value="admin">admin</option>
                    <option value="editor">editor</option>
                  </select>
                </label>
                <label>
                  {t('Estado')}
                  <select
                    value={editForm.status}
                    onChange={(event) => setEditForm({ ...editForm, status: event.target.value })}
                  >
                    <option value="active">{t('active')}</option>
                    <option value="disabled">{t('disabled')}</option>
                  </select>
                </label>
                <label>
                  {t('Reset password')}
                  <input
                    type="password"
                    placeholder={t('dejar en blanco para no cambiar')}
                    value={editForm.password}
                    onChange={(event) => setEditForm({ ...editForm, password: event.target.value })}
                  />
                </label>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn primary" onClick={handleUpdate} disabled={saving}>
                {t('Guardar cambios')}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageWithDocs>
  );
}
