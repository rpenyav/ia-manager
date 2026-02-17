import { useEffect, useState } from 'react';
import { api } from '../api';
import type { AlertSchedule } from '../types';
import { PageWithDocs } from '../components/PageWithDocs';
import Swal from 'sweetalert2';
import { FieldWithHelp } from '../components/FieldWithHelp';
import { useAuth } from '../auth';
import { useDashboard } from '../dashboard';
import { useI18n } from '../i18n/I18nProvider';

export function SettingsPage() {
  const { role } = useAuth();
  const { tenants, refreshTenants } = useDashboard();
  const { t } = useI18n();
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
        setError(err.message || t('Error cargando settings'));
      }
    };
    load();
  }, [t]);

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
      setError(err.message || t('Error guardando cron'));
    }
  };

  const handleSetGlobalKillSwitch = async (enabled: boolean) => {
    try {
      const updated = await api.setGlobalKillSwitch(enabled);
      setGlobalKillSwitch(Boolean(updated.enabled));
    } catch (err: any) {
      setError(err.message || t('Error actualizando kill switch'));
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
      setError(t('Selecciona un tenant válido.'));
      return;
    }
    try {
      await api.toggleTenantKillSwitch(tenant.id, !tenant.killSwitch);
      await refreshTenants();
    } catch (err: any) {
      setError(err.message || t('Error actualizando kill switch del tenant'));
    }
  };

  const handleToggleDebugMode = async () => {
    try {
      const updated = await api.setDebugMode(!debugMode);
      setDebugMode(Boolean(updated.enabled));
    } catch (err: any) {
      setError(err.message || t('Error actualizando debug mode'));
    }
  };

  const handlePurge = async (resources: string[], label: string) => {
    const result = await Swal.fire({
      title: t('Confirmar eliminación'),
      text: t('Eliminar {label}? Esta acción no se puede deshacer.', { label }),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: t('Eliminar'),
      cancelButtonText: t('Cancelar')
    });
    if (!result.isConfirmed) {
      return;
    }
    try {
      await api.purgeDebug(resources);
    } catch (err: any) {
      setError(err.message || t('Error eliminando datos'));
    }
  };

  return (
    <PageWithDocs slug="settings">
      <section className="grid">
        {error && <div className="error-banner full-row">{error}</div>}

      <div className="card full-row">
        <h2>{t('Kill switch por tenant')}</h2>
        <p className="muted">
          {t('El bloqueo se aplica solo al tenant seleccionado. Úsalo para impagos o abuso.')}
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
                ? t('ON')
                : t('OFF')}
            </span>
            <button className="btn danger" onClick={handleToggleTenantKillSwitch}>
              {tenants.find((item) => item.id === killSwitchTenantId)?.killSwitch
                ? t('Desactivar')
                : t('Activar')}
            </button>
          </div>
        </div>
      </div>

      {role === 'admin' && (
        <div className="card full-row">
          <h2>{t('Kill switch global (botón de pánico)')}</h2>
          <p className="muted">
            {t('Bloquea todas las ejecuciones de todos los tenants. Solo para incidentes.')}
          </p>
          <div className="pill-row">
            <span className={`status ${globalKillSwitch ? 'critical' : 'active'}`}>
              {globalKillSwitch ? t('ON') : t('OFF')}
            </span>
            <button
              className="btn danger"
              onClick={() =>
                globalKillSwitch
                  ? handleSetGlobalKillSwitch(false)
                  : handleOpenGlobalConfirm(true)
              }
            >
              {globalKillSwitch ? t('Desactivar') : t('Activar')}
            </button>
          </div>
        </div>
      )}

      <div className="card">
        <h2>{t('Alert Schedule')}</h2>
        <p className="muted">{t('Configura el cron y el intervalo mínimo de alertas.')}</p>
        <div className="form-grid">
          <FieldWithHelp help="settingsCron">
            <input
              placeholder={t('cron (ej: */5 * * * *)')}
              value={alertSchedule.cron}
              onChange={(event) =>
                setAlertSchedule({ ...alertSchedule, cron: event.target.value })
              }
            />
          </FieldWithHelp>
          <FieldWithHelp help="settingsMinIntervalMinutes">
            <input
              placeholder={t('min interval (minutes) ej: 15')}
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
            {t('Guardar cron')}
          </button>
        </div>
      </div>

      <div className="card">
        <h2>{t('Debug Mode')}</h2>
        <p className="muted">{t('Permite borrar datos en bloque para pruebas.')}</p>
        <div className="form-grid">
          <FieldWithHelp help="settingsDebugMode">
            <label className="checkbox">
              <input
                type="checkbox"
                checked={debugMode}
                onChange={handleToggleDebugMode}
              />
              {t('Debug mode activo')}
            </label>
          </FieldWithHelp>
          {debugMode && (
            <div className="form-actions">
              <button className="btn danger" onClick={() => handlePurge(['providers'], t('todos los providers'))}>
                {t('Eliminar providers')}
              </button>
              <button className="btn danger" onClick={() => handlePurge(['policies'], t('todas las políticas'))}>
                {t('Eliminar políticas')}
              </button>
              <button className="btn danger" onClick={() => handlePurge(['api_keys'], t('todas las API keys'))}>
                {t('Eliminar API keys')}
              </button>
              <button className="btn danger" onClick={() => handlePurge(['tenants'], t('todos los tenants'))}>
                {t('Eliminar tenants')}
              </button>
              <button className="btn danger" onClick={() => handlePurge(['providers','policies','api_keys','tenants'], t('todo el entorno'))}>
                {t('Eliminar TODO')}
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
                <div className="eyebrow">{t('Confirmación requerida')}</div>
                <h2>{t('Activar kill switch global')}</h2>
              </div>
              <button className="btn" onClick={() => setGlobalConfirmOpen(false)}>
                {t('Cerrar')}
              </button>
            </div>
            <div className="docs-modal-body">
              <p className="muted">
                {t(
                  'Esto bloqueará todas las ejecuciones para todos los tenants. Escribe CONFIRMAR para continuar.',
                )}
              </p>
              <input
                placeholder={t('Escribe CONFIRMAR')}
                value={globalConfirmValue}
                onChange={(event) => setGlobalConfirmValue(event.target.value)}
              />
              <div className="form-actions" style={{ marginTop: 16 }}>
                <button
                  className="btn danger"
                  disabled={globalConfirmValue.trim() !== t('CONFIRMAR')}
                  onClick={() => {
                    handleSetGlobalKillSwitch(globalConfirmTarget);
                    setGlobalConfirmOpen(false);
                  }}
                >
                  {t('Confirmar')}
                </button>
                <button className="btn" onClick={() => setGlobalConfirmOpen(false)}>
                  {t('Cancelar')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageWithDocs>
  );
}
