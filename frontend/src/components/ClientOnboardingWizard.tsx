import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useDashboard } from '../dashboard';
import { emitToast } from '../toast';
import { copyToClipboard } from '../utils/clipboard';
import { FieldWithHelp } from './FieldWithHelp';

type Props = {
  open: boolean;
  onClose: () => void;
};

const steps = [
  {
    key: 'tenant',
    title: 'Tenant',
    description: 'Crea el tenant exclusivo que usara el cliente.'
  },
  {
    key: 'provider',
    title: 'Provider',
    description: 'Registra el proveedor LLM con credenciales cifradas.'
  },
  {
    key: 'policy',
    title: 'Policy',
    description: 'Define limites, coste y redaccion.'
  },
  {
    key: 'pricing',
    title: 'Pricing',
    description: 'Registra el coste del modelo.'
  },
  {
    key: 'apiKey',
    title: 'API Key',
    description: 'Genera la API key para el cliente.'
  },
  {
    key: 'runtime',
    title: 'Runtime',
    description: 'Ejecuta una prueba basica de runtime.'
  }
];

export function ClientOnboardingWizard({ open, onClose }: Props) {
  const { refreshTenants, setSelectedTenantId } = useDashboard();
  const navigate = useNavigate();
  const [stepIndex, setStepIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [wizardTenantId, setWizardTenantId] = useState<string | null>(null);
  const [tenantForm, setTenantForm] = useState({
    name: '',
    killSwitch: false,
    authUsername: '',
    authPassword: ''
  });
  const [providerForm, setProviderForm] = useState({
    type: 'openai',
    displayName: '',
    apiKey: '',
    baseUrl: 'https://api.openai.com',
    endpoint: '',
    deployment: '',
    apiVersion: '2024-02-15-preview',
    accessKeyId: '',
    secretAccessKey: '',
    sessionToken: '',
    region: 'us-east-1',
    modelId: '',
    projectId: '',
    location: 'us-central1',
    gcpModel: '',
    serviceAccount: '',
    config: '{}',
    enabled: true
  });
  const [createdProviderId, setCreatedProviderId] = useState<string | null>(null);
  const [policyForm, setPolicyForm] = useState({
    maxRequestsPerMinute: 60,
    maxTokensPerDay: 200000,
    maxCostPerDayUsd: 0,
    redactionEnabled: true,
    metadata: '{}'
  });
  const [policySaved, setPolicySaved] = useState(false);
  const [pricingForm, setPricingForm] = useState({
    providerType: 'openai',
    model: '',
    inputCostPer1k: '',
    outputCostPer1k: '',
    enabled: true
  });
  const [pricingSaved, setPricingSaved] = useState(false);
  const [apiKeyForm, setApiKeyForm] = useState({ name: '', tenantId: '' });
  const [createdApiKey, setCreatedApiKey] = useState<string | null>(null);
  const [runtimeForm, setRuntimeForm] = useState({
    providerId: '',
    model: '',
    payload: '{"messages":[{"role":"user","content":"Hola"}]}'
  });
  const [runtimeResult, setRuntimeResult] = useState<any>(null);
  const [runtimeError, setRuntimeError] = useState<string | null>(null);
  useEffect(() => {
    if (!open) {
      return;
    }
    setStepIndex(0);
    setError(null);
    setRuntimeResult(null);
    setRuntimeError(null);
    setWizardTenantId(null);
  }, [open]);

  useEffect(() => {
    setError(null);
  }, [stepIndex]);

  useEffect(() => {
    if (!wizardTenantId) {
      return;
    }
    setApiKeyForm((prev) => ({ ...prev, tenantId: wizardTenantId }));
  }, [wizardTenantId]);

  useEffect(() => {
    setCreatedProviderId(null);
    setPolicySaved(false);
    setCreatedApiKey(null);
    setRuntimeResult(null);
    setRuntimeForm((prev) => ({ ...prev, providerId: '' }));
  }, [wizardTenantId]);

  useEffect(() => {
    if (createdProviderId && !runtimeForm.providerId) {
      setRuntimeForm((prev) => ({ ...prev, providerId: createdProviderId }));
    }
  }, [createdProviderId, runtimeForm.providerId]);

  useEffect(() => {
    if (!pricingForm.model.trim()) {
      return;
    }
    if (runtimeForm.model !== pricingForm.model.trim()) {
      setRuntimeForm((prev) => ({ ...prev, model: pricingForm.model.trim() }));
    }
  }, [pricingForm.model, runtimeForm.model]);

  useEffect(() => {
    if (!providerForm.type.trim()) {
      return;
    }
    if (pricingForm.providerType !== providerForm.type.trim()) {
      setPricingForm((prev) => ({ ...prev, providerType: providerForm.type.trim() }));
    }
  }, [providerForm.type, pricingForm.providerType]);

  const completed = useMemo(() => {
    return {
      tenant: Boolean(wizardTenantId),
      provider: Boolean(createdProviderId),
      policy: policySaved,
      pricing: pricingSaved,
      apiKey: Boolean(createdApiKey),
      runtime: Boolean(runtimeResult)
    };
  }, [createdProviderId, createdApiKey, policySaved, pricingSaved, runtimeResult, wizardTenantId]);

  const currentStep = steps[stepIndex];

  const handleCreateTenant = async () => {
    if (!tenantForm.name.trim()) {
      setError('El nombre del tenant es obligatorio.');
      return;
    }
    if (tenantForm.authUsername.trim() && !tenantForm.authPassword.trim()) {
      setError('La contraseña del portal es obligatoria si defines un usuario.');
      return;
    }
    if (tenantForm.authPassword.trim() && !tenantForm.authUsername.trim()) {
      setError('El usuario del portal es obligatorio si defines una contraseña.');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const created = await api.createTenant({
        name: tenantForm.name.trim(),
        killSwitch: tenantForm.killSwitch,
        authUsername: tenantForm.authUsername.trim() || undefined,
        authPassword: tenantForm.authPassword || undefined
      });
      emitToast('Tenant creado');
      setWizardTenantId(created.id);
      setSelectedTenantId(created.id);
      await refreshTenants();
      setStepIndex(1);
    } catch (err: any) {
      setError(err.message || 'Error creando tenant');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProvider = async () => {
    if (!wizardTenantId) {
      setError('Crea un tenant antes de crear el provider.');
      return;
    }
    if (!providerForm.displayName.trim()) {
      setError('El displayName es obligatorio.');
      return;
    }
    const providerType = providerForm.type.toLowerCase();
    if (providerType.includes('openai') && !providerType.includes('azure')) {
      if (!providerForm.apiKey.trim()) {
        setError('La apiKey es obligatoria.');
        return;
      }
      if (!providerForm.baseUrl.trim()) {
        setError('La baseUrl es obligatoria.');
        return;
      }
    }
    if (providerType.includes('azure')) {
      if (!providerForm.apiKey.trim() || !providerForm.endpoint.trim() || !providerForm.deployment.trim()) {
        setError('apiKey, endpoint y deployment son obligatorios para Azure.');
        return;
      }
    }
    if (providerType.includes('bedrock') || providerType.includes('aws')) {
      if (!providerForm.accessKeyId.trim() || !providerForm.secretAccessKey.trim() || !providerForm.modelId.trim()) {
        setError('accessKeyId, secretAccessKey y modelId son obligatorios para AWS Bedrock.');
        return;
      }
    }
    if (providerType.includes('vertex') || providerType.includes('google') || providerType.includes('gcp')) {
      if (!providerForm.projectId.trim() || !providerForm.gcpModel.trim() || !providerForm.serviceAccount.trim()) {
        setError('projectId, modelo y service account son obligatorios para Google Vertex.');
        return;
      }
    }
    try {
      setLoading(true);
      setError(null);
      let config: Record<string, unknown> = {};
      if (providerForm.config) {
        try {
          config = JSON.parse(providerForm.config);
        } catch {
          setError('Config debe ser JSON válido.');
          return;
        }
      }
      const baseUrl = providerForm.baseUrl.trim();
      let credentialsPayload: Record<string, unknown> = {};
      if (providerType.includes('azure')) {
        credentialsPayload = {
          apiKey: providerForm.apiKey.trim(),
          endpoint: providerForm.endpoint.trim(),
          deployment: providerForm.deployment.trim(),
          apiVersion: providerForm.apiVersion.trim() || '2024-02-15-preview'
        };
      } else if (providerType.includes('bedrock') || providerType.includes('aws')) {
        credentialsPayload = {
          accessKeyId: providerForm.accessKeyId.trim(),
          secretAccessKey: providerForm.secretAccessKey.trim(),
          sessionToken: providerForm.sessionToken.trim() || undefined,
          region: providerForm.region.trim() || 'us-east-1',
          modelId: providerForm.modelId.trim()
        };
      } else if (providerType.includes('vertex') || providerType.includes('google') || providerType.includes('gcp')) {
        let serviceAccount: Record<string, unknown> = {};
        try {
          serviceAccount = JSON.parse(providerForm.serviceAccount);
        } catch {
          setError('Service account debe ser JSON válido.');
          return;
        }
        credentialsPayload = {
          projectId: providerForm.projectId.trim(),
          location: providerForm.location.trim() || 'us-central1',
          model: providerForm.gcpModel.trim(),
          serviceAccount
        };
      } else {
        credentialsPayload = {
          apiKey: providerForm.apiKey.trim(),
          baseUrl,
          endpoint: baseUrl
        };
      }
      const credentials = JSON.stringify(credentialsPayload);
      const payload: any = {
        type: providerForm.type,
        displayName: providerForm.displayName.trim(),
        credentials,
        config,
        enabled: providerForm.enabled
      };
      const created = await api.createProvider(wizardTenantId, payload);
      setCreatedProviderId(created.id);
      emitToast('Provider creado');
    } catch (err: any) {
      setError(err.message || 'Error creando provider');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePolicy = async () => {
    if (!wizardTenantId) {
      setError('Crea un tenant antes de crear la política.');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const payload = {
        maxRequestsPerMinute: Number(policyForm.maxRequestsPerMinute),
        maxTokensPerDay: Number(policyForm.maxTokensPerDay),
        maxCostPerDayUsd: Number(policyForm.maxCostPerDayUsd),
        redactionEnabled: policyForm.redactionEnabled,
        metadata: policyForm.metadata ? JSON.parse(policyForm.metadata) : {}
      };
      await api.upsertPolicy(wizardTenantId, payload);
      setPolicySaved(true);
      emitToast('Política guardada');
    } catch (err: any) {
      setError(err.message || 'Error guardando política');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePricing = async () => {
    if (!pricingForm.providerType.trim() || !pricingForm.model.trim()) {
      setError('Provider y modelo son obligatorios.');
      return;
    }
    const inputCost = Number(pricingForm.inputCostPer1k);
    const outputCost = Number(pricingForm.outputCostPer1k);
    if (!Number.isInteger(inputCost) || !Number.isInteger(outputCost)) {
      setError('Costes deben ser enteros.');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      await api.createPricing({
        providerType: pricingForm.providerType.trim(),
        model: pricingForm.model.trim(),
        inputCostPer1k: inputCost,
        outputCostPer1k: outputCost,
        enabled: pricingForm.enabled
      });
      setPricingSaved(true);
      setRuntimeForm((prev) => ({ ...prev, model: pricingForm.model.trim() }));
      emitToast('Pricing creado');
    } catch (err: any) {
      setError(err.message || 'Error creando pricing');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateApiKey = async () => {
    if (!apiKeyForm.name.trim()) {
      setError('El nombre es obligatorio.');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const payload: any = { name: apiKeyForm.name.trim() };
      if (apiKeyForm.tenantId) {
        payload.tenantId = apiKeyForm.tenantId;
      }
      const created = await api.createApiKey(payload);
      setCreatedApiKey(created.apiKey);
      emitToast('API key creada');
    } catch (err: any) {
      setError(err.message || 'Error creando API key');
    } finally {
      setLoading(false);
    }
  };

  const handleRuntimeTest = async () => {
    if (!wizardTenantId) {
      setRuntimeError('Crea un tenant antes de probar runtime.');
      return;
    }
    if (!runtimeForm.providerId.trim()) {
      setRuntimeError('ProviderId es obligatorio.');
      return;
    }
    if (!runtimeForm.model.trim()) {
      setRuntimeError('Modelo es obligatorio.');
      return;
    }
    try {
      setLoading(true);
      setRuntimeError(null);
      const payload = runtimeForm.payload ? JSON.parse(runtimeForm.payload) : {};
      const result = await api.executeRuntime(wizardTenantId, {
        providerId: runtimeForm.providerId.trim(),
        model: runtimeForm.model.trim(),
        payload
      });
      setRuntimeResult(result);
      emitToast('Runtime ejecutado');
    } catch (err: any) {
      setRuntimeError(err.message || 'Error ejecutando runtime');
    } finally {
      setLoading(false);
    }
  };

  const copyValue = async (value: string, label: string) => {
    await copyToClipboard(value, label);
  };

  if (!open) {
    return null;
  }

  return (
    <div className="wizard-backdrop">
      <div className="wizard-modal">
        <div className="wizard-header">
          <div>
            <div className="eyebrow">Onboarding</div>
            <h2>Nuevo cliente</h2>
            <p className="muted">
              Completa los pasos para dejar el cliente listo para consumir el runtime.
            </p>
          </div>
          <button className="btn" onClick={onClose}>
            Cerrar
          </button>
        </div>

        <div className="wizard-steps">
          {steps.map((step, index) => {
            const isActive = index === stepIndex;
            const isDone = completed[step.key as keyof typeof completed];
            return (
              <button
                key={step.key}
                type="button"
                className={`wizard-step${isActive ? ' active' : ''}${isDone ? ' done' : ''}`}
                onClick={() => setStepIndex(index)}
              >
                <span className="wizard-step-index">{index + 1}</span>
                <span>
                  <div className="wizard-step-title">{step.title}</div>
                </span>
              </button>
            );
          })}
        </div>

        {error && <div className="error-banner">{error}</div>}

        <div className="wizard-body">
          {currentStep.key === 'tenant' && (
            <div className="wizard-panel">
              <div className="form-grid">
                <FieldWithHelp help="tenantsName">
                  <input
                    placeholder="Nombre (ej: Cliente Acme)"
                    value={tenantForm.name}
                    onChange={(event) => setTenantForm({ ...tenantForm, name: event.target.value })}
                  />
                </FieldWithHelp>
                <FieldWithHelp help="tenantsKillSwitch">
                  <label className="checkbox">
                    <input
                      type="checkbox"
                      checked={tenantForm.killSwitch}
                      onChange={(event) =>
                        setTenantForm({ ...tenantForm, killSwitch: event.target.checked })
                      }
                    />
                    Kill switch
                  </label>
                </FieldWithHelp>
                <FieldWithHelp help="tenantsPortalUsername">
                  <input
                    placeholder="Usuario portal (ej: cliente_acme)"
                    value={tenantForm.authUsername}
                    onChange={(event) =>
                      setTenantForm({ ...tenantForm, authUsername: event.target.value })
                    }
                  />
                </FieldWithHelp>
                <FieldWithHelp help="tenantsPortalPassword">
                  <input
                    type="password"
                    placeholder="Contraseña inicial"
                    value={tenantForm.authPassword}
                    onChange={(event) =>
                      setTenantForm({ ...tenantForm, authPassword: event.target.value })
                    }
                  />
                </FieldWithHelp>
                <div className="form-actions">
                  <button className="btn primary" onClick={handleCreateTenant} disabled={loading}>
                    Crear tenant
                  </button>
                </div>
              </div>
            </div>
          )}

          {currentStep.key === 'provider' && (
            <div className="wizard-panel">
              <p className="muted">Crea un tenant antes de registrar el proveedor.</p>
              <div className="form-grid">
                <FieldWithHelp help="providersType">
                  <select
                    value={providerForm.type}
                    onChange={(event) =>
                      setProviderForm({ ...providerForm, type: event.target.value })
                    }
                  >
                    <option value="openai">OpenAI</option>
                    <option value="azure-openai">Azure OpenAI</option>
                    <option value="aws-bedrock">AWS Bedrock</option>
                    <option value="google-vertex">Google Vertex</option>
                    <option value="mock">Mock</option>
                  </select>
                </FieldWithHelp>
                <FieldWithHelp help="providersDisplayName">
                  <input
                    placeholder="displayName (ej: OpenAI Cliente X)"
                    value={providerForm.displayName}
                    onChange={(event) =>
                      setProviderForm({ ...providerForm, displayName: event.target.value })
                    }
                  />
                </FieldWithHelp>
                {providerForm.type === 'openai' && (
                  <>
                    <FieldWithHelp help="providersApiKey">
                      <input
                        placeholder="apiKey (ej: sk-...)"
                        value={providerForm.apiKey}
                        onChange={(event) =>
                          setProviderForm({ ...providerForm, apiKey: event.target.value })
                        }
                      />
                    </FieldWithHelp>
                    <FieldWithHelp help="providersBaseUrl">
                      <input
                        placeholder="baseUrl (ej: https://api.openai.com)"
                        value={providerForm.baseUrl}
                        onChange={(event) =>
                          setProviderForm({ ...providerForm, baseUrl: event.target.value })
                        }
                      />
                    </FieldWithHelp>
                  </>
                )}
                {providerForm.type === 'azure-openai' && (
                  <>
                    <FieldWithHelp help="providersApiKey">
                      <input
                        placeholder="apiKey (ej: ...)"
                        value={providerForm.apiKey}
                        onChange={(event) =>
                          setProviderForm({ ...providerForm, apiKey: event.target.value })
                        }
                      />
                    </FieldWithHelp>
                    <FieldWithHelp help="providersEndpoint">
                      <input
                        placeholder="endpoint (ej: https://<recurso>.openai.azure.com)"
                        value={providerForm.endpoint}
                        onChange={(event) =>
                          setProviderForm({ ...providerForm, endpoint: event.target.value })
                        }
                      />
                    </FieldWithHelp>
                    <FieldWithHelp help="providersDeployment">
                      <input
                        placeholder="deployment (ej: gpt-4o-mini)"
                        value={providerForm.deployment}
                        onChange={(event) =>
                          setProviderForm({ ...providerForm, deployment: event.target.value })
                        }
                      />
                    </FieldWithHelp>
                    <FieldWithHelp help="providersApiVersion">
                      <input
                        placeholder="apiVersion (ej: 2024-02-15-preview)"
                        value={providerForm.apiVersion}
                        onChange={(event) =>
                          setProviderForm({ ...providerForm, apiVersion: event.target.value })
                        }
                      />
                    </FieldWithHelp>
                  </>
                )}
                {(providerForm.type === 'aws-bedrock' || providerForm.type === 'aws') && (
                  <>
                    <FieldWithHelp help="providersAwsAccessKeyId">
                      <input
                        placeholder="accessKeyId"
                        value={providerForm.accessKeyId}
                        onChange={(event) =>
                          setProviderForm({ ...providerForm, accessKeyId: event.target.value })
                        }
                      />
                    </FieldWithHelp>
                    <FieldWithHelp help="providersAwsSecretAccessKey">
                      <input
                        placeholder="secretAccessKey"
                        value={providerForm.secretAccessKey}
                        onChange={(event) =>
                          setProviderForm({ ...providerForm, secretAccessKey: event.target.value })
                        }
                      />
                    </FieldWithHelp>
                    <FieldWithHelp help="providersAwsSessionToken">
                      <input
                        placeholder="sessionToken (opcional)"
                        value={providerForm.sessionToken}
                        onChange={(event) =>
                          setProviderForm({ ...providerForm, sessionToken: event.target.value })
                        }
                      />
                    </FieldWithHelp>
                    <FieldWithHelp help="providersAwsRegion">
                      <input
                        placeholder="region (ej: us-east-1)"
                        value={providerForm.region}
                        onChange={(event) =>
                          setProviderForm({ ...providerForm, region: event.target.value })
                        }
                      />
                    </FieldWithHelp>
                    <FieldWithHelp help="providersAwsModelId">
                      <input
                        placeholder="modelId (ej: anthropic.claude-3-haiku-20240307-v1:0)"
                        value={providerForm.modelId}
                        onChange={(event) =>
                          setProviderForm({ ...providerForm, modelId: event.target.value })
                        }
                      />
                    </FieldWithHelp>
                  </>
                )}
                {(providerForm.type === 'google-vertex' ||
                  providerForm.type === 'google' ||
                  providerForm.type === 'gcp') && (
                  <>
                    <FieldWithHelp help="providersGcpProjectId">
                      <input
                        placeholder="projectId"
                        value={providerForm.projectId}
                        onChange={(event) =>
                          setProviderForm({ ...providerForm, projectId: event.target.value })
                        }
                      />
                    </FieldWithHelp>
                    <FieldWithHelp help="providersGcpLocation">
                      <input
                        placeholder="location (ej: us-central1)"
                        value={providerForm.location}
                        onChange={(event) =>
                          setProviderForm({ ...providerForm, location: event.target.value })
                        }
                      />
                    </FieldWithHelp>
                    <FieldWithHelp help="providersGcpModel">
                      <input
                        placeholder="model (ej: gemini-1.5-pro)"
                        value={providerForm.gcpModel}
                        onChange={(event) =>
                          setProviderForm({ ...providerForm, gcpModel: event.target.value })
                        }
                      />
                    </FieldWithHelp>
                    <FieldWithHelp help="providersGcpServiceAccount">
                      <textarea
                        placeholder="service account JSON"
                        value={providerForm.serviceAccount}
                        onChange={(event) =>
                          setProviderForm({ ...providerForm, serviceAccount: event.target.value })
                        }
                        rows={4}
                      />
                    </FieldWithHelp>
                  </>
                )}
                <FieldWithHelp help="providersConfig">
                  <textarea
                    placeholder='config JSON (ej: {"model":"gpt-4o-mini"})'
                    value={providerForm.config}
                    onChange={(event) =>
                      setProviderForm({ ...providerForm, config: event.target.value })
                    }
                    rows={4}
                  />
                </FieldWithHelp>
                <FieldWithHelp help="providersEnabled">
                  <label className="checkbox">
                    <input
                      type="checkbox"
                      checked={providerForm.enabled}
                      onChange={(event) =>
                        setProviderForm({ ...providerForm, enabled: event.target.checked })
                      }
                    />
                    Habilitado
                  </label>
                </FieldWithHelp>
                <div className="form-actions">
                  <button
                    className="btn primary"
                    onClick={handleCreateProvider}
                    disabled={loading || !wizardTenantId}
                  >
                    Crear provider
                  </button>
                </div>
              </div>
              {createdProviderId && (
                <div className="wizard-result">
                  <div className="label">Provider ID</div>
                  <div className="wizard-inline">
                    <div className="pill">{createdProviderId}</div>
                    <button
                      className="copy-button"
                      type="button"
                      onClick={() => copyValue(createdProviderId, 'Provider ID')}
                    >
                      <span className="copy-icon" aria-hidden="true" />
                      Copiar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {currentStep.key === 'policy' && (
            <div className="wizard-panel">
              <div className="form-grid">
                <FieldWithHelp help="policiesMaxRequestsPerMinute">
                  <input
                    type="number"
                    placeholder="Requests por minuto (ej: 120)"
                    value={policyForm.maxRequestsPerMinute}
                    onChange={(event) =>
                      setPolicyForm({
                        ...policyForm,
                        maxRequestsPerMinute: Number(event.target.value)
                      })
                    }
                  />
                </FieldWithHelp>
                <FieldWithHelp help="policiesMaxTokensPerDay">
                  <input
                    type="number"
                    placeholder="Tokens por día (ej: 200000)"
                    value={policyForm.maxTokensPerDay}
                    onChange={(event) =>
                      setPolicyForm({
                        ...policyForm,
                        maxTokensPerDay: Number(event.target.value)
                      })
                    }
                  />
                </FieldWithHelp>
                <FieldWithHelp help="policiesMaxCostPerDayUsd">
                  <input
                    type="number"
                    placeholder="Coste máximo diario USD (ej: 50)"
                    value={policyForm.maxCostPerDayUsd}
                    onChange={(event) =>
                      setPolicyForm({
                        ...policyForm,
                        maxCostPerDayUsd: Number(event.target.value)
                      })
                    }
                  />
                </FieldWithHelp>
                <FieldWithHelp help="policiesRedactionEnabled">
                  <label className="checkbox">
                    <input
                      type="checkbox"
                      checked={policyForm.redactionEnabled}
                      onChange={(event) =>
                        setPolicyForm({
                          ...policyForm,
                          redactionEnabled: event.target.checked
                        })
                      }
                    />
                    Redacción habilitada
                  </label>
                </FieldWithHelp>
                <FieldWithHelp help="policiesMetadata">
                  <textarea
                    placeholder='metadata JSON (ej: {"plan":"pro"})'
                    value={policyForm.metadata}
                    onChange={(event) =>
                      setPolicyForm({ ...policyForm, metadata: event.target.value })
                    }
                    rows={3}
                  />
                </FieldWithHelp>
                <div className="form-actions">
                  <button
                    className="btn primary"
                    onClick={handleSavePolicy}
                    disabled={loading || !wizardTenantId}
                  >
                    Guardar política
                  </button>
                </div>
              </div>
            </div>
          )}

          {currentStep.key === 'pricing' && (
            <div className="wizard-panel">
              <div className="form-grid">
                <FieldWithHelp help="pricingProviderType">
                  <input
                    placeholder="providerType (ej: openai)"
                    value={pricingForm.providerType}
                    onChange={(event) =>
                      setPricingForm({ ...pricingForm, providerType: event.target.value })
                    }
                    readOnly
                  />
                </FieldWithHelp>
                <FieldWithHelp help="pricingModel">
                  <input
                    placeholder="model (ej: gpt-4o-mini)"
                    value={pricingForm.model}
                    onChange={(event) =>
                      setPricingForm({ ...pricingForm, model: event.target.value })
                    }
                  />
                </FieldWithHelp>
                <FieldWithHelp help="pricingInputCostPer1k">
                  <input
                    placeholder="inputCostPer1k (ej: 1)"
                    value={pricingForm.inputCostPer1k}
                    onChange={(event) =>
                      setPricingForm({ ...pricingForm, inputCostPer1k: event.target.value })
                    }
                  />
                </FieldWithHelp>
                <FieldWithHelp help="pricingOutputCostPer1k">
                  <input
                    placeholder="outputCostPer1k (ej: 2)"
                    value={pricingForm.outputCostPer1k}
                    onChange={(event) =>
                      setPricingForm({ ...pricingForm, outputCostPer1k: event.target.value })
                    }
                  />
                </FieldWithHelp>
                <FieldWithHelp help="pricingEnabled">
                  <label className="checkbox">
                    <input
                      type="checkbox"
                      checked={pricingForm.enabled}
                      onChange={(event) =>
                        setPricingForm({ ...pricingForm, enabled: event.target.checked })
                      }
                    />
                    Habilitado
                  </label>
                </FieldWithHelp>
                <div className="form-actions">
                  <button className="btn primary" onClick={handleCreatePricing} disabled={loading}>
                    Crear pricing
                  </button>
                </div>
              </div>
            </div>
          )}

          {currentStep.key === 'apiKey' && (
            <div className="wizard-panel">
              <div className="form-grid">
                <FieldWithHelp help="apiKeysName">
                  <input
                    placeholder="name (ej: cliente-acme)"
                    value={apiKeyForm.name}
                    onChange={(event) =>
                      setApiKeyForm({ ...apiKeyForm, name: event.target.value })
                    }
                  />
                </FieldWithHelp>
                <FieldWithHelp help="apiKeysTenantId">
                  <input
                    placeholder="tenantId (opcional, ej: 7d9f...)"
                    value={apiKeyForm.tenantId}
                    onChange={(event) =>
                      setApiKeyForm({ ...apiKeyForm, tenantId: event.target.value })
                    }
                  />
                </FieldWithHelp>
                <div className="form-actions">
                  <button className="btn primary" onClick={handleCreateApiKey} disabled={loading}>
                    Crear API key
                  </button>
                </div>
              </div>
              {createdApiKey && (
                <div className="wizard-result">
                  <div className="label">API Key creada</div>
                  <div className="wizard-inline">
                    <div className="pill">{createdApiKey}</div>
                    <button
                      className="copy-button"
                      type="button"
                      onClick={() => copyValue(createdApiKey, 'API Key')}
                    >
                      <span className="copy-icon" aria-hidden="true" />
                      Copiar
                    </button>
                  </div>
                </div>
              )}
              {wizardTenantId && (
                <div className="wizard-result">
                  <div className="label">Tenant ID (nuevo)</div>
                  <div className="wizard-inline">
                    <div className="pill">{wizardTenantId}</div>
                    <button
                      className="copy-button"
                      type="button"
                      onClick={() => copyValue(wizardTenantId, 'Tenant ID')}
                    >
                      <span className="copy-icon" aria-hidden="true" />
                      Copiar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {currentStep.key === 'runtime' && (
            <div className="wizard-panel">
              <div className="form-grid">
                <FieldWithHelp help="runtimeProviderId">
                  <input
                    placeholder="providerId (ej: 7d9f...)"
                    value={runtimeForm.providerId}
                    onChange={(event) =>
                      setRuntimeForm({ ...runtimeForm, providerId: event.target.value })
                    }
                  />
                </FieldWithHelp>
                <FieldWithHelp help="runtimeModel">
                  <input
                    placeholder="model (ej: gpt-4o-mini)"
                    value={runtimeForm.model}
                    readOnly
                  />
                </FieldWithHelp>
                <FieldWithHelp help="runtimePayload">
                  <textarea
                    placeholder='payload JSON (ej: {"messages":[{"role":"user","content":"Hola"}]})'
                    value={runtimeForm.payload}
                    onChange={(event) =>
                      setRuntimeForm({ ...runtimeForm, payload: event.target.value })
                    }
                    rows={4}
                  />
                </FieldWithHelp>
                <div className="form-actions">
                  <button className="btn primary" onClick={handleRuntimeTest} disabled={loading}>
                    Ejecutar prueba
                  </button>
                </div>
              </div>
              {runtimeError && <div className="error-banner">{runtimeError}</div>}
              {runtimeError?.includes('Tenant is disabled') && (
                <div className="muted">
                  Revisa en Settings el kill switch global y en Tenants que el estado sea
                  activo y el kill switch esté desactivado.
                </div>
              )}
              {runtimeResult && (
                <div className="wizard-result">
                  <div className="label">Respuesta</div>
                  <pre className="code-block">
                    {JSON.stringify(runtimeResult, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="wizard-actions">
          <button
            className="btn"
            onClick={() => setStepIndex((prev) => Math.max(prev - 1, 0))}
            disabled={stepIndex === 0}
          >
            Anterior
          </button>
          <button
            className="btn primary"
            onClick={() => {
              if (stepIndex === steps.length - 1) {
                if (wizardTenantId) {
                  navigate(`/clients/${wizardTenantId}`);
                }
                onClose();
              } else {
                setStepIndex((prev) => Math.min(prev + 1, steps.length - 1));
              }
            }}
            disabled={
              stepIndex === 0 || !completed[currentStep.key as keyof typeof completed]
            }
          >
            {stepIndex === steps.length - 1 ? 'Finalizar' : 'Siguiente'}
          </button>
        </div>
      </div>
    </div>
  );
}
