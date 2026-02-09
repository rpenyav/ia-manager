export const DOCS_DEFAULTS = [
  {
    menuSlug: 'overview',
    category: 'intro',
    title: 'Qué muestra el overview',
    content: 'Resumen rápido de consumo, alertas y proveedores activos.',
    link: null,
    orderIndex: 1
  },
  {
    menuSlug: 'tenants',
    category: 'gestión',
    title: 'Crear y operar tenants',
    content: 'Cada tenant representa un cliente con políticas y límites propios.',
    link: null,
    orderIndex: 1
  },
  {
    menuSlug: 'providers',
    category: 'config',
    title: 'Registro de proveedores',
    content: 'Configura credenciales cifradas y habilita/deshabilita proveedores.',
    link: null,
    orderIndex: 1
  },
  {
    menuSlug: 'policies',
    category: 'límites',
    title: 'Políticas de consumo',
    content: 'Define RPM, tokens diarios y coste máximo para cada tenant.',
    link: null,
    orderIndex: 1
  },
  {
    menuSlug: 'runtime',
    category: 'ejecución',
    title: 'Endpoint único',
    content: 'Todas las llamadas pasan por /runtime/execute con garantías aplicadas.',
    link: null,
    orderIndex: 1
  },
  {
    menuSlug: 'usage',
    category: 'alertas',
    title: 'Monitoreo de uso',
    content: 'Consulta consumo y dispara alertas según políticas.',
    link: null,
    orderIndex: 1
  },
  {
    menuSlug: 'audit',
    category: 'traza',
    title: 'Auditoría',
    content: 'Registro de eventos sin almacenar prompts completos.',
    link: null,
    orderIndex: 1
  },
  {
    menuSlug: 'pricing',
    category: 'costeo',
    title: 'Pricing por modelo',
    content: 'Define costes por 1k tokens para cada proveedor y modelo.',
    link: null,
    orderIndex: 1
  },
  {
    menuSlug: 'webhooks',
    category: 'export',
    title: 'Webhooks',
    content: 'Envía eventos a tus sistemas para auditoría externa.',
    link: null,
    orderIndex: 1
  },
  {
    menuSlug: 'notifications',
    category: 'alertas',
    title: 'Canales de notificación',
    content: 'Configura email o Slack para alertas de consumo.',
    link: null,
    orderIndex: 1
  },
  {
    menuSlug: 'settings',
    category: 'config',
    title: 'Ajustes globales',
    content: 'Gestiona kill switch global y cron de alertas.',
    link: null,
    orderIndex: 1
  },
  {
    menuSlug: 'observability',
    category: 'monitoring',
    title: 'Observabilidad',
    content: 'Métricas y trazas para operación del manager.',
    link: null,
    orderIndex: 1
  },
  {
    menuSlug: 'documentation',
    category: 'gestión',
    title: 'Documentación interna',
    content: 'Crea y organiza entradas por menú, categoría y orden.',
    link: null,
    orderIndex: 1
  }
];
