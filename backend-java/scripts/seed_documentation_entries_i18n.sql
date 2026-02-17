-- Seed i18n content for documentation_entries (en, ca)
SET NAMES utf8mb4;
START TRANSACTION;

UPDATE documentation_entries
SET
  title_en = 'Text search',
  content_en = 'The q parameter searches by title or content. It is used in the global input and in the Docs page. Combine with menuSlug and category to filter.',
  title_ca = 'Cerca textual',
  content_ca = 'El parametre q cerca per titol o contingut. Es utilitza al cercador global i a la pagina de docs. Combina amb menuSlug i category per filtrar.'
WHERE id = '0602f9ec-7794-4250-a368-e0d1816c979d';

UPDATE documentation_entries
SET
  title_en = 'Consumption policies',
  content_en = 'Policies define limits per tenant: requests per minute, daily tokens, daily cost, and redaction. They apply before each runtime execution. Without a valid policy, execution is not allowed.',
  title_ca = 'Politiques de consum',
  content_ca = 'Les politiques defineixen limits per tenant: sollicituds per minut, tokens diaris, cost diari i redaccio. Es apliquen abans de cada execucio runtime. Sense una politica valida no es permet executar.'
WHERE id = '0754a8ba-e941-4951-9960-12c4048a9923';

UPDATE documentation_entries
SET
  title_en = 'Environment configuration',
  content_en = 'Keep separate environment values for dev and prod. Check CACHE_REDIS_ENABLED and QUEUE_REDIS_ENABLED if Redis is not available.',
  title_ca = 'Configuracio per entorn',
  content_ca = 'Mantingues valors de entorn separats per dev i prod. Revisa CACHE_REDIS_ENABLED i QUEUE_REDIS_ENABLED si no hi ha Redis.'
WHERE id = '0c7e5141-4614-455c-aa0e-45fbe82f528b';

UPDATE documentation_entries
SET
  title_en = 'Encrypted credentials',
  content_en = 'Credentials are encrypted at rest using AES-GCM. They are decrypted in memory only when the adapter executes the call. They are not exposed in any API response.',
  title_ca = 'Credencials xifrades',
  content_ca = 'Les credencials es xifren en repos amb AES-GCM. Nomes es desxifren en memoria quan el adapter executa la crida. No es exposen en cap resposta de l API.'
WHERE id = '15d2171b-16d4-4a8f-bbc8-c207056a0bba';

UPDATE documentation_entries
SET
  title_en = 'Auditing',
  content_en = 'Event logging without storing full prompts.',
  title_ca = 'Auditoria',
  content_ca = 'Registre de esdeveniments sense emmagatzemar prompts complets.'
WHERE id = '16891323-df83-4dd9-b221-12c24c9a33f3';

UPDATE documentation_entries
SET
  title_en = 'Impact on limits',
  content_en = 'The calculated cost affects maxCostPerDayUsd. Incorrect prices can block usage or allow excessive spend. Review periodically.',
  title_ca = 'Impacte en limits',
  content_ca = 'El cost calculat influeix en maxCostPerDayUsd. Preus incorrectes poden bloquejar el us o permetre despeses excessives. Revisa periodicament.'
WHERE id = '1f79c4e8-54e6-4487-a0c4-bf07d48efbaf';

UPDATE documentation_entries
SET
  title_en = 'Documentation model',
  content_en = 'Each entry is associated with menuSlug and category. The side panel shows entries by section. orderIndex controls the visible order.',
  title_ca = 'Model de documentacio',
  content_ca = 'Cada entrada es associa a menuSlug i category. El panell lateral mostra entrades per seccio. orderIndex permet controlar el ordre visible.'
WHERE id = '22061ce4-c7da-427c-9464-3187451f9980';

UPDATE documentation_entries
SET
  title_en = 'Latency and concurrency',
  content_en = 'Latency depends on the external provider. Use queues if you want to isolate load and retries. Configure timeouts and watch throughput in Observability.',
  title_ca = 'Latencia i concurrencia',
  content_ca = 'La latencia depen del proveidor extern. Usa cues si vols aillar carrega i reintents. Configura timeouts i observa el throughput a Observability.'
WHERE id = '26352f0f-073f-484d-89b2-29b99fd7855a';

UPDATE documentation_entries
SET
  title_en = 'Email',
  content_en = 'Configure SMTP in environment variables and define recipients in the channel. The email content includes severity, limits, and current usage.',
  title_ca = 'Email',
  content_ca = 'Configura SMTP a les variables de entorn i defineix recipients al canal. El contingut del email inclou severitat, limits i consum actual.'
WHERE id = '27b080ee-4f9a-4612-9394-b1bca1c3f174';

UPDATE documentation_entries
SET
  title_en = 'Alerts cron',
  content_en = 'ALERTS_CRON defines how often consumption is evaluated. ALERTS_MIN_INTERVAL_MINUTES prevents constant resends. Adjust by volume.',
  title_ca = 'Cron de alertes',
  content_ca = 'ALERTS_CRON defineix cada quant s avalua el consum. ALERTS_MIN_INTERVAL_MINUTES evita reenviaments constants. Ajusta segons volum.'
WHERE id = '28d7874e-d3c1-4aa9-be7a-21e4f1c73912';

UPDATE documentation_entries
SET
  title_en = 'Pricing maintenance',
  content_en = 'Update rates when provider prices change. Disable obsolete entries to avoid incorrect costing. Use the UI or the /pricing endpoint.',
  title_ca = 'Manteniment de tarifes',
  content_ca = 'Actualitza tarifes quan canviin els preus del proveidor. Deshabilita entrades obsoletes per evitar costejos incorrectes. Usa la UI o el endpoint /pricing.'
WHERE id = '2c7a88e9-7c6a-4d89-adcd-008d63ff831e';

UPDATE documentation_entries
SET
  title_en = 'Signatures and authenticity',
  content_en = 'If you set a secret, the payload is signed with HMAC SHA256. The receiver can validate the signature to ensure integrity and authenticity.',
  title_ca = 'Signatures i autenticitat',
  content_ca = 'Si defineixes un secret, el payload es signa amb HMAC SHA256. El receptor pot validar la signatura per assegurar integritat i autenticitat.'
WHERE id = '33c88e3b-c397-4272-979b-2cce110795e0';

UPDATE documentation_entries
SET
  title_en = 'Quick diagnosis',
  content_en = 'If a tenant cannot run runtime, verify there is an active policy, the kill switch is off, and there is at least one enabled provider.',
  title_ca = 'Diagnosi rapida',
  content_ca = 'Si un tenant no pot executar runtime, verifica que existeixi politica activa, que el kill switch estigui desactivat i que tingui almenys un provider habilitat.'
WHERE id = '3456de5c-e5c7-404f-a6ff-4fa37441a348';

UPDATE documentation_entries
SET
  title_en = 'Notification channels',
  content_en = 'Configure email or Slack for consumption alerts.',
  title_ca = 'Canals de notificacio',
  content_ca = 'Configura email o Slack per a alertes de consum.'
WHERE id = '3fc31f70-a2da-4c34-a4d1-6b36cda42102';

UPDATE documentation_entries
SET
  title_en = 'Usage monitoring',
  content_en = 'Check consumption and trigger alerts according to policies.',
  title_ca = 'Monitoratge de us',
  content_ca = 'Consulta consum i dispara alertes segons politiques.'
WHERE id = '409cecab-902d-4e90-9edf-d467bbdb37da';

UPDATE documentation_entries
SET
  title_en = 'Observability',
  content_en = 'Observability lets you measure latency, errors, and throughput. It is key to sizing providers and detecting degradation.',
  title_ca = 'Observabilitat',
  content_ca = 'La observabilitat permet mesurar latencia, errors i throughput. Es clau per dimensionar proveidors i detectar degradacio.'
WHERE id = '452e0f62-b4e0-44d5-81d4-554227c4945f';

UPDATE documentation_entries
SET
  title_en = 'What is a tenant',
  content_en = 'A tenant is a logical unit representing a client or business domain. Each tenant has isolated providers, policies, and consumption. All runtime operations must be associated with a valid tenant.',
  title_ca = 'Que es un tenant',
  content_ca = 'Un tenant es una unitat logica que representa un client o domini de negoci. Cada tenant te proveidors, politiques i consum aillats. Totes les operacions runtime han estar associades a un tenant valid.'
WHERE id = '46df6032-06a4-4802-bb74-a72c5d82e4cd';

UPDATE documentation_entries
SET
  title_en = 'Global kill switch',
  content_en = 'Blocks all runtime executions for all tenants. Use only in severe incidents. Revert when the cause is mitigated.',
  title_ca = 'Kill switch global',
  content_ca = 'Bloqueja totes les execucions runtime per a tots els tenants. Usa-ho nomes en incidents greus. Reverteix quan la causa estigui mitigada.'
WHERE id = '4e6b00d9-2b6a-4890-98c8-aa66db632efd';

UPDATE documentation_entries
SET
  title_en = 'Rate limiting',
  content_en = 'maxRequestsPerMinute controls the number of calls per minute. It can use Redis or memory. Exceeding the limit returns 429 and is not billed.',
  title_ca = 'Limitacio de taxa',
  content_ca = 'maxRequestsPerMinute controla el numero de crides per minut. Pot usar Redis o memoria. Superar el limit retorna 429 i no es factura.'
WHERE id = '54cb5788-1eb2-4277-a5fc-b6876747746f';

UPDATE documentation_entries
SET
  title_en = 'Event types',
  content_en = 'The base event is audit.event. You can extend it with other events if you add new modules. Use the events field to filter by type or * for all.',
  title_ca = 'Tipus de esdeveniments',
  content_ca = 'El esdeveniment base es audit.event. Pots ampliar amb altres esdeveniments si afegeixes nous moduls. Usa el camp events per filtrar per tipus o * per a tots.'
WHERE id = '550a569c-10f8-466b-b0a3-76185a700cfc';

UPDATE documentation_entries
SET
  title_en = 'Best practices',
  content_en = 'Define global channels for the central team and per-tenant channels for dedicated teams. Adjust the cron to avoid unnecessary noise.',
  title_ca = 'Bones practiques',
  content_ca = 'Defineix canals globals per a equip central i canals per tenant per a equips dedicats. Ajusta el cron per evitar soroll innecessari.'
WHERE id = '55eb73cd-cc2c-48e1-9d76-7a4e76bad50d';

UPDATE documentation_entries
SET
  title_en = 'Tokens and daily cost',
  content_en = 'maxTokensPerDay and maxCostPerDayUsd are calculated from usage_events and pricing_models. If exceeded, execution is blocked. This is key for financial control.',
  title_ca = 'Tokens i cost diari',
  content_ca = 'maxTokensPerDay i maxCostPerDayUsd es calculen amb usage_events i pricing_models. Si se supera, la execucio es bloqueja. Es clau per al control financer.'
WHERE id = '5e67f051-3aca-4f98-afbd-2adb46f5c840';

UPDATE documentation_entries
SET
  title_en = 'Errors and responses',
  content_en = 'Authentication errors return 401. Exceeded limits return 429 or 403 depending on the case. Provider failures return 502 with a summarized message. Credentials and sensitive payloads are not returned.',
  title_ca = 'Errors i respostes',
  content_ca = 'Errors de autenticacio retornen 401. Limits superats retornen 429 o 403 segons el cas. Falles de proveidor retornen 502 amb missatge resumit. No es retornen credencials ni payloads sensibles.'
WHERE id = '5e73dc62-dd54-475d-8b8e-eb0ac66ebc7d';

UPDATE documentation_entries
SET
  title_en = 'Event export',
  content_en = 'Events can be sent to webhooks and SQS. This enables integration with SIEM, data lake, or compliance pipelines. Sending does not block the main flow.',
  title_ca = 'Exportacio de esdeveniments',
  content_ca = 'Els esdeveniments es poden enviar a webhooks i SQS. Aixo habilita integracio amb SIEM, data lake o pipelines de compliment. El enviament no bloqueja el flux principal.'
WHERE id = '5f1cf793-44b9-4fe6-bf54-9acda5d3fcc9';

UPDATE documentation_entries
SET
  title_en = 'Data redaction',
  content_en = 'When redactionEnabled is active, the redaction module runs before calling the provider. This reduces exposure of sensitive data in prompts.',
  title_ca = 'Redaccio de dades',
  content_ca = 'Quan redactionEnabled esta actiu, el modul de redaccio s aplica abans de cridar al proveidor. Aixo redueix la exposicio de dades sensibles als prompts.'
WHERE id = '65959567-1231-468f-8da7-fb2ec70cab70';

UPDATE documentation_entries
SET
  title_en = 'Single execution endpoint',
  content_en = 'The /runtime/execute endpoint is the only gateway to AI. It centralizes authentication, policies, redaction, costing, and auditing. Other modules must consume only this endpoint.',
  title_ca = 'Endpoint unic de execucio',
  content_ca = 'El endpoint /runtime/execute es la unica porta de acces a la IA. Centralitza autenticacio, politiques, redaccio, cost i auditoria. Altres moduls han de consumir nomes aquest endpoint.'
WHERE id = '6766741f-3160-4748-99de-1f4dc7f7b6e1';

UPDATE documentation_entries
SET
  title_en = 'Internal documentation',
  content_en = 'Create and organize entries by menu, category, and order.',
  title_ca = 'Documentacio interna',
  content_ca = 'Crea i organitza entrades per menu, categoria i ordre.'
WHERE id = '6acbc400-f5bd-455b-aef4-d9731bbbce08';

UPDATE documentation_entries
SET
  title_en = 'Global settings',
  content_en = 'Settings controls global functions: kill switch, alerts cron, and operational parameters. These are high-impact changes and must be audited.',
  title_ca = 'Ajustos globals',
  content_ca = 'Settings controla funcions globals: kill switch, cron de alertes i parametres operatius. Son canvis de alt impacte i han de ser auditats.'
WHERE id = '6adc15c3-d8da-4531-8814-0640f60b9188';

UPDATE documentation_entries
SET
  title_en = 'Webhooks',
  content_en = 'Send events to your systems for external auditing.',
  title_ca = 'Webhooks',
  content_ca = 'Envia esdeveniments als teus sistemes per a auditoria externa.'
WHERE id = '7dea657e-380c-4379-9635-e6df02ffa33b';

UPDATE documentation_entries
SET
  title_en = 'Order of validations',
  content_en = 'The recommended flow is: authenticate, validate global and tenant kill switch, apply rate limit, validate token and cost limits, redaction, adapter call, register audit and usage. If any validation fails, execution stops.',
  title_ca = 'Ordre de validacions',
  content_ca = 'El flux recomanat es: autenticar, validar kill switch global i per tenant, aplicar rate limit, validar limits de tokens i cost, redaccio, crida al adapter, registrar audit i usage. Si alguna validacio falla, es talla la execucio.'
WHERE id = '80de6326-607a-46c1-89bd-ba4df53d598e';

UPDATE documentation_entries
SET
  title_en = 'Supported adapters',
  content_en = 'Adapters are included for openai, azure-openai, aws-bedrock, vertex-ai, and mock. Each adapter normalizes the call to a common contract. This allows switching providers without changing the rest of the system.',
  title_ca = 'Adapters suportats',
  content_ca = 'S inclouen adapters per openai, azure-openai, aws-bedrock, vertex-ai i mock. Cada adapter normalitza la crida a un contracte comu. Aixo permet canviar de proveidor sense modificar la resta del sistema.'
WHERE id = '83677bfc-810e-49dd-a921-204734ba0844';

UPDATE documentation_entries
SET
  title_en = 'Create and operate tenants',
  content_en = 'Each tenant represents a client with its own policies and limits.',
  title_ca = 'Crear i operar tenants',
  content_ca = 'Cada tenant representa un client amb politiques i limits propis.'
WHERE id = '90c05e7e-cc00-4e6e-ab9e-b9401a86d718';

UPDATE documentation_entries
SET
  title_en = 'Tenant lifecycle',
  content_en = 'Create the tenant, define the base policy, register providers, and validate runtime. Adjust limits as usage grows. In incidents, activate the kill switch and review audit.',
  title_ca = 'Cicle de vida del tenant',
  content_ca = 'Crea el tenant, defineix la politica base, registra proveidors i valida el runtime. Ajusta limits a mesura que el us creix. En incidents, activa el kill switch i revisa auditoria.'
WHERE id = '94ba10ba-ca65-4ef5-bb36-3afe66493d97';

UPDATE documentation_entries
SET
  title_en = 'Operational management',
  content_en = 'Update documentation when policies, providers, or processes change. Use the Docs UI to keep content alive and consistent.',
  title_ca = 'Gestio operativa',
  content_ca = 'Actualitza la documentacio en canviar politiques, proveidors o processos. Usa la UI de Docs per mantenir contingut viu i consistent.'
WHERE id = '9530b72a-9f67-4feb-826b-c71a50a26b1a';

UPDATE documentation_entries
SET
  title_en = 'Automatic alerts',
  content_en = 'The scheduler evaluates consumption by cron and generates alerts if limits are exceeded. Enabled channels receive notifications. Adjust cron and minIntervalMinutes to avoid spam.',
  title_ca = 'Alertes automatiques',
  content_ca = 'El scheduler avalua el consum segons cron i genera alertes si es superen limits. Els canals habilitats reben notificacions. Ajusta cron i minIntervalMinutes per evitar spam.'
WHERE id = '9a049167-57c0-4ae5-a1bd-fc69f20f13f9';

UPDATE documentation_entries
SET
  title_en = 'Usage events',
  content_en = 'Each execution generates a usage_event with input and output tokens, model, and cost. This table is the basis for summaries, limits, and alerts.',
  title_ca = 'Esdeveniments de us',
  content_ca = 'Cada execucio genera un usage_event amb tokens de entrada i sortida, model i cost. Aquesta taula es la base per a resums, limits i alertes.'
WHERE id = '9a1b6aa8-8fb7-4592-9d73-87d807b83ef5';

UPDATE documentation_entries
SET
  title_en = 'Common errors',
  content_en = 'Check credentials, region, and provider limits. 401 errors usually mean invalid credentials; 429 errors indicate provider limits. Use Audit to trace the origin.',
  title_ca = 'Errors comuns',
  content_ca = 'Revisa credencials, regio i limits del proveidor. Errors 401 solen indicar credencials invalides; errors 429 indiquen limit del proveidor. Usa Audit per rastrejar el origen.'
WHERE id = '9d37ca82-be04-4cf8-b305-26765a3842ae';

UPDATE documentation_entries
SET
  title_en = 'Available endpoints',
  content_en = 'GET /docs, GET /docs/:id, POST /docs, PATCH /docs/:id, DELETE /docs/:id. All require API key or JWT authentication.',
  title_ca = 'Endpoints disponibles',
  content_ca = 'GET /docs, GET /docs/:id, POST /docs, PATCH /docs/:id, DELETE /docs/:id. Tots requereixen autenticacio per API key o JWT.'
WHERE id = '9e9f688a-30f4-4510-943e-7e65e9fb87bc';

UPDATE documentation_entries
SET
  title_en = 'Delivery and retries',
  content_en = 'With queues enabled, delivery is handled in the background. Without queues, delivery is direct and any failure is recorded as an error. The main app is not blocked.',
  title_ca = 'Entrega i reintents',
  content_ca = 'Amb cues habilitades, el enviament es gestiona en background. Sense cues, el enviament es directe i qualsevol fallada es registra com a error. La app principal no es bloqueja.'
WHERE id = 'a247c63e-b3e5-4cd7-a853-24f63a09c02e';

UPDATE documentation_entries
SET
  title_en = 'Provider registry',
  content_en = 'Providers represent connections to external LLMs. Each provider has type, displayName, encrypted credentials, and additional configuration. Runtime uses providerId to decide who to call.',
  title_ca = 'Registre de proveidors',
  content_ca = 'Els providers representen connexions amb LLMs externs. Cada provider te tipus, displayName, credencials xifrades i configuracio addicional. El runtime usa providerId per decidir a qui cridar.'
WHERE id = 'a6a239a0-6035-40d7-a9f8-7ddbc522fc5d';

UPDATE documentation_entries
SET
  title_en = 'Pricing by model',
  content_en = 'Each entry defines cost per 1k input and output tokens for a model. providerType normalizes variants such as azure-openai or aws-bedrock.',
  title_ca = 'Pricing per model',
  content_ca = 'Cada entrada defineix cost per 1k tokens de entrada i sortida per a un model. El providerType normalitza variants com azure-openai o aws-bedrock.'
WHERE id = 'a80bcb4d-3c54-44be-9de2-1f0c103e4d9e';

UPDATE documentation_entries
SET
  title_en = 'Audit trail',
  content_en = 'audit_events records key actions with status and metadata. It is the main compliance and security log. It allows tracing each call without storing full prompts.',
  title_ca = 'Traca de auditoria',
  content_ca = 'audit_events registra accions clau amb estat i metadades. Es el registre principal de compliment i seguretat. Permet tracar cada crida sense emmagatzemar prompts complets.'
WHERE id = 'aa6fdbce-69d1-421b-861d-b9ca3b92a44a';

UPDATE documentation_entries
SET
  title_en = 'Price resolution',
  content_en = 'Runtime first looks for an exact match by model. If none exists, it uses the wildcard entry with model = *. This avoids failures when the provider returns new models.',
  title_ca = 'Resolucio de preus',
  content_ca = 'El runtime busca primer coincidencia exacta per model. Si no existeix, usa la entrada comodin amb model = *. Aixo evita fallades quan el proveidor retorna models nous.'
WHERE id = 'ad40a9bf-e3c3-4422-ab07-d692023500f8';

UPDATE documentation_entries
SET
  title_en = 'Slack',
  content_en = 'Configure webhookUrl in the channel. The message includes tenant, alert type, and values that exceeded the limit.',
  title_ca = 'Slack',
  content_ca = 'Configura webhookUrl al canal. El missatge inclou tenant, tipus de alerta i valors que han superat el limit.'
WHERE id = 'b0143ccb-d125-4ac0-a5a8-1e0f16e32b26';

UPDATE documentation_entries
SET
  title_en = 'Audit webhooks',
  content_en = 'Webhooks send events to external systems. You can filter by event type and by tenant. They are useful for integrations with internal platforms.',
  title_ca = 'Webhooks de auditoria',
  content_ca = 'Els webhooks envien esdeveniments a sistemes externs. Pots filtrar per tipus de esdeveniment i per tenant. Son utils per a integracions amb plataformes internes.'
WHERE id = 'b1137492-21d8-4822-9b16-e6760b3b4f4c';

UPDATE documentation_entries
SET
  title_en = 'Recommended workflow',
  content_en = 'Review the overview at the start of each day. If there are alerts, go to Usage for details and to Audit for traces. If you detect risk, validate policies, providers, and kill switch.',
  title_ca = 'Flux de treball recomanat',
  content_ca = 'Revisa el overview al inici de cada jornada. Si hi ha alertes, entra a Usage per al detall i a Audit per a traces. Si detectes risc, valida politiques, proveidors i kill switch.'
WHERE id = 'b44c8e9f-85d2-41f3-917a-4657a4985277';

UPDATE documentation_entries
SET
  title_en = 'Global service prompt',
  content_en = 'Define the assistant base behavior: tone, rules, and context. Keep instructions clear and avoid including sensitive data or credentials.',
  title_ca = 'Prompt global del servei',
  content_ca = 'Defineix el comportament base de l assistent: to, regles i context. Manten instruccions clares i evita incloure dades sensibles o credencials.'
WHERE id = 'bb5c341c-0900-11f1-81e5-5a0d05a37ed2';

UPDATE documentation_entries
SET
  title_en = 'Required endpoints',
  content_en = 'If the service has endpoints enabled, it is mandatory to create at least one endpoint. Define method, path, and optionally base URL and headers.',
  title_ca = 'Endpoints obligatoris',
  content_ca = 'Si el servei te endpoints habilitats, es obligatori crear almenys un endpoint. Defineix metode, path i opcionalment base URL i headers.'
WHERE id = 'bb5c724c-0900-11f1-81e5-5a0d05a37ed2';

UPDATE documentation_entries
SET
  title_en = 'Users assigned to the service',
  content_en = 'Chat users who can use this service are linked here. Assign existing users and manage their status from this section.',
  title_ca = 'Usuaris assignats al servei',
  content_ca = 'Aqui es vinculen els usuaris de xat que podran usar aquest servei. Assigna usuaris existents i gestiona el seu estat des de aquesta seccio.'
WHERE id = 'bb5d1652-0900-11f1-81e5-5a0d05a37ed2';

UPDATE documentation_entries
SET
  title_en = 'Service runtime test',
  content_en = 'Run a manual test using the configured provider or model. Requires an active tenant API key.',
  title_ca = 'Prova runtime del servei',
  content_ca = 'Executa una prova manual usant el provider o model configurat. Requereix API key activa del tenant.'
WHERE id = 'bb5d16ca-0900-11f1-81e5-5a0d05a37ed2';

UPDATE documentation_entries
SET
  title_en = 'Alert channels',
  content_en = 'Channels define destinations for automatic alerts. They can be global or per tenant. They can be enabled or disabled without deleting configuration.',
  title_ca = 'Canals de alertes',
  content_ca = 'Els canals defineixen destinacions per alertes automatiques. Poden ser globals o per tenant. Es habiliten o deshabiliten sense esborrar configuracio.'
WHERE id = 'bf0d6af1-9a9d-4da8-82a1-b100c5886db7';

UPDATE documentation_entries
SET
  title_en = 'Administration best practices',
  content_en = 'Keep clear names, register an owner, and periodically review associated policies and providers. Avoid creating duplicate tenants per client.',
  title_ca = 'Bones practiques de administracio',
  content_ca = 'Manten noms clars, registra un owner i revisa periodicament politiques i proveidors associats. Evita crear tenants duplicats per client.'
WHERE id = 'bf743da7-d23c-4158-8c82-796d50859410';

UPDATE documentation_entries
SET
  title_en = 'What the overview shows',
  content_en = 'Quick summary of consumption, alerts, and active providers.',
  title_ca = 'Que mostra el overview',
  content_ca = 'Resum rapid de consum, alertes i proveidors actius.'
WHERE id = 'c15dffe5-e2ec-4530-82f2-cbc43275aaf6';

UPDATE documentation_entries
SET
  title_en = 'Stored data',
  content_en = 'Only tenant metadata is stored: name, status, and control flags. Prompts and full responses are not stored. The goal is to minimize sensitive data.',
  title_ca = 'Dades emmagatzemades',
  content_ca = 'Es guarda nomes metadata del tenant: nom, estat i banderes de control. No es emmagatzemen prompts ni respostes completes. El objectiu es minimitzar dades sensibles.'
WHERE id = 'c664a642-d9d7-4956-aa17-c49eace1dd76';

UPDATE documentation_entries
SET
  title_en = 'Daily summary',
  content_en = 'The summary aggregates tokens and cost per tenant for the current day. It is computed in real time and not stored twice. Useful for dashboards and operational reports.',
  title_ca = 'Resum diari',
  content_ca = 'El resum agrega tokens i cost per tenant del dia actual. Es calcula en temps real, no es guarda duplicat. Es util per a dashboards i informes operatius.'
WHERE id = 'cc58a316-e113-4cd6-8b09-01279d2453c9';

UPDATE documentation_entries
SET
  title_en = 'Recommended metrics',
  content_en = 'Runtime latency, errors by provider, daily cost per tenant, redaction rate, queue depth, and webhook failures.',
  title_ca = 'Metriques recomanades',
  content_ca = 'Latencia de runtime, errors per proveidor, cost diari per tenant, taxa de redaccio, profunditat de cues i falles de webhooks.'
WHERE id = 'd7e89a66-4959-41fe-9e04-f1e28f063f3c';

UPDATE documentation_entries
SET
  title_en = 'Distributed traces',
  content_en = 'Integrate OpenTelemetry for traces of calls to providers. This helps identify bottlenecks and intermittent failures.',
  title_ca = 'Trazes distribuides',
  content_ca = 'Integra OpenTelemetry per a traces de crides a proveidors. Aixo ajuda a identificar colls de ampolla i fallades intermitents.'
WHERE id = 'da476dda-8666-4677-ab07-874431edc1c1';

UPDATE documentation_entries
SET
  title_en = 'Spend investigation',
  content_en = 'If there is an abnormal increase, review Pricing to confirm rates. Then review Providers and Audit to identify the source. Consider activating a temporary kill switch.',
  title_ca = 'Investigacio de despeses',
  content_ca = 'Si hi ha increment anormal, revisa Pricing per confirmar tarifes. Despres revisa Providers i Audit per identificar origen. Considera activar kill switch temporal.'
WHERE id = 'e0c75e6a-f471-46d8-9e41-e56bcbabf1fe';

UPDATE documentation_entries
SET
  title_en = 'View limitations',
  content_en = 'The overview does not show prompts or responses, only metadata. It is not a configuration console; for adjustments use Tenants, Policies, and Settings. The information is aggregated and does not replace detailed auditing.',
  title_ca = 'Limitacions de la vista',
  content_ca = 'El overview no mostra prompts ni respostes, nomes metadades. No es una consola de configuracio; per a ajustos usa Tenants, Policies i Settings. La informacio es agregada, no reemplaça auditoria detallada.'
WHERE id = 'e3855d6d-f23c-4303-8816-d606d5aaaab6';

UPDATE documentation_entries
SET
  title_en = 'Privacy and retention',
  content_en = 'Prompts and full responses are not stored. Define retention policies if you export events outside the system. This helps compliance with regulations.',
  title_ca = 'Privacitat i retencio',
  content_ca = 'No es guarden prompts ni respostes completes. Defineix politiques de retencio si exportes esdeveniments fora del sistema. Aixo facilita compliment normatiu.'
WHERE id = 'e538dcda-f30f-4497-bbea-efb55c6880f6';

UPDATE documentation_entries
SET
  title_en = 'Tenant kill switch',
  content_en = 'The tenant kill switch blocks all executions for that tenant without affecting others. It is the recommended containment measure against abuse or unexpected cost. It can be reactivated when the risk passes.',
  title_ca = 'Kill switch per tenant',
  content_ca = 'El kill switch del tenant bloqueja totes les execucions per a aquest tenant sense afectar altres. Es la mesura de contencio recomanada davant abus o cost inesperat. Es pot reactivar quan el risc passi.'
WHERE id = 'e5cdf37a-6d4e-4fcf-a29f-26ab85abdffb';

UPDATE documentation_entries
SET
  title_en = 'Single endpoint',
  content_en = 'All calls go through /runtime/execute with applied guarantees.',
  title_ca = 'Endpoint unic',
  content_ca = 'Totes les crides passen per /runtime/execute amb garanties aplicades.'
WHERE id = 'eab731b4-43f1-462b-bf2e-d0c74177b6e2';

UPDATE documentation_entries
SET
  title_en = 'Information sources',
  content_en = 'Overview data comes from usage_events, audit_events, and pricing_models. Consumption is calculated per day and associated with the active tenant. Alerts depend on policy limits and the scheduler.',
  title_ca = 'Fonts de informacio',
  content_ca = 'Les dades del overview provenen de usage_events, audit_events i pricing_models. El consum es calcula per dia i s associa al tenant actiu. Les alertes depenen dels limits de politiques i del scheduler.'
WHERE id = 'ebbe8f66-e62b-4faf-8cf1-13954a8d813f';

UPDATE documentation_entries
SET
  title_en = 'Logs',
  content_en = 'Logs should include correlationId, tenantId, and providerId. Avoid logging full prompts. Use log levels and aggregate to a central system.',
  title_ca = 'Logs',
  content_ca = 'Els logs han incloure correlationId, tenantId i providerId. Evita registrar prompts complets. Usa nivells de log i agrega a un sistema central.'
WHERE id = 'f41544c5-12e7-4efc-95b8-34dba54c6caa';

UPDATE documentation_entries
SET
  title_en = 'Auditable metadata',
  content_en = 'Include tenantId, action, status, and contextual metadata. It is recommended not to include sensitive content in metadata. Use identifiers and references instead of full payloads.',
  title_ca = 'Metadades auditables',
  content_ca = 'Inclou tenantId, accio, estat i metadata contextual. Es recomana no incloure contingut sensible en metadata. Usa identificadors i referencies en lloc de payloads complets.'
WHERE id = 'fc6e798f-e010-405d-8178-2fdb4d33921f';

UPDATE documentation_entries
SET
  title_en = 'Purpose of the overview',
  content_en = 'The overview is the quick control view for operations. It brings together usage indicators, alerts, and recent activity without executing actions. Its goal is to enable quick decisions about limits, providers, and security.',
  title_ca = 'Proposit del overview',
  content_ca = 'El overview es la vista de control rapid per a operacions. Reuneix indicadors de us, alertes i activitat recent sense executar accions. El seu objectiu es permetre decisions rapids sobre limits, proveidors i seguretat.'
WHERE id = 'fc843ade-a35d-4a7b-ab4a-8495f13b8487';

COMMIT;
