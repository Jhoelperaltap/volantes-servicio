-- Corregir estructura de usuarios y agregar datos con password_hash
DO $$
BEGIN
    -- Hacer password_hash nullable temporalmente para insertar datos de prueba
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'password_hash' AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
    END IF;
END $$;

-- Limpiar datos existentes para evitar conflictos
DELETE FROM notifications;
DELETE FROM service_tickets;
DELETE FROM users WHERE email LIKE '%@empresa.com' OR email LIKE '%@tecnico.com';
DELETE FROM locations WHERE name LIKE 'Sucursal%' OR name LIKE 'Oficina%';
DELETE FROM parts WHERE name LIKE 'Filtro%' OR name LIKE 'Correa%';

-- Insertar ubicaciones
INSERT INTO locations (name, address, phone) VALUES
('Sucursal Centro', 'Av. Principal 123, Centro', '+1234567890'),
('Sucursal Norte', 'Calle Norte 456, Zona Norte', '+1234567891'),
('Oficina Sur', 'Av. Sur 789, Zona Sur', '+1234567892'),
('Sucursal Este', 'Blvd. Este 321, Zona Este', '+1234567893'),
('Oficina Oeste', 'Calle Oeste 654, Zona Oeste', '+1234567894')
ON CONFLICT (name) DO NOTHING;

-- Insertar usuarios con password_hash usando MD5 simple para pruebas
INSERT INTO users (name, email, password_hash, role) VALUES
('Juan Pérez', 'juan@empresa.com', MD5('password123'), 'admin'),
('María García', 'maria@empresa.com', MD5('password123'), 'admin'),
('Carlos López', 'carlos@tecnico.com', MD5('password123'), 'technician'),
('Ana Martínez', 'ana@tecnico.com', MD5('password123'), 'technician'),
('Luis Rodríguez', 'luis@tecnico.com', MD5('password123'), 'technician'),
('Sofia Hernández', 'sofia@empresa.com', MD5('password123'), 'user'),
('Diego Torres', 'diego@empresa.com', MD5('password123'), 'user')
ON CONFLICT (email) DO NOTHING;

-- Insertar partes
INSERT INTO parts (name, description, price, stock_quantity) VALUES
('Filtro de Aire', 'Filtro de aire estándar para equipos', 25.99, 50),
('Correa de Transmisión', 'Correa de transmisión industrial', 45.50, 30),
('Rodamiento 6205', 'Rodamiento de bolas 6205', 15.75, 100),
('Aceite Hidráulico', 'Aceite hidráulico ISO 46', 89.99, 25),
('Válvula de Presión', 'Válvula reguladora de presión', 125.00, 15),
('Sensor de Temperatura', 'Sensor de temperatura digital', 65.25, 40),
('Motor Eléctrico 1HP', 'Motor eléctrico monofásico 1HP', 299.99, 8),
('Fusible 20A', 'Fusible de protección 20 amperios', 5.99, 200)
ON CONFLICT (name) DO NOTHING;

-- Insertar tickets de servicio
INSERT INTO service_tickets (
    title, description, status, priority, location_id, assigned_technician_id, created_by_id
) 
SELECT 
    'Mantenimiento Preventivo Equipo A',
    'Realizar mantenimiento preventivo completo del equipo A incluyendo cambio de filtros y lubricación',
    'open',
    'medium',
    l.id,
    t.id,
    u.id
FROM locations l, users t, users u
WHERE l.name = 'Sucursal Centro' 
  AND t.email = 'carlos@tecnico.com'
  AND u.email = 'juan@empresa.com'
LIMIT 1;

INSERT INTO service_tickets (
    title, description, status, priority, location_id, assigned_technician_id, created_by_id
) 
SELECT 
    'Reparación Urgente Motor',
    'Motor principal presenta ruidos anómalos y vibración excesiva. Requiere inspección inmediata',
    'in_progress',
    'high',
    l.id,
    t.id,
    u.id
FROM locations l, users t, users u
WHERE l.name = 'Sucursal Norte' 
  AND t.email = 'ana@tecnico.com'
  AND u.email = 'maria@empresa.com'
LIMIT 1;

INSERT INTO service_tickets (
    title, description, status, priority, location_id, assigned_technician_id, created_by_id
) 
SELECT 
    'Instalación Nuevo Sensor',
    'Instalar sensor de temperatura en línea de producción 2',
    'completed',
    'low',
    l.id,
    t.id,
    u.id
FROM locations l, users t, users u
WHERE l.name = 'Oficina Sur' 
  AND t.email = 'luis@tecnico.com'
  AND u.email = 'sofia@empresa.com'
LIMIT 1;

-- Insertar notificaciones
INSERT INTO notifications (
    user_id, title, message, type, is_read
)
SELECT 
    u.id,
    'Nuevo ticket asignado',
    'Se te ha asignado un nuevo ticket de mantenimiento preventivo',
    'assignment',
    false
FROM users u
WHERE u.email = 'carlos@tecnico.com';

INSERT INTO notifications (
    user_id, title, message, type, is_read
)
SELECT 
    u.id,
    'Ticket completado',
    'El ticket de instalación de sensor ha sido completado exitosamente',
    'completion',
    true
FROM users u
WHERE u.email = 'juan@empresa.com';

INSERT INTO notifications (
    user_id, title, message, type, is_read
)
SELECT 
    u.id,
    'Mantenimiento programado',
    'Recordatorio: mantenimiento programado para mañana a las 9:00 AM',
    'reminder',
    false
FROM users u
WHERE u.role = 'technician';

-- Mostrar resumen de datos insertados
SELECT 'users' as tabla, COUNT(*) as registros FROM users
UNION ALL
SELECT 'locations' as tabla, COUNT(*) as registros FROM locations
UNION ALL
SELECT 'parts' as tabla, COUNT(*) as registros FROM parts
UNION ALL
SELECT 'service_tickets' as tabla, COUNT(*) as registros FROM service_tickets
UNION ALL
SELECT 'notifications' as tabla, COUNT(*) as registros FROM notifications;

-- Mostrar algunos datos de ejemplo
SELECT 'Usuarios creados:' as info;
SELECT name, email, role FROM users WHERE email LIKE '%@empresa.com' OR email LIKE '%@tecnico.com';

SELECT 'Tickets creados:' as info;
SELECT t.title, t.status, t.priority, l.name as location, u.name as technician
FROM service_tickets t
JOIN locations l ON t.location_id = l.id
JOIN users u ON t.assigned_technician_id = u.id;
