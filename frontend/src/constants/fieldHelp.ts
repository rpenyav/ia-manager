export const fieldHelp = {
  loginClientId:
    'Identificador del usuario admin que solicita el token de acceso al backoffice.',
  loginClientSecret:
    'Secreto asociado al clientId. Se usa para obtener un token JWT válido.',
  tenantPicker:
    'Selecciona el tenant activo para aplicar filtros y operaciones en el backoffice.',
  tenantsName: 'Nombre visible del tenant en el backoffice y en reportes.',
  tenantsStatus: 'Estado operativo del tenant (active, suspended, disabled).',
  tenantsKillSwitch:
    'Bloquea de inmediato todas las ejecuciones de IA para este tenant.',
  tenantsPortalUsername:
    'Usuario del portal del cliente para acceder al backoffice limitado.',
  tenantsPortalPassword:
    'Contraseña inicial del portal del cliente. Se pedirá cambio al primer login.',
  providersType:
    'Proveedor LLM asociado (ej: openai, azure-openai, aws, googlecloud).',
  providersDisplayName: 'Nombre descriptivo del proveedor para identificarlo.',
  providersCredentials:
    'JSON con credenciales del cliente. Se cifra en reposo dentro del manager.',
  providersApiKey: 'API key del proveedor (ej: sk-...). Se cifra en reposo.',
  providersBaseUrl:
    'Base URL del proveedor (OpenAI: https://api.openai.com, Azure: https://<recurso>.openai.azure.com).',
  providersEndpoint:
    'Endpoint base del recurso Azure OpenAI (ej: https://<recurso>.openai.azure.com).',
  providersDeployment:
    'Nombre del deployment en Azure OpenAI que se usara en las llamadas.',
  providersApiVersion:
    'Version de API de Azure OpenAI (ej: 2024-02-15-preview).',
  providersAwsAccessKeyId: 'Access Key ID de AWS para Bedrock.',
  providersAwsSecretAccessKey: 'Secret Access Key de AWS para Bedrock.',
  providersAwsSessionToken: 'Session token opcional si usas credenciales temporales.',
  providersAwsRegion: 'Region de AWS (ej: us-east-1).',
  providersAwsModelId: 'Model ID de Bedrock (ej: anthropic.claude-3-haiku-20240307-v1:0).',
  providersGcpProjectId: 'Project ID de Google Cloud.',
  providersGcpLocation: 'Region de Vertex AI (ej: us-central1).',
  providersGcpModel: 'Modelo de Vertex AI (ej: gemini-1.5-pro).',
  providersGcpServiceAccount:
    'JSON del service account con client_email y private_key.',
  providersConfig:
    'Configuración extra del adapter (deployment, baseUrl, modelo por defecto).',
  providersEnabled: 'Activa o desactiva el proveedor para este tenant.',
  policiesMaxRequestsPerMinute:
    'Límite máximo de peticiones por minuto para este tenant.',
  policiesMaxTokensPerDay:
    'Presupuesto diario de tokens permitido antes de bloquear.',
  policiesMaxCostPerDayUsd:
    'Coste máximo diario en USD permitido antes de bloquear.',
  policiesRedactionEnabled:
    'Activa la redacción de datos sensibles antes de enviar a IA.',
  policiesMetadata:
    'Metadatos libres para etiquetar planes, SLA o segmentaciones.',
  pricingProviderType: 'Proveedor al que aplica esta tarifa.',
  pricingModel: 'Nombre exacto del modelo (ej: gpt-4o-mini).',
  pricingInputCostPer1k:
    'Coste por 1000 tokens de entrada en USD (numero entero).',
  pricingOutputCostPer1k:
    'Coste por 1000 tokens de salida en USD (numero entero).',
  pricingEnabled: 'Activa o desactiva esta tarifa.',
  webhooksTenantId: 'Tenant especifico o vacio para aplicar globalmente.',
  webhooksUrl: 'URL destino del webhook de auditoria o alertas.',
  webhooksEvents: 'Eventos a escuchar (ej: audit.event, usage.alert).',
  webhooksSecret:
    'Secreto compartido para firmar y verificar los eventos enviados.',
  webhooksEnabled: 'Activa o desactiva el webhook.',
  notificationsTenantId: 'Tenant especifico o vacio para aplicar globalmente.',
  notificationsType: 'Tipo de canal: email o slack.',
  notificationsName: 'Nombre interno del canal para identificarlo.',
  notificationsRecipients: 'Lista de emails destino separados por coma.',
  notificationsWebhookUrl: 'Webhook URL para notificaciones Slack.',
  notificationsEnabled: 'Activa o desactiva el canal de notificaciones.',
  settingsCron: 'Expresion cron que dispara el scheduler de alertas.',
  settingsMinIntervalMinutes:
    'Minutos minimos entre notificaciones para evitar spam.',
  settingsDebugMode:
    'Habilita acciones destructivas para limpiar datos en entorno de pruebas.',
  settingsKillSwitchTenant:
    'Selecciona el tenant al que aplicar el kill switch.',
  apiKeysName: 'Nombre descriptivo de la API key.',
  apiKeysTenantId: 'Tenant asociado a la API key (opcional).',
  docsSearch: 'Busca documentación y clientes (por nombre o ID).',
  docsFilterQuery: 'Texto libre para buscar en titulos o contenido.',
  docsFilterMenuSlug: 'Filtra por seccion del menu.',
  docsFilterCategory: 'Filtra por categoria funcional.',
  docsFilterEnabled: 'Filtra por estado habilitado o deshabilitado.',
  docsFormMenuSlug: 'Seccion del menu donde se mostrara la entrada.',
  docsFormCategory: 'Categoria funcional de la entrada.',
  docsFormTitle: 'Titulo visible en el panel de documentacion.',
  docsFormContent: 'Contenido principal de la entrada.',
  docsFormLink: 'Enlace externo opcional de referencia.',
  docsFormOrderIndex: 'Orden de aparicion dentro de la seccion.',
  docsFormEnabled: 'Activa o desactiva la entrada en el panel.',
  runtimeProviderId: 'ID del provider que se usara para ejecutar la llamada.',
  runtimeModel: 'Modelo del proveedor que se utilizara en la llamada.',
  runtimePayload:
    'Payload JSON enviado al adapter (ej: {"messages":[{"role":"user","content":"Hola"}]}).',
  serviceSystemPrompt:
    'Define el comportamiento global del servicio: tono, reglas y contexto. Evita datos sensibles y mantén instrucciones claras.',
  tenantsBillingEmail: 'Email del titular para facturación y pagos de la suscripción.',
  serviceCode:
    'Identificador unico del servicio. Solo minusculas, numeros y guiones.',
  serviceName: 'Nombre visible del servicio en el catalogo.',
  serviceDescription: 'Descripcion principal del servicio.',
  serviceApiBaseUrl: 'URL base de la API a la que apuntara el servicio en integraciones externas.',
  serviceEndpointsEnabled:
    'Indica si este servicio permite configurar endpoints por tenant.',
  serviceEndpointResponsePath:
    'Ruta en el JSON donde se encuentra la lista de datos (ej: list, data.items, results). Si se deja vacío, se intenta usar "list".',
  servicePriceMonthly: 'Precio mensual en EUR.',
  servicePriceAnnual: 'Precio anual en EUR.',
  serviceEnabled: 'Activa o desactiva el servicio para nuevos tenants.'
} as const;

export type FieldHelpKey = keyof typeof fieldHelp;
