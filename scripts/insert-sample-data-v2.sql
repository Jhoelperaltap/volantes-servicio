-- Script para insertar datos de prueba en las tablas existentes
-- Adaptado a la estructura actual de Supabase

-- Insertar ubicaciones de prueba
INSERT INTO locations (name, address, city, state, country) 
VALUES 
  ('Sede Central', 'Av. Principal 123', 'Ciudad de México', 'CDMX', 'México'),
  ('Sucursal Norte', 'Calle Norte 456', 'Monterrey', 'Nuevo León', 'México'),
  ('Sucursal Sur', 'Av. Sur 789', 'Guadalajara', 'Jalisco', 'México')
ON CONFLICT (name) DO NOTHING;

-- Insertar usuarios de prueba (sin password, usando solo campos básicos)
INSERT INTO users (name, email, role) 
VALUES 
  ('Juan Pérez', 'juan.perez@empresa.com', 'admin'),
  ('María García', 'maria.garcia@empresa.com', 'technician'),
  ('Carlos López', 'carlos.lopez@empresa.com', 'technician'),
  ('Ana Martínez', 'ana.martinez@empresa.com', 'user')
ON CONFLICT (email) DO NOTHING;

-- Insertar partes/repuestos de prueba
INSERT INTO parts (name, description, stock_quantity, unit_price) 
VALUES 
  ('Filtro de Aire', 'Filtro de aire estándar para equipos', 50, 25.00),
  ('Correa de Transmisión', 'Correa de transmisión industrial', 30, 45.00),
  ('Rodamiento', 'Rodamiento de bolas estándar', 100, 15.00),
  ('Aceite Lubricante', 'Aceite lubricante sintético 1L', 25, 35.00)
ON CONFLICT (name) DO NOTHING;

-- Insertar tickets de servicio de prueba
INSERT INTO service_tickets (
  title, 
  description, 
  status, 
  priority, 
  location_id, 
  assigned_technician_id,
  created_at,
  updated_at
) 
SELECT 
  'Mantenimiento Preventivo Equipo A',
  'Revisión y mantenimiento preventivo del equipo principal',
  'open',
  'medium',
  l.id,
  u.id,
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '1 day'
FROM locations l, users u 
WHERE l.name = 'Sede Central' 
  AND u.email = 'maria.garcia@empresa.com'
  AND NOT EXISTS (
    SELECT 1 FROM service_tickets 
    WHERE title = 'Mantenimiento Preventivo Equipo A'
  );

INSERT INTO service_tickets (
  title, 
  description, 
  status, 
  priority, 
  location_id, 
  assigned_technician_id,
  created_at,
  updated_at
) 
SELECT 
  'Reparación Urgente Motor B',
  'Motor presenta ruidos anómalos, requiere revisión inmediata',
  'in_progress',
  'high',
  l.id,
  u.id,
  NOW() - INTERVAL '1 day',
  NOW()
FROM locations l, users u 
WHERE l.name = 'Sucursal Norte' 
  AND u.email = 'carlos.lopez@empresa.com'
  AND NOT EXISTS (
    SELECT 1 FROM service_tickets 
    WHERE title = 'Reparación Urgente Motor B'
  );

-- Insertar notificaciones de prueba
INSERT INTO notifications (
  user_id,
  title,
  message,
  type,
  is_read,
  created_at
)
SELECT 
  u.id,
  'Nuevo ticket asignado',
  'Se te ha asignado un nuevo ticket de servicio',
  'assignment',
  false,
  NOW() - INTERVAL '1 hour'
FROM users u 
WHERE u.email = 'maria.garcia@empresa.com'
  AND NOT EXISTS (
    SELECT 1 FROM notifications 
    WHERE user_id = u.id AND title = 'Nuevo ticket asignado'
  );

INSERT INTO notifications (
  user_id,
  title,
  message,
  type,
  is_read,
  created_at
)
SELECT 
  u.id,
  'Ticket completado',
  'El ticket de mantenimiento ha sido completado exitosamente',
  'completion',
  true,
  NOW() - INTERVAL '3 hours'
FROM users u 
WHERE u.email = 'juan.perez@empresa.com'
  AND NOT EXISTS (
    SELECT 1 FROM notifications 
    WHERE user_id = u.id AND title = 'Ticket completado'
  );

-- Verificar que los datos se insertaron correctamente
SELECT 'Locations' as table_name, COUNT(*) as count FROM locations
UNION ALL
SELECT 'Users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'Parts' as table_name, COUNT(*) as count FROM parts
UNION ALL
SELECT 'Service Tickets' as table_name, COUNT(*) as count FROM service_tickets
UNION ALL
SELECT 'Notifications' as table_name, COUNT(*) as count FROM notifications;
