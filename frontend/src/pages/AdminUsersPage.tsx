import { useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../auth';
import { DataTable, DataTableColumn } from '../components/DataTable';
import { PageWithDocs } from '../components/PageWithDocs';
import type { AdminUser } from '../types';
import Swal from 'sweetalert2';

export function AdminUsersPage() {
  const { role, loading, user } = useAuth();
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
      setError(err.message || 'Error cargando usuarios');
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
      setError(err.message || 'Error creando usuario');
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
      setError(err.message || 'Error actualizando usuario');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (user: AdminUser) => {
    const nextStatus = user.status === 'active' ? 'disabled' : 'active';
    const result = await Swal.fire({
      title: 'Confirmar acción',
      text:
        nextStatus === 'disabled'
          ? `¿Desactivar al usuario ${user.username}?`
          : `¿Activar al usuario ${user.username}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar'
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
      setError(err.message || 'Error actualizando estado');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (target: AdminUser) => {
    if (target.username === user) {
      return;
    }
    const result = await Swal.fire({
      title: 'Eliminar usuario',
      text: `¿Eliminar al usuario ${target.username}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar'
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
      setError(err.message || 'Error eliminando usuario');
    } finally {
      setSaving(false);
    }
  };

  const columns: DataTableColumn<AdminUser>[] = useMemo(
    () => [
      { key: 'username', label: 'Usuario', sortable: true },
      { key: 'name', label: 'Nombre', sortable: true },
      { key: 'email', label: 'Email', sortable: true },
      {
        key: 'mustChangePassword',
        label: 'Cambio password',
        sortable: true,
        render: (row) => (row.mustChangePassword ? 'pendiente' : 'ok')
      },
      {
        key: 'role',
        label: 'Rol',
        sortable: true,
        render: (row) => <span className={`status ${row.role}`}>{row.role}</span>
      },
      {
        key: 'status',
        label: 'Estado',
        sortable: true,
        render: (row) => <span className={`status ${row.status}`}>{row.status}</span>
      },
      {
        key: 'actions',
        label: 'Acciones',
        render: (row) => (
          <div className="icon-actions">
            <button
              type="button"
              className="icon-button"
              title="Editar"
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
              title={row.status === 'active' ? 'Desactivar' : 'Activar'}
              onClick={() => handleToggleStatus(row)}
              disabled={saving}
            >
              {row.status === 'active' ? '⏸' : '▶'}
            </button>
            <button
              type="button"
              className="icon-button danger"
              title="Eliminar"
              onClick={() => handleDelete(row)}
              disabled={saving || row.username === user}
            >
              🗑
            </button>
          </div>
        )
      }
    ],
    [saving, user]
  );

  if (loading) {
    return (
      <PageWithDocs slug="settings">
        <div className="muted">Cargando...</div>
      </PageWithDocs>
    );
  }

  if (role !== 'admin') {
    return (
      <PageWithDocs slug="settings">
        <div className="muted">Solo los administradores pueden ver esta página.</div>
      </PageWithDocs>
    );
  }

  return (
    <PageWithDocs slug="settings">
      <section className="grid">
        {error && <div className="error-banner full-row">{error}</div>}

        <div className="card full-row">
          <h2>Crear usuario</h2>
          <div className="form-grid">
            <label>
              Usuario
              <input
                placeholder="admin-soporte"
                value={createForm.username}
                onChange={(event) =>
                  setCreateForm({ ...createForm, username: event.target.value })
                }
              />
            </label>
            <label>
              Nombre
              <input
                placeholder="Soporte"
                value={createForm.name}
                onChange={(event) => setCreateForm({ ...createForm, name: event.target.value })}
              />
            </label>
            <label>
              Email
              <input
                placeholder="soporte@empresa.com"
                value={createForm.email}
                onChange={(event) => setCreateForm({ ...createForm, email: event.target.value })}
              />
            </label>
            <label>
              Contraseña
              <input
                type="password"
                placeholder="mínimo 6 caracteres"
                value={createForm.password}
                onChange={(event) => setCreateForm({ ...createForm, password: event.target.value })}
              />
            </label>
            <label>
              Rol
              <select
                value={createForm.role}
                onChange={(event) => setCreateForm({ ...createForm, role: event.target.value })}
              >
                <option value="admin">admin</option>
                <option value="editor">editor</option>
              </select>
            </label>
            <label>
              Estado
              <select
                value={createForm.status}
                onChange={(event) => setCreateForm({ ...createForm, status: event.target.value })}
              >
                <option value="active">active</option>
                <option value="disabled">disabled</option>
              </select>
            </label>
            <div className="form-actions">
              <button
                className="btn primary"
                onClick={handleCreate}
                disabled={saving || !createForm.username.trim() || !createForm.password}
              >
                Crear usuario
              </button>
            </div>
          </div>
        </div>

        <div className="card full-row">
          <h2>Usuarios admin</h2>
          <p className="muted">Gestiona los usuarios del backoffice.</p>
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
                <div className="eyebrow">Editar usuario</div>
                <h3>{selected.username}</h3>
              </div>
              <button className="btn" onClick={() => setEditModalOpen(false)}>
                Cerrar
              </button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <label>
                  Nombre
                  <input
                    value={editForm.name}
                    onChange={(event) => setEditForm({ ...editForm, name: event.target.value })}
                  />
                </label>
                <label>
                  Email
                  <input
                    value={editForm.email}
                    onChange={(event) => setEditForm({ ...editForm, email: event.target.value })}
                  />
                </label>
                <label>
                  Rol
                  <select
                    value={editForm.role}
                    onChange={(event) => setEditForm({ ...editForm, role: event.target.value })}
                  >
                    <option value="admin">admin</option>
                    <option value="editor">editor</option>
                  </select>
                </label>
                <label>
                  Estado
                  <select
                    value={editForm.status}
                    onChange={(event) => setEditForm({ ...editForm, status: event.target.value })}
                  >
                    <option value="active">active</option>
                    <option value="disabled">disabled</option>
                  </select>
                </label>
                <label>
                  Reset password
                  <input
                    type="password"
                    placeholder="dejar en blanco para no cambiar"
                    value={editForm.password}
                    onChange={(event) => setEditForm({ ...editForm, password: event.target.value })}
                  />
                </label>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn primary" onClick={handleUpdate} disabled={saving}>
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </PageWithDocs>
  );
}
