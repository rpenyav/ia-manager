-- Overwrite documentation entries with full reference content
-- Usage: mysql -u <user> -p -h <host> -P <port> <db> < backend/docs.seed.sql

SET @now = NOW();
TRUNCATE TABLE documentation_entries;

INSERT INTO documentation_entries (id, menuSlug, category, title, content, link, orderIndex, enabled, createdAt, updatedAt) VALUES
  (UUID(), 'overview', 'concepts', 'Proposito del overview', 'El overview es la vista de control rapido para operaciones. Reune indicadores de uso, alertas y actividad reciente sin ejecutar acciones. Su objetivo es permitir decisiones rapidas sobre limites, proveedores y seguridad.', NULL, 1, 1, @now, @now),
  (UUID(), 'overview', 'data', 'Fuentes de informacion', 'Los datos del overview provienen de usage_events, audit_events y pricing_models. El consumo se calcula por dia y se asocia al tenant activo. Las alertas dependen de los limites de politicas y del scheduler.', NULL, 2, 1, @now, @now),
  (UUID(), 'overview', 'workflow', 'Flujo de trabajo recomendado', 'Revisa el overview al inicio de cada jornada. Si hay alertas, entra a Usage para detalle y a Audit para trazas. Si detectas riesgo, valida politicas, proveedores y kill switch.', NULL, 3, 1, @now, @now),
  (UUID(), 'overview', 'limits', 'Limitaciones de la vista', 'El overview no muestra prompts ni respuestas, solo metadatos. No es una consola de configuracion; para ajustes usa Tenants, Policies y Settings. La informacion es agregada, no reemplaza auditoria detallada.', NULL, 4, 1, @now, @now),

  (UUID(), 'tenants', 'concepts', 'Que es un tenant', 'Un tenant es una unidad logica que representa a un cliente o dominio de negocio. Cada tenant tiene proveedores, politicas y consumo aislados. Todas las operaciones runtime deben estar asociadas a un tenant valido.', NULL, 1, 1, @now, @now),
  (UUID(), 'tenants', 'workflow', 'Ciclo de vida del tenant', 'Crea el tenant, define la politica base, registra proveedores y valida el runtime. Ajusta limites a medida que el uso crece. Ante incidentes, activa el kill switch y revisa auditoria.', NULL, 2, 1, @now, @now),
  (UUID(), 'tenants', 'security', 'Kill switch por tenant', 'El kill switch del tenant bloquea todas las ejecuciones para ese tenant sin afectar a otros. Es la medida de contencion recomendada frente a abuso o coste inesperado. Se puede reactivar cuando el riesgo pase.', NULL, 3, 1, @now, @now),
  (UUID(), 'tenants', 'data', 'Datos almacenados', 'Se guarda solo metadata del tenant: nombre, estado y banderas de control. No se almacenan prompts ni respuestas completas. El objetivo es minimizar datos sensibles.', NULL, 4, 1, @now, @now),
  (UUID(), 'tenants', 'operaciones', 'Buenas practicas de administracion', 'Mantén nombres claros, registra un owner y revisa periodicamente politicas y proveedores asociados. Evita crear tenants duplicados por cliente.', NULL, 5, 1, @now, @now),
  (UUID(), 'tenants', 'troubleshooting', 'Diagnostico rapido', 'Si un tenant no puede ejecutar runtime, verifica que exista politica activa, que el kill switch esté desactivado y que tenga al menos un provider habilitado.', NULL, 6, 1, @now, @now),

  (UUID(), 'providers', 'concepts', 'Registro de proveedores', 'Los providers representan conexiones con LLMs externos. Cada provider tiene tipo, displayName, credenciales cifradas y configuracion adicional. El runtime usa providerId para decidir a quien llamar.', NULL, 1, 1, @now, @now),
  (UUID(), 'providers', 'security', 'Credenciales cifradas', 'Las credenciales se cifran en reposo mediante AES-GCM. Solo se descifran en memoria cuando el adapter ejecuta la llamada. No se exponen en ninguna respuesta del API.', NULL, 2, 1, @now, @now),
  (UUID(), 'providers', 'adapters', 'Adapters soportados', 'Se incluyen adapters para openai, azure-openai, aws-bedrock, vertex-ai y mock. Cada adapter normaliza la llamada a un contrato comun. Esto permite cambiar de proveedor sin modificar el resto del sistema.', NULL, 3, 1, @now, @now),
  (UUID(), 'providers', 'troubleshooting', 'Errores comunes', 'Revisa credenciales, region y limites del proveedor. Errores 401 suelen indicar credenciales invalidas; errores 429 indican limite del proveedor. Usa Audit para rastrear el origen.', NULL, 4, 1, @now, @now),

  (UUID(), 'policies', 'concepts', 'Politicas de consumo', 'Las politicas definen limites por tenant: requests por minuto, tokens diarios, coste diario y redaccion. Se aplican antes de cada ejecucion runtime. Sin politica valida no se permite ejecutar.', NULL, 1, 1, @now, @now),
  (UUID(), 'policies', 'limits', 'Rate limiting', 'maxRequestsPerMinute controla el numero de llamadas por minuto. Puede usar Redis o memoria. Exceder el limite retorna 429 y no se factura.', NULL, 2, 1, @now, @now),
  (UUID(), 'policies', 'limits', 'Tokens y coste diario', 'maxTokensPerDay y maxCostPerDayUsd se calculan con usage_events y pricing_models. Si se supera, la ejecucion se bloquea. Es clave para control financiero.', NULL, 3, 1, @now, @now),
  (UUID(), 'policies', 'data', 'Redaccion de datos', 'Cuando redactionEnabled esta activo, se aplica el modulo de redaccion antes de llamar al proveedor. Esto reduce la exposicion de datos sensibles en prompts.', NULL, 4, 1, @now, @now),

  (UUID(), 'runtime', 'concepts', 'Endpoint unico de ejecucion', 'El endpoint /runtime/execute es la unica puerta de acceso a IA. Centraliza autenticacion, politicas, redaccion, costeo y auditoria. Otros modulos deben consumir solo este endpoint.', NULL, 1, 1, @now, @now),
  (UUID(), 'runtime', 'workflow', 'Orden de validaciones', 'El flujo recomendado es: autenticar, validar kill switch global y por tenant, aplicar rate limit, validar limites de tokens y coste, redaccion, llamada al adapter, registrar audit y usage. Si alguna validacion falla, se corta la ejecucion.', NULL, 2, 1, @now, @now),
  (UUID(), 'runtime', 'errors', 'Errores y respuestas', 'Errores de autenticacion retornan 401. Limites superados retornan 429 o 403 segun el caso. Fallos de proveedor retornan 502 con mensaje resumido. No se devuelven credenciales ni payloads sensibles.', NULL, 3, 1, @now, @now),
  (UUID(), 'runtime', 'performance', 'Latencia y concurrencia', 'La latencia depende del proveedor externo. Usa colas si deseas aislar cargas y reintentos. Configura timeouts y observa el throughput en Observability.', NULL, 4, 1, @now, @now),

  (UUID(), 'usage', 'concepts', 'Eventos de uso', 'Cada ejecucion genera un usage_event con tokens de entrada y salida, modelo y coste. Esta tabla es la base para resumenes, limites y alertas.', NULL, 1, 1, @now, @now),
  (UUID(), 'usage', 'alerts', 'Alertas automaticas', 'El scheduler evalua consumo segun cron y genera alertas si se exceden limites. Los canales habilitados reciben notificaciones. Ajusta cron y minIntervalMinutes para evitar spam.', NULL, 2, 1, @now, @now),
  (UUID(), 'usage', 'summary', 'Resumen diario', 'El resumen agrega tokens y coste por tenant en el dia actual. Se calcula en tiempo real, no se guarda duplicado. Es util para dashboards y reportes operativos.', NULL, 3, 1, @now, @now),
  (UUID(), 'usage', 'workflow', 'Investigacion de gastos', 'Si hay incremento anormal, revisa Pricing para confirmar tarifas. Luego revisa Providers y Audit para identificar origen. Considera activar kill switch temporal.', NULL, 4, 1, @now, @now),

  (UUID(), 'audit', 'concepts', 'Audit trail', 'audit_events registra acciones clave con estado y metadatos. Es el registro principal de cumplimiento y seguridad. Permite trazar cada llamada sin almacenar prompts completos.', NULL, 1, 1, @now, @now),
  (UUID(), 'audit', 'data', 'Metadatos auditables', 'Incluye tenantId, accion, estado y metadata contextual. Se recomienda no incluir contenido sensible en metadata. Usa identificadores y referencias en lugar de payloads completos.', NULL, 2, 1, @now, @now),
  (UUID(), 'audit', 'integration', 'Exportacion de eventos', 'Los eventos pueden enviarse a webhooks y SQS. Esto habilita integracion con SIEM, data lake o pipelines de cumplimiento. El envio no bloquea el flujo principal.', NULL, 3, 1, @now, @now),
  (UUID(), 'audit', 'privacy', 'Privacidad y retencion', 'No se guardan prompts ni respuestas completas. Define politicas de retencion si exportas eventos fuera del sistema. Esto facilita compliance con normativas.', NULL, 4, 1, @now, @now),

  (UUID(), 'pricing', 'concepts', 'Pricing por modelo', 'Cada entrada define coste por 1k tokens de entrada y salida para un modelo. El providerType normaliza variantes como azure-openai o aws-bedrock.', NULL, 1, 1, @now, @now),
  (UUID(), 'pricing', 'resolution', 'Resolucion de precios', 'El runtime busca primero coincidencia exacta por modelo. Si no existe, usa la entrada comodin con model = *. Esto evita fallos cuando el proveedor retorna modelos nuevos.', NULL, 2, 1, @now, @now),
  (UUID(), 'pricing', 'operations', 'Mantenimiento de tarifas', 'Actualiza tarifas cuando cambien los precios del proveedor. Deshabilita entradas obsoletas para evitar costeo incorrecto. Usa la UI o el endpoint /pricing.', NULL, 3, 1, @now, @now),
  (UUID(), 'pricing', 'impact', 'Impacto en limites', 'El coste calculado influye en maxCostPerDayUsd. Precios incorrectos pueden bloquear uso o permitir gastos excesivos. Revisa periodicamente.', NULL, 4, 1, @now, @now),

  (UUID(), 'webhooks', 'concepts', 'Webhooks de auditoria', 'Los webhooks envian eventos a sistemas externos. Puedes filtrar por tipo de evento y por tenant. Son utiles para integraciones con plataformas internas.', NULL, 1, 1, @now, @now),
  (UUID(), 'webhooks', 'security', 'Firmas y autenticidad', 'Si defines un secreto, el payload se firma con HMAC SHA256. El receptor puede validar la firma para asegurar integridad y autenticidad.', NULL, 2, 1, @now, @now),
  (UUID(), 'webhooks', 'delivery', 'Entrega y reintentos', 'Con colas habilitadas, el envio se gestiona en background. Sin colas, el envio es directo y cualquier fallo se registra como error. La app principal no se bloquea.', NULL, 3, 1, @now, @now),
  (UUID(), 'webhooks', 'events', 'Tipos de eventos', 'El evento base es audit.event. Puedes ampliar con otros eventos si agregas nuevos modulos. Usa el campo events para filtrar por tipo o * para todos.', NULL, 4, 1, @now, @now),

  (UUID(), 'notifications', 'concepts', 'Canales de alertas', 'Los canales definen destinos para alertas automaticas. Pueden ser globales o por tenant. Se habilitan o deshabilitan sin borrar configuracion.', NULL, 1, 1, @now, @now),
  (UUID(), 'notifications', 'email', 'Email', 'Configura SMTP en variables de entorno y define recipients en el canal. El contenido del email incluye severidad, limites y consumo actual.', NULL, 2, 1, @now, @now),
  (UUID(), 'notifications', 'slack', 'Slack', 'Configura webhookUrl en el canal. El mensaje incluye tenant, tipo de alerta y valores que superaron el limite.', NULL, 3, 1, @now, @now),
  (UUID(), 'notifications', 'operations', 'Buenas practicas', 'Define canales globales para equipo central y canales por tenant para equipos dedicados. Ajusta el cron para evitar ruido innecesario.', NULL, 4, 1, @now, @now),

  (UUID(), 'settings', 'concepts', 'Ajustes globales', 'Settings controla funciones globales: kill switch, cron de alertas y parametros operativos. Son cambios de alto impacto y deben auditarse.', NULL, 1, 1, @now, @now),
  (UUID(), 'settings', 'kill', 'Kill switch global', 'Bloquea todas las ejecuciones runtime para todos los tenants. Usar solo en incidentes graves. Revertir cuando la causa este mitigada.', NULL, 2, 1, @now, @now),
  (UUID(), 'settings', 'scheduler', 'Cron de alertas', 'ALERTS_CRON define cada cuanto se evalua el consumo. ALERTS_MIN_INTERVAL_MINUTES evita reenvios constantes. Ajusta segun volumen.', NULL, 3, 1, @now, @now),
  (UUID(), 'settings', 'operations', 'Configuracion por entorno', 'Mantener valores de entorno separados para dev y prod. Revisa CACHE_REDIS_ENABLED y QUEUE_REDIS_ENABLED si no hay Redis.', NULL, 4, 1, @now, @now),

  (UUID(), 'observability', 'concepts', 'Observabilidad', 'La observabilidad permite medir latencia, errores y throughput. Es clave para dimensionar proveedores y detectar degradacion.', NULL, 1, 1, @now, @now),
  (UUID(), 'observability', 'metrics', 'Metricas recomendadas', 'Latencia de runtime, errores por proveedor, coste diario por tenant, tasa de redaccion, profundidad de colas y fallos de webhooks.', NULL, 2, 1, @now, @now),
  (UUID(), 'observability', 'logs', 'Logs', 'Los logs deben incluir correlationId, tenantId y providerId. Evita registrar prompts completos. Usa niveles de log y agrega a un sistema central.', NULL, 3, 1, @now, @now),
  (UUID(), 'observability', 'traces', 'Trazas distribuidas', 'Integra OpenTelemetry para trazas de llamadas a proveedores. Esto ayuda a identificar cuellos de botella y fallos intermitentes.', NULL, 4, 1, @now, @now),

  (UUID(), 'documentation', 'concepts', 'Modelo de documentacion', 'Cada entrada se asocia a menuSlug y category. El panel lateral muestra entradas por seccion. orderIndex permite controlar el orden visible.', NULL, 1, 1, @now, @now),
  (UUID(), 'documentation', 'search', 'Busqueda textual', 'El parametro q busca por titulo o contenido. Se usa en el input global y en la pagina de docs. Combinar con menuSlug y category para filtrar.', NULL, 2, 1, @now, @now),
  (UUID(), 'documentation', 'api', 'Endpoints disponibles', 'GET /docs, GET /docs/:id, POST /docs, PATCH /docs/:id, DELETE /docs/:id. Todos requieren autenticacion por API key o JWT.', NULL, 3, 1, @now, @now),
  (UUID(), 'documentation', 'workflow', 'Gestion operativa', 'Actualiza la documentacion al cambiar politicas, proveedores o procesos. Usa la UI de Docs para mantener contenido vivo y consistente.', NULL, 4, 1, @now, @now);
