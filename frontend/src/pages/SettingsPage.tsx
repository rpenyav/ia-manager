import { useEffect, useState } from 'react';
import { api } from '../api';
import type { AlertSchedule } from '../types';
import { PageWithDocs } from '../components/PageWithDocs';
import Swal from 'sweetalert2';
import { FieldWithHelp } from '../components/FieldWithHelp';
import { useAuth } from '../auth';
import { useDashboard } from '../dashboard';

export function SettingsPage() {
  const { role } = useAuth();
  const { tenants, refreshTenants } = useDashboard();
  const [alertSchedule, setAlertSchedule] = useState<AlertSchedule>({
    cron: '*/5 * * * *',
    minIntervalMinutes: 15
  });
  const [globalKillSwitch, setGlobalKillSwitch] = useState(false);
  const [killSwitchTenantId, setKillSwitchTenantId] = useState('');
  const [globalConfirmOpen, setGlobalConfirmOpen] = useState(false);
  const [globalConfirmValue, setGlobalConfirmValue] = useState('');
  const [globalConfirmTarget, setGlobalConfirmTarget] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [schedule, killSwitch, debug] = await Promise.all([
          api.getAlertSchedule(),
          api.getGlobalKillSwitch(),
          api.getDebugMode()
        ]);
        setAlertSchedule(schedule);
        setGlobalKillSwitch(Boolean(killSwitch.enabled));
        setDebugMode(Boolean(debug.enabled));
      } catch (err: any) {
        setError(err.message || 'Error cargando settings');
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (killSwitchTenantId && tenants.some((tenant) => tenant.id === killSwitchTenantId)) {
      return;
    }
    if (tenants.length > 0) {
      setKillSwitchTenantId(tenants[0].id);
    }
  }, [tenants, killSwitchTenantId]);

  const handleSaveSchedule = async () => {
    try {
      const updated = await api.updateAlertSchedule(alertSchedule);
      setAlertSchedule(updated);
    } catch (err: any) {
      setError(err.message || 'Error guardando cron');
    }
  };

  const handleSetGlobalKillSwitch = async (enabled: boolean) => {
    try {
      const updated = await api.setGlobalKillSwitch(enabled);
      setGlobalKillSwitch(Boolean(updated.enabled));
    } catch (err: any) {
      setError(err.message || 'Error actualizando kill switch');
    }
  };

  const handleOpenGlobalConfirm = (targetEnabled: boolean) => {
    setGlobalConfirmTarget(targetEnabled);
    setGlobalConfirmValue('');
    setGlobalConfirmOpen(true);
  };

  const handleToggleTenantKillSwitch = async () => {
    const tenant = tenants.find((item) => item.id === killSwitchTenantId);
    if (!tenant) {
      setError('Selecciona un tenant válido.');
      return;
    }
    try {
      await api.toggleTenantKillSwitch(tenant.id, !tenant.killSwitch);
      await refreshTenants();
    } catch (err: any) {
      setError(err.message || 'Error actualizando kill switch del tenant');
    }
  };

  const handleToggleDebugMode = async () => {
    try {
      const updated = await api.setDebugMode(!debugMode);
      setDebugMode(Boolean(updated.enabled));
    } catch (err: any) {
      setError(err.message || 'Error actualizando debug mode');
    }
  };

  const handlePurge = async (resources: string[], label: string) => {
    const result = await Swal.fire({
      title: 'Confirmar eliminación',
      text: `Eliminar ${label}? Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar'
    });
    if (!result.isConfirmed) {
      return;
    }
    try {
      await api.purgeDebug(resources);
    } catch (err: any) {
      setError(err.message || 'Error eliminando datos');
    }
  };

  return (
    <PageWithDocs slug="settings">
      <section className="grid">
        {error && <div className="error-banner full-row">{error}</div>}

      <div className="card full-row">
        <h2>Kill switch por tenant</h2>
        <p className="muted">
          El bloqueo se aplica solo al tenant seleccionado. Úsalo para impagos o abuso.
        </p>
        <div className="form-grid form-grid-compact">
          <FieldWithHelp help="settingsKillSwitchTenant">
            <select
              value={killSwitchTenantId}
              onChange={(event) => setKillSwitchTenantId(event.target.value)}
            >
              {tenants.map((tenant) => (
                <option value={tenant.id} key={tenant.id}>
                  {tenant.name}
                </option>
              ))}
            </select>
          </FieldWithHelp>
          <div className="pill-row">
            <span
              className={`status ${
                tenants.find((item) => item.id === killSwitchTenantId)?.killSwitch
                  ? 'critical'
                  : 'active'
              }`}
            >
              {tenants.find((item) => item.id === killSwitchTenantId)?.killSwitch
                ? 'ON'
                : 'OFF'}
            </span>
            <button className="btn danger" onClick={handleToggleTenantKillSwitch}>
              {tenants.find((item) => item.id === killSwitchTenantId)?.killSwitch
                ? 'Desactivar'
                : 'Activar'}
            </button>
          </div>
        </div>
      </div>

      {role === 'admin' && (
        <div className="card full-row">
          <h2>Kill switch global (botón de pánico)</h2>
          <p className="muted">
            Bloquea todas las ejecuciones de todos los tenants. Solo para incidentes.
          </p>
          <div className="pill-row">
            <span className={`status ${globalKillSwitch ? 'critical' : 'active'}`}>
              {globalKillSwitch ? 'ON' : 'OFF'}
            </span>
            <button
              className="btn danger"
              onClick={() =>
                globalKillSwitch
                  ? handleSetGlobalKillSwitch(false)
                  : handleOpenGlobalConfirm(true)
              }
            >
              {globalKillSwitch ? 'Desactivar' : 'Activar'}
            </button>
          </div>
        </div>
      )}

      <div className="card">
        <h2>Alert Schedule</h2>
        <p className="muted">Configura el cron y el intervalo mínimo de alertas.</p>
        <div className="form-grid">
          <FieldWithHelp help="settingsCron">
            <input
              placeholder="cron (ej: */5 * * * *)"
              value={alertSchedule.cron}
              onChange={(event) =>
                setAlertSchedule({ ...alertSchedule, cron: event.target.value })
              }
            />
          </FieldWithHelp>
          <FieldWithHelp help="settingsMinIntervalMinutes">
            <input
              placeholder="min interval (minutes) ej: 15"
              value={alertSchedule.minIntervalMinutes}
              onChange={(event) =>
                setAlertSchedule({
                  ...alertSchedule,
                  minIntervalMinutes: Number(event.target.value)
                })
              }
            />
          </FieldWithHelp>
          <button className="btn primary" onClick={handleSaveSchedule}>
            Guardar cron
          </button>
        </div>
      </div>

      <div className="card">
        <h2>Debug Mode</h2>
        <p className="muted">Permite borrar datos en bloque para pruebas.</p>
        <div className="form-grid">
          <FieldWithHelp help="settingsDebugMode">
            <label className="checkbox">
              <input
                type="checkbox"
                checked={debugMode}
                onChange={handleToggleDebugMode}
              />
              Debug mode activo
            </label>
          </FieldWithHelp>
          {debugMode && (
            <div className="form-actions">
              <button className="btn danger" onClick={() => handlePurge(['providers'], 'todos los providers')}>
                Eliminar providers
              </button>
              <button className="btn danger" onClick={() => handlePurge(['policies'], 'todas las políticas')}>
                Eliminar políticas
              </button>
              <button className="btn danger" onClick={() => handlePurge(['api_keys'], 'todas las API keys')}>
                Eliminar API keys
              </button>
              <button className="btn danger" onClick={() => handlePurge(['tenants'], 'todos los tenants')}>
                Eliminar tenants
              </button>
              <button className="btn danger" onClick={() => handlePurge(['providers','policies','api_keys','tenants'], 'todo el entorno')}>
                Eliminar TODO
              </button>
            </div>
          )}
        </div>
      </div>
      </section>

      {globalConfirmOpen && (
        <div
          className="docs-modal-backdrop"
          onClick={() => setGlobalConfirmOpen(false)}
        >
          <div className="docs-modal" onClick={(event) => event.stopPropagation()}>
            <div className="docs-modal-header">
              <div>
                <div className="eyebrow">Confirmación requerida</div>
                <h2>Activar kill switch global</h2>
              </div>
              <button className="btn" onClick={() => setGlobalConfirmOpen(false)}>
                Cerrar
              </button>
            </div>
            <div className="docs-modal-body">
              <p className="muted">
                Esto bloqueará todas las ejecuciones para todos los tenants. Escribe
                <strong> CONFIRMAR</strong> para continuar.
              </p>
              <input
                placeholder="Escribe CONFIRMAR"
                value={globalConfirmValue}
                onChange={(event) => setGlobalConfirmValue(event.target.value)}
              />
              <div className="form-actions" style={{ marginTop: 16 }}>
                <button
                  className="btn danger"
                  disabled={globalConfirmValue.trim() !== 'CONFIRMAR'}
                  onClick={() => {
                    handleSetGlobalKillSwitch(globalConfirmTarget);
                    setGlobalConfirmOpen(false);
                  }}
                >
                  Confirmar
                </button>
                <button className="btn" onClick={() => setGlobalConfirmOpen(false)}>
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageWithDocs>
  );
}
