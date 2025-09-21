-- Script para configurar base de datos PostgreSQL local
-- Crear tablas si no existen y poblar con datos de prueba

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'technician',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de ubicaciones
CREATE TABLE IF NOT EXISTS locations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de partes/repuestos
CREATE TABLE IF NOT EXISTS parts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    part_number VARCHAR(100) UNIQUE,
    description TEXT,
    price DECIMAL(10,2),
    stock_quantity INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de tickets de servicio
CREATE TABLE IF NOT EXISTS service_tickets (
    id SERIAL PRIMARY KEY,
    ticket_number VARCHAR(50) UNIQUE NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255),
    customer_phone VARCHAR(20),
    location_id INTEGER REFERENCES locations(id),
    assigned_technician_id INTEGER REFERENCES users(id),
    equipment_type VARCHAR(100),
    issue_description TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    priority VARCHAR(20) DEFAULT 'medium',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- Tabla de notificaciones
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    message TEXT,
    type VARCHAR(50) DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar datos de prueba
INSERT INTO users (name, email, password, role) VALUES
('Juan Pérez', 'juan@empresa.com', '$2b$10$hashedpassword1', 'admin'),
('María García', 'maria@empresa.com', '$2b$10$hashedpassword2', 'technician'),
('Carlos López', 'carlos@empresa.com', '$2b$10$hashedpassword3', 'technician'),
('Ana Martínez', 'ana@empresa.com', '$2b$10$hashedpassword4', 'supervisor')
ON CONFLICT (email) DO NOTHING;

INSERT INTO locations (name, address, city, state) VALUES
('Oficina Central', 'Av. Principal 123', 'Ciudad de México', 'CDMX'),
('Sucursal Norte', 'Calle Norte 456', 'Monterrey', 'Nuevo León'),
('Sucursal Sur', 'Av. Sur 789', 'Guadalajara', 'Jalisco'),
('Centro de Distribución', 'Industrial 321', 'Puebla', 'Puebla')
ON CONFLICT DO NOTHING;

INSERT INTO parts (name, part_number, description, price, stock_quantity) VALUES
('Filtro de Aire', 'FA-001', 'Filtro de aire estándar', 25.50, 50),
('Correa de Transmisión', 'CT-002', 'Correa de transmisión reforzada', 45.00, 30),
('Motor Eléctrico', 'ME-003', 'Motor eléctrico 1HP', 350.00, 10),
('Sensor de Temperatura', 'ST-004', 'Sensor digital de temperatura', 75.00, 25)
ON CONFLICT (part_number) DO NOTHING;

INSERT INTO service_tickets (ticket_number, customer_name, customer_email, customer_phone, location_id, assigned_technician_id, equipment_type, issue_description, status, priority) VALUES
('ST-2024-001', 'Empresa ABC', 'contacto@abc.com', '555-0001', 1, 2, 'Aire Acondicionado', 'No enfría correctamente', 'in_progress', 'high'),
('ST-2024-002', 'Corporativo XYZ', 'soporte@xyz.com', '555-0002', 2, 3, 'Sistema de Ventilación', 'Ruido excesivo en motor', 'pending', 'medium'),
('ST-2024-003', 'Hotel Premium', 'mantenimiento@hotel.com', '555-0003', 1, 2, 'Calefacción', 'No enciende', 'completed', 'high'),
('ST-2024-004', 'Oficinas del Centro', 'admin@oficinas.com', '555-0004', 3, 3, 'Aire Acondicionado', 'Mantenimiento preventivo', 'pending', 'low')
ON CONFLICT (ticket_number) DO NOTHING;

INSERT INTO notifications (user_id, title, message, type) VALUES
(1, 'Nuevo ticket asignado', 'Se ha asignado el ticket ST-2024-001', 'info'),
(2, 'Ticket completado', 'Has completado el ticket ST-2024-003', 'success'),
(3, 'Recordatorio de mantenimiento', 'Tienes un mantenimiento programado para mañana', 'warning'),
(1, 'Reporte mensual disponible', 'El reporte de este mes está listo para revisar', 'info')
ON CONFLICT DO NOTHING;

-- Mostrar conteo de registros
SELECT 'users' as tabla, COUNT(*) as registros FROM users
UNION ALL
SELECT 'locations' as tabla, COUNT(*) as registros FROM locations
UNION ALL
SELECT 'parts' as tabla, COUNT(*) as registros FROM parts
UNION ALL
SELECT 'service_tickets' as tabla, COUNT(*) as registros FROM service_tickets
UNION ALL
SELECT 'notifications' as tabla, COUNT(*) as registros FROM notifications;
