export const DOCS_FULL = [
  {
    menuSlug: 'overview',
    category: 'concepts',
    title: 'Proposito del overview',
    content:
      'El overview es la vista de control rapido para operaciones. Reune indicadores de uso, alertas y actividad reciente sin ejecutar acciones. Su objetivo es permitir decisiones rapidas sobre limites, proveedores y seguridad.',
    link: null,
    orderIndex: 1
  },
  {
    menuSlug: 'overview',
    category: 'data',
    title: 'Fuentes de informacion',
    content:
      'Los datos del overview provienen de usage_events, audit_events y pricing_models. El consumo se calcula por dia y se asocia al tenant activo. Las alertas dependen de los limites de politicas y del scheduler.',
    link: null,
    orderIndex: 2
  },
  {
    menuSlug: 'overview',
    category: 'workflow',
    title: 'Flujo de trabajo recomendado',
    content:
      'Revisa el overview al inicio de cada jornada. Si hay alertas, entra a Usage para detalle y a Audit para trazas. Si detectas riesgo, valida politicas, proveedores y kill switch.',
    link: null,
    orderIndex: 3
  },
  {
    menuSlug: 'overview',
    category: 'limits',
    title: 'Limitaciones de la vista',
    content:
      'El overview no muestra prompts ni respuestas, solo metadatos. No es una consola de configuracion; para ajustes usa Tenants, Policies y Settings. La informacion es agregada, no reemplaza auditoria detallada.',
    link: null,
    orderIndex: 4
  },

  {
    menuSlug: 'tenants',
    category: 'concepts',
    title: 'Que es un tenant',
    content:
      'Un tenant es una unidad logica que representa a un cliente o dominio de negocio. Cada tenant tiene proveedores, politicas y consumo aislados. Todas las operaciones runtime deben estar asociadas a un tenant valido.',
    link: null,
    orderIndex: 1
  },
  {
    menuSlug: 'tenants',
    category: 'workflow',
    title: 'Ciclo de vida del tenant',
    content:
      'Crea el tenant, define la politica base, registra proveedores y valida el runtime. Ajusta limites a medida que el uso crece. Ante incidentes, activa el kill switch y revisa auditoria.',
    link: null,
    orderIndex: 2
  },
  {
    menuSlug: 'tenants',
    category: 'security',
    title: 'Kill switch por tenant',
    content:
      'El kill switch del tenant bloquea todas las ejecuciones para ese tenant sin afectar a otros. Es la medida de contencion recomendada frente a abuso o coste inesperado. Se puede reactivar cuando el riesgo pase.',
    link: null,
    orderIndex: 3
  },
  {
    menuSlug: 'tenants',
    category: 'data',
    title: 'Datos almacenados',
    content:
      'Se guarda solo metadata del tenant: nombre, estado y banderas de control. No se almacenan prompts ni respuestas completas. El objetivo es minimizar datos sensibles.',
    link: null,
    orderIndex: 4
  },
  {
    menuSlug: 'tenants',
    category: 'operaciones',
    title: 'Buenas practicas de administracion',
    content:
      'Mantén nombres claros, registra un owner y revisa periodicamente politicas y proveedores asociados. Evita crear tenants duplicados por cliente.',
    link: null,
    orderIndex: 5
  },
  {
    menuSlug: 'tenants',
    category: 'troubleshooting',
    title: 'Diagnostico rapido',
    content:
      'Si un tenant no puede ejecutar runtime, verifica que exista politica activa, que el kill switch esté desactivado y que tenga al menos un provider habilitado.',
    link: null,
    orderIndex: 6
  },

  {
    menuSlug: 'providers',
    category: 'concepts',
    title: 'Registro de proveedores',
    content:
      'Los providers representan conexiones con LLMs externos. Cada provider tiene tipo, displayName, credenciales cifradas y configuracion adicional. El runtime usa providerId para decidir a quien llamar.',
    link: null,
    orderIndex: 1
  },
  {
    menuSlug: 'providers',
    category: 'security',
    title: 'Credenciales cifradas',
    content:
      'Las credenciales se cifran en reposo mediante AES-GCM. Solo se descifran en memoria cuando el adapter ejecuta la llamada. No se exponen en ninguna respuesta del API.',
    link: null,
    orderIndex: 2
  },
  {
    menuSlug: 'providers',
    category: 'adapters',
    title: 'Adapters soportados',
    content:
      'Se incluyen adapters para openai, azure-openai, aws-bedrock, vertex-ai y mock. Cada adapter normaliza la llamada a un contrato comun. Esto permite cambiar de proveedor sin modificar el resto del sistema.',
    link: null,
    orderIndex: 3
  },
  {
    menuSlug: 'providers',
    category: 'troubleshooting',
    title: 'Errores comunes',
    content:
      'Revisa credenciales, region y limites del proveedor. Errores 401 suelen indicar credenciales invalidas; errores 429 indican limite del proveedor. Usa Audit para rastrear el origen.',
    link: null,
    orderIndex: 4
  },

  {
    menuSlug: 'policies',
    category: 'concepts',
    title: 'Politicas de consumo',
    content:
      'Las politicas definen limites por tenant: requests por minuto, tokens diarios, coste diario y redaccion. Se aplican antes de cada ejecucion runtime. Sin politica valida no se permite ejecutar.',
    link: null,
    orderIndex: 1
  },
  {
    menuSlug: 'policies',
    category: 'limits',
    title: 'Rate limiting',
    content:
      'maxRequestsPerMinute controla el numero de llamadas por minuto. Puede usar Redis o memoria. Exceder el limite retorna 429 y no se factura.',
    link: null,
    orderIndex: 2
  },
  {
    menuSlug: 'policies',
    category: 'limits',
    title: 'Tokens y coste diario',
    content:
      'maxTokensPerDay y maxCostPerDayUsd se calculan con usage_events y pricing_models. Si se supera, la ejecucion se bloquea. Es clave para control financiero.',
    link: null,
    orderIndex: 3
  },
  {
    menuSlug: 'policies',
    category: 'data',
    title: 'Redaccion de datos',
    content:
      'Cuando redactionEnabled esta activo, se aplica el modulo de redaccion antes de llamar al proveedor. Esto reduce la exposicion de datos sensibles en prompts.',
    link: null,
    orderIndex: 4
  },

  {
    menuSlug: 'runtime',
    category: 'concepts',
    title: 'Endpoint unico de ejecucion',
    content:
      'El endpoint /runtime/execute es la unica puerta de acceso a IA. Centraliza autenticacion, politicas, redaccion, costeo y auditoria. Otros modulos deben consumir solo este endpoint.',
    link: null,
    orderIndex: 1
  },
  {
    menuSlug: 'runtime',
    category: 'workflow',
    title: 'Orden de validaciones',
    content:
      'El flujo recomendado es: autenticar, validar kill switch global y por tenant, aplicar rate limit, validar limites de tokens y coste, redaccion, llamada al adapter, registrar audit y usage. Si alguna validacion falla, se corta la ejecucion.',
    link: null,
    orderIndex: 2
  },
  {
    menuSlug: 'runtime',
    category: 'errors',
    title: 'Errores y respuestas',
    content:
      'Errores de autenticacion retornan 401. Limites superados retornan 429 o 403 segun el caso. Fallos de proveedor retornan 502 con mensaje resumido. No se devuelven credenciales ni payloads sensibles.',
    link: null,
    orderIndex: 3
  },
  {
    menuSlug: 'runtime',
    category: 'performance',
    title: 'Latencia y concurrencia',
    content:
      'La latencia depende del proveedor externo. Usa colas si deseas aislar cargas y reintentos. Configura timeouts y observa el throughput en Observability.',
    link: null,
    orderIndex: 4
  },

  {
    menuSlug: 'usage',
    category: 'concepts',
    title: 'Eventos de uso',
    content:
      'Cada ejecucion genera un usage_event con tokens de entrada y salida, modelo y coste. Esta tabla es la base para resumenes, limites y alertas.',
    link: null,
    orderIndex: 1
  },
  {
    menuSlug: 'usage',
    category: 'alerts',
    title: 'Alertas automaticas',
    content:
      'El scheduler evalua consumo segun cron y genera alertas si se exceden limites. Los canales habilitados reciben notificaciones. Ajusta cron y minIntervalMinutes para evitar spam.',
    link: null,
    orderIndex: 2
  },
  {
    menuSlug: 'usage',
    category: 'summary',
    title: 'Resumen diario',
    content:
      'El resumen agrega tokens y coste por tenant en el dia actual. Se calcula en tiempo real, no se guarda duplicado. Es util para dashboards y reportes operativos.',
    link: null,
    orderIndex: 3
  },
  {
    menuSlug: 'usage',
    category: 'workflow',
    title: 'Investigacion de gastos',
    content:
      'Si hay incremento anormal, revisa Pricing para confirmar tarifas. Luego revisa Providers y Audit para identificar origen. Considera activar kill switch temporal.',
    link: null,
    orderIndex: 4
  },

  {
    menuSlug: 'audit',
    category: 'concepts',
    title: 'Audit trail',
    content:
      'audit_events registra acciones clave con estado y metadatos. Es el registro principal de cumplimiento y seguridad. Permite trazar cada llamada sin almacenar prompts completos.',
    link: null,
    orderIndex: 1
  },
  {
    menuSlug: 'audit',
    category: 'data',
    title: 'Metadatos auditables',
    content:
      'Incluye tenantId, accion, estado y metadata contextual. Se recomienda no incluir contenido sensible en metadata. Usa identificadores y referencias en lugar de payloads completos.',
    link: null,
    orderIndex: 2
  },
  {
    menuSlug: 'audit',
    category: 'integration',
    title: 'Exportacion de eventos',
    content:
      'Los eventos pueden enviarse a webhooks y SQS. Esto habilita integracion con SIEM, data lake o pipelines de cumplimiento. El envio no bloquea el flujo principal.',
    link: null,
    orderIndex: 3
  },
  {
    menuSlug: 'audit',
    category: 'privacy',
    title: 'Privacidad y retencion',
    content:
      'No se guardan prompts ni respuestas completas. Define politicas de retencion si exportas eventos fuera del sistema. Esto facilita compliance con normativas.',
    link: null,
    orderIndex: 4
  },

  {
    menuSlug: 'pricing',
    category: 'concepts',
    title: 'Pricing por modelo',
    content:
      'Cada entrada define coste por 1k tokens de entrada y salida para un modelo. El providerType normaliza variantes como azure-openai o aws-bedrock.',
    link: null,
    orderIndex: 1
  },
  {
    menuSlug: 'pricing',
    category: 'resolution',
    title: 'Resolucion de precios',
    content:
      'El runtime busca primero coincidencia exacta por modelo. Si no existe, usa la entrada comodin con model = *. Esto evita fallos cuando el proveedor retorna modelos nuevos.',
    link: null,
    orderIndex: 2
  },
  {
    menuSlug: 'pricing',
    category: 'operations',
    title: 'Mantenimiento de tarifas',
    content:
      'Actualiza tarifas cuando cambien los precios del proveedor. Deshabilita entradas obsoletas para evitar costeo incorrecto. Usa la UI o el endpoint /pricing.',
    link: null,
    orderIndex: 3
  },
  {
    menuSlug: 'pricing',
    category: 'impact',
    title: 'Impacto en limites',
    content:
      'El coste calculado influye en maxCostPerDayUsd. Precios incorrectos pueden bloquear uso o permitir gastos excesivos. Revisa periodicamente.',
    link: null,
    orderIndex: 4
  },

  {
    menuSlug: 'webhooks',
    category: 'concepts',
    title: 'Webhooks de auditoria',
    content:
      'Los webhooks envian eventos a sistemas externos. Puedes filtrar por tipo de evento y por tenant. Son utiles para integraciones con plataformas internas.',
    link: null,
    orderIndex: 1
  },
  {
    menuSlug: 'webhooks',
    category: 'security',
    title: 'Firmas y autenticidad',
    content:
      'Si defines un secreto, el payload se firma con HMAC SHA256. El receptor puede validar la firma para asegurar integridad y autenticidad.',
    link: null,
    orderIndex: 2
  },
  {
    menuSlug: 'webhooks',
    category: 'delivery',
    title: 'Entrega y reintentos',
    content:
      'Con colas habilitadas, el envio se gestiona en background. Sin colas, el envio es directo y cualquier fallo se registra como error. La app principal no se bloquea.',
    link: null,
    orderIndex: 3
  },
  {
    menuSlug: 'webhooks',
    category: 'events',
    title: 'Tipos de eventos',
    content:
      'El evento base es audit.event. Puedes ampliar con otros eventos si agregas nuevos modulos. Usa el campo events para filtrar por tipo o * para todos.',
    link: null,
    orderIndex: 4
  },

  {
    menuSlug: 'notifications',
    category: 'concepts',
    title: 'Canales de alertas',
    content:
      'Los canales definen destinos para alertas automaticas. Pueden ser globales o por tenant. Se habilitan o deshabilitan sin borrar configuracion.',
    link: null,
    orderIndex: 1
  },
  {
    menuSlug: 'notifications',
    category: 'email',
    title: 'Email',
    content:
      'Configura SMTP en variables de entorno y define recipients en el canal. El contenido del email incluye severidad, limites y consumo actual.',
    link: null,
    orderIndex: 2
  },
  {
    menuSlug: 'notifications',
    category: 'slack',
    title: 'Slack',
    content:
      'Configura webhookUrl en el canal. El mensaje incluye tenant, tipo de alerta y valores que superaron el limite.',
    link: null,
    orderIndex: 3
  },
  {
    menuSlug: 'notifications',
    category: 'operations',
    title: 'Buenas practicas',
    content:
      'Define canales globales para equipo central y canales por tenant para equipos dedicados. Ajusta el cron para evitar ruido innecesario.',
    link: null,
    orderIndex: 4
  },

  {
    menuSlug: 'settings',
    category: 'concepts',
    title: 'Ajustes globales',
    content:
      'Settings controla funciones globales: kill switch, cron de alertas y parametros operativos. Son cambios de alto impacto y deben auditarse.',
    link: null,
    orderIndex: 1
  },
  {
    menuSlug: 'settings',
    category: 'kill',
    title: 'Kill switch global',
    content:
      'Bloquea todas las ejecuciones runtime para todos los tenants. Usar solo en incidentes graves. Revertir cuando la causa este mitigada.',
    link: null,
    orderIndex: 2
  },
  {
    menuSlug: 'settings',
    category: 'scheduler',
    title: 'Cron de alertas',
    content:
      'ALERTS_CRON define cada cuanto se evalua el consumo. ALERTS_MIN_INTERVAL_MINUTES evita reenvios constantes. Ajusta segun volumen.',
    link: null,
    orderIndex: 3
  },
  {
    menuSlug: 'settings',
    category: 'operations',
    title: 'Configuracion por entorno',
    content:
      'Mantener valores de entorno separados para dev y prod. Revisa CACHE_REDIS_ENABLED y QUEUE_REDIS_ENABLED si no hay Redis.',
    link: null,
    orderIndex: 4
  },

  {
    menuSlug: 'observability',
    category: 'concepts',
    title: 'Observabilidad',
    content:
      'La observabilidad permite medir latencia, errores y throughput. Es clave para dimensionar proveedores y detectar degradacion.',
    link: null,
    orderIndex: 1
  },
  {
    menuSlug: 'observability',
    category: 'metrics',
    title: 'Metricas recomendadas',
    content:
      'Latencia de runtime, errores por proveedor, coste diario por tenant, tasa de redaccion, profundidad de colas y fallos de webhooks.',
    link: null,
    orderIndex: 2
  },
  {
    menuSlug: 'observability',
    category: 'logs',
    title: 'Logs',
    content:
      'Los logs deben incluir correlationId, tenantId y providerId. Evita registrar prompts completos. Usa niveles de log y agrega a un sistema central.',
    link: null,
    orderIndex: 3
  },
  {
    menuSlug: 'observability',
    category: 'traces',
    title: 'Trazas distribuidas',
    content:
      'Integra OpenTelemetry para trazas de llamadas a proveedores. Esto ayuda a identificar cuellos de botella y fallos intermitentes.',
    link: null,
    orderIndex: 4
  },

  {
    menuSlug: 'documentation',
    category: 'concepts',
    title: 'Modelo de documentacion',
    content:
      'Cada entrada se asocia a menuSlug y category. El panel lateral muestra entradas por seccion. orderIndex permite controlar el orden visible.',
    link: null,
    orderIndex: 1
  },
  {
    menuSlug: 'documentation',
    category: 'search',
    title: 'Busqueda textual',
    content:
      'El parametro q busca por titulo o contenido. Se usa en el input global y en la pagina de docs. Combinar con menuSlug y category para filtrar.',
    link: null,
    orderIndex: 2
  },
  {
    menuSlug: 'documentation',
    category: 'api',
    title: 'Endpoints disponibles',
    content:
      'GET /docs, GET /docs/:id, POST /docs, PATCH /docs/:id, DELETE /docs/:id. Todos requieren autenticacion por API key o JWT.',
    link: null,
    orderIndex: 3
  },
  {
    menuSlug: 'documentation',
    category: 'workflow',
    title: 'Gestion operativa',
    content:
      'Actualiza la documentacion al cambiar politicas, proveedores o procesos. Usa la UI de Docs para mantener contenido vivo y consistente.',
    link: null,
    orderIndex: 4
  }
];
