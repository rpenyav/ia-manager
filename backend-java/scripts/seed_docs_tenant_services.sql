-- Documentación específica para la página de detalle del servicio (tenant-services)

INSERT INTO documentation_entries (
  id,
  menuSlug,
  category,
  title,
  content,
  link,
  orderIndex,
  enabled,
  createdAt,
  updatedAt
)
VALUES
(
  UUID(),
  'tenant-services',
  'configuracion',
  'Prompt global del servicio',
  'Define el comportamiento base del asistente: tono, reglas y contexto. Mantén instrucciones claras y evita incluir datos sensibles o credenciales.',
  NULL,
  1,
  true,
  NOW(),
  NOW()
),
(
  UUID(),
  'tenant-services',
  'endpoints',
  'Endpoints obligatorios',
  'Si el servicio tiene endpoints habilitados, es obligatorio crear al menos un endpoint. Define método, path y (opcionalmente) base URL y headers.',
  NULL,
  1,
  true,
  NOW(),
  NOW()
),
(
  UUID(),
  'tenant-services',
  'usuarios',
  'Usuarios asignados al servicio',
  'Aquí se vinculan los usuarios de chat que podrán usar este servicio. Asigna usuarios existentes y gestiona su estado desde esta sección.',
  NULL,
  1,
  true,
  NOW(),
  NOW()
),
(
  UUID(),
  'tenant-services',
  'runtime',
  'Prueba runtime del servicio',
  'Ejecuta una prueba manual usando el provider/modelo configurado. Requiere API key activa del tenant.',
  NULL,
  1,
  true,
  NOW(),
  NOW()
);
