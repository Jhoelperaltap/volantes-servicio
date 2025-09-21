-- Verificar y ajustar estructura de tablas existentes
-- Agregar columnas faltantes si no existen

-- Agregar columna password a users si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'password') THEN
        ALTER TABLE users ADD COLUMN password VARCHAR(255);
    END IF;
END $$;

-- Agregar columnas faltantes a locations si no existen
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'locations' AND column_name = 'address') THEN
        ALTER TABLE locations ADD COLUMN address TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'locations' AND column_name = 'phone') THEN
        ALTER TABLE locations ADD COLUMN phone VARCHAR(20);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'locations' AND column_name = 'created_at') THEN
        ALTER TABLE locations ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- Agregar columnas faltantes a service_tickets si no existen
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'service_tickets' AND column_name = 'priority') THEN
        ALTER TABLE service_tickets ADD COLUMN priority VARCHAR(10) DEFAULT 'medium';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'service_tickets' AND column_name = 'estimated_hours') THEN
        ALTER TABLE service_tickets ADD COLUMN estimated_hours INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'service_tickets' AND column_name = 'actual_hours') THEN
        ALTER TABLE service_tickets ADD COLUMN actual_hours INTEGER;
    END IF;
END $$;

-- Agregar columnas faltantes a parts si no existen
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'parts' AND column_name = 'price') THEN
        ALTER TABLE parts ADD COLUMN price DECIMAL(10,2);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'parts' AND column_name = 'supplier') THEN
        ALTER TABLE parts ADD COLUMN supplier VARCHAR(100);
    END IF;
END $$;

-- Insertar datos de prueba solo después de asegurar que las columnas existen
INSERT INTO users (name, email, password, role) VALUES
('Juan Pérez', 'juan@empresa.com', 'password123', 'admin'),
('María García', 'maria@empresa.com', 'password123', 'technician'),
('Carlos López', 'carlos@empresa.com', 'password123', 'technician'),
('Ana Martínez', 'ana@empresa.com', 'password123', 'user'),
('Luis Rodríguez', 'luis@empresa.com', 'password123', 'user')
ON CONFLICT (email) DO NOTHING;

INSERT INTO locations (name, address, phone) VALUES
('Oficina Central', 'Av. Principal 123, Ciudad', '+1234567890'),
('Sucursal Norte', 'Calle Norte 456, Ciudad', '+1234567891'),
('Sucursal Sur', 'Av. Sur 789, Ciudad', '+1234567892'),
('Centro Comercial', 'Plaza Central 321, Ciudad', '+1234567893'),
('Almacén Principal', 'Zona Industrial 654, Ciudad', '+1234567894')
ON CONFLICT (name) DO NOTHING;

INSERT INTO parts (name, description, stock_quantity, price, supplier) VALUES
('Filtro de Aire', 'Filtro de aire para equipos HVAC', 50, 25.99, 'Proveedor A'),
('Correa de Transmisión', 'Correa para motores industriales', 30, 45.50, 'Proveedor B'),
('Sensor de Temperatura', 'Sensor digital de temperatura', 25, 89.99, 'Proveedor C'),
('Válvula de Control', 'Válvula de control automático', 15, 125.00, 'Proveedor A'),
('Motor Eléctrico', 'Motor eléctrico 1HP', 10, 299.99, 'Proveedor D')
ON CONFLICT (name) DO NOTHING;

-- Obtener IDs para las relaciones
DO $$
DECLARE
    user_id_1 INTEGER;
    user_id_2 INTEGER;
    location_id_1 INTEGER;
    location_id_2 INTEGER;
    part_id_1 INTEGER;
BEGIN
    -- Obtener algunos IDs de usuarios y ubicaciones
    SELECT id INTO user_id_1 FROM users WHERE email = 'juan@empresa.com' LIMIT 1;
    SELECT id INTO user_id_2 FROM users WHERE email = 'maria@empresa.com' LIMIT 1;
    SELECT id INTO location_id_1 FROM locations WHERE name = 'Oficina Central' LIMIT 1;
    SELECT id INTO location_id_2 FROM locations WHERE name = 'Sucursal Norte' LIMIT 1;
    SELECT id INTO part_id_1 FROM parts WHERE name = 'Filtro de Aire' LIMIT 1;

    -- Insertar tickets de servicio
    INSERT INTO service_tickets (title, description, status, priority, user_id, location_id, estimated_hours, actual_hours) VALUES
    ('Mantenimiento HVAC', 'Revisión y limpieza del sistema HVAC', 'open', 'high', user_id_1, location_id_1, 4, NULL),
    ('Reparación Motor', 'Motor presenta ruidos extraños', 'in_progress', 'medium', user_id_2, location_id_2, 6, 3),
    ('Instalación Sensor', 'Instalar nuevo sensor de temperatura', 'completed', 'low', user_id_1, location_id_1, 2, 2),
    ('Cambio de Filtros', 'Reemplazo de filtros de aire', 'open', 'medium', user_id_2, location_id_2, 1, NULL),
    ('Calibración Equipos', 'Calibración de equipos de medición', 'in_progress', 'high', user_id_1, location_id_1, 8, 4)
    ON CONFLICT DO NOTHING;

    -- Insertar notificaciones
    INSERT INTO notifications (user_id, title, message, type, read) VALUES
    (user_id_1, 'Nuevo Ticket Asignado', 'Se te ha asignado un nuevo ticket de mantenimiento', 'info', false),
    (user_id_2, 'Ticket Completado', 'El ticket #123 ha sido marcado como completado', 'success', false),
    (user_id_1, 'Mantenimiento Programado', 'Recordatorio: mantenimiento programado para mañana', 'warning', true),
    (user_id_2, 'Inventario Bajo', 'El stock de filtros está por debajo del mínimo', 'error', false),
    (user_id_1, 'Reporte Mensual', 'El reporte mensual está disponible para descarga', 'info', true)
    ON CONFLICT DO NOTHING;
END $$;

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
