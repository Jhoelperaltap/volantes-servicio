-- Script para verificar y crear las tablas necesarias si no existen

-- Verificar si existen las tablas principales
SELECT 
  table_name,
  CASE 
    WHEN table_name IS NOT NULL THEN 'EXISTS'
    ELSE 'MISSING'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('users', 'locations', 'service_tickets', 'notifications', 'parts')
ORDER BY table_name;

-- Crear tabla users si no existe
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('tecnico', 'admin', 'super_admin')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla locations si no existe
CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  address TEXT,
  contact_person VARCHAR(255),
  phone VARCHAR(50),
  email VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla service_tickets si no existe
CREATE TABLE IF NOT EXISTS service_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number SERIAL UNIQUE,
  location_id UUID REFERENCES locations(id),
  technician_id UUID REFERENCES users(id),
  service_type VARCHAR(100) NOT NULL CHECK (service_type IN ('mantenimiento', 'reparacion', 'instalacion', 'cambio_repuesto')),
  description TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'en_progreso', 'completado', 'escalado')),
  priority VARCHAR(20) DEFAULT 'media' CHECK (priority IN ('baja', 'media', 'alta', 'critica')),
  scheduled_date DATE,
  completed_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla notifications si no existe
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES service_tickets(id),
  sent_to UUID REFERENCES users(id),
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('reminder', 'escalation', 'overdue', 'completion')),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla parts si no existe
CREATE TABLE IF NOT EXISTS parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  part_number VARCHAR(100) UNIQUE,
  category VARCHAR(100),
  stock_quantity INTEGER DEFAULT 0,
  min_stock_level INTEGER DEFAULT 0,
  unit_price DECIMAL(10,2),
  supplier VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insertar datos de ejemplo si las tablas están vacías
INSERT INTO users (name, email, password, role) 
SELECT 'Admin Sistema', 'admin@sistema.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm', 'super_admin'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@sistema.com');

INSERT INTO locations (name, address, contact_person, phone, email)
SELECT 'Oficina Central', 'Av. Principal 123', 'Juan Pérez', '+1234567890', 'oficina@empresa.com'
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Oficina Central');

INSERT INTO locations (name, address, contact_person, phone, email)
SELECT 'Sucursal Norte', 'Calle Norte 456', 'María García', '+1234567891', 'norte@empresa.com'
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Sucursal Norte');

INSERT INTO locations (name, address, contact_person, phone, email)
SELECT 'Sucursal Sur', 'Av. Sur 789', 'Carlos López', '+1234567892', 'sur@empresa.com'
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Sucursal Sur');

-- Verificar conteos finales
SELECT 
  'users' as tabla, COUNT(*) as registros FROM users
UNION ALL
SELECT 
  'locations' as tabla, COUNT(*) as registros FROM locations
UNION ALL
SELECT 
  'service_tickets' as tabla, COUNT(*) as registros FROM service_tickets
UNION ALL
SELECT 
  'notifications' as tabla, COUNT(*) as registros FROM notifications
UNION ALL
SELECT 
  'parts' as tabla, COUNT(*) as registros FROM parts;
