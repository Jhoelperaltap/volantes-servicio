-- =====================================================
-- NUEVA ESTRUCTURA JERÁRQUICA: EMPRESA > CLIENTE > LOCALIDAD > EQUIPO
-- =====================================================
-- Este script crea la nueva estructura jerárquica para reemplazar
-- la tabla simple de locations
-- =====================================================

-- Crear extensiones necesarias (por si acaso)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLA DE EMPRESAS (lo que antes eran "localidades")
-- =====================================================
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    address TEXT,
    contact_person VARCHAR(255),
    contact_phone VARCHAR(50),
    contact_email VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABLA DE CLIENTES (pertenecen a una empresa)
-- =====================================================
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    contact_person VARCHAR(255),
    contact_phone VARCHAR(50),
    contact_email VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABLA DE LOCALIDADES (pertenecen a un cliente)
-- =====================================================
CREATE TABLE IF NOT EXISTS client_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'República Dominicana',
    contact_person VARCHAR(255),
    contact_phone VARCHAR(50),
    contact_email VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABLA DE EQUIPOS (pertenecen a una localidad)
-- =====================================================
CREATE TABLE IF NOT EXISTS equipment (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_id UUID NOT NULL REFERENCES client_locations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    model VARCHAR(255),
    serial_number VARCHAR(255),
    brand VARCHAR(255),
    equipment_type VARCHAR(100), -- 'aire_acondicionado', 'refrigerador', 'lavadora', etc.
    description TEXT,
    installation_date DATE,
    warranty_expiry DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

-- Índices para companies
CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name);
CREATE INDEX IF NOT EXISTS idx_companies_is_active ON companies(is_active);

-- Índices para clients
CREATE INDEX IF NOT EXISTS idx_clients_company_id ON clients(company_id);
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);
CREATE INDEX IF NOT EXISTS idx_clients_is_active ON clients(is_active);

-- Índices para client_locations
CREATE INDEX IF NOT EXISTS idx_client_locations_client_id ON client_locations(client_id);
CREATE INDEX IF NOT EXISTS idx_client_locations_name ON client_locations(name);
CREATE INDEX IF NOT EXISTS idx_client_locations_is_active ON client_locations(is_active);
CREATE INDEX IF NOT EXISTS idx_client_locations_city ON client_locations(city);

-- Índices para equipment
CREATE INDEX IF NOT EXISTS idx_equipment_location_id ON equipment(location_id);
CREATE INDEX IF NOT EXISTS idx_equipment_name ON equipment(name);
CREATE INDEX IF NOT EXISTS idx_equipment_serial_number ON equipment(serial_number);
CREATE INDEX IF NOT EXISTS idx_equipment_type ON equipment(equipment_type);
CREATE INDEX IF NOT EXISTS idx_equipment_is_active ON equipment(is_active);

-- =====================================================
-- TRIGGERS PARA UPDATED_AT
-- =====================================================

-- Triggers para actualizar updated_at automáticamente
DROP TRIGGER IF EXISTS update_companies_updated_at ON companies;
CREATE TRIGGER update_companies_updated_at 
    BEFORE UPDATE ON companies 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
CREATE TRIGGER update_clients_updated_at 
    BEFORE UPDATE ON clients 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_client_locations_updated_at ON client_locations;
CREATE TRIGGER update_client_locations_updated_at 
    BEFORE UPDATE ON client_locations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_equipment_updated_at ON equipment;
CREATE TRIGGER update_equipment_updated_at 
    BEFORE UPDATE ON equipment 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- VISTAS ÚTILES PARA CONSULTAS
-- =====================================================

-- Vista completa de la jerarquía
CREATE OR REPLACE VIEW hierarchy_view AS
SELECT 
    c.id as company_id,
    c.name as company_name,
    cl.id as client_id,
    cl.name as client_name,
    loc.id as location_id,
    loc.name as location_name,
    loc.address as location_address,
    loc.city as location_city,
    eq.id as equipment_id,
    eq.name as equipment_name,
    eq.model as equipment_model,
    eq.serial_number as equipment_serial,
    eq.equipment_type,
    c.is_active as company_active,
    cl.is_active as client_active,
    loc.is_active as location_active,
    eq.is_active as equipment_active
FROM companies c
LEFT JOIN clients cl ON c.id = cl.company_id
LEFT JOIN client_locations loc ON cl.id = loc.client_id
LEFT JOIN equipment eq ON loc.id = eq.location_id
ORDER BY c.name, cl.name, loc.name, eq.name;

-- Vista para selección en cascada
CREATE OR REPLACE VIEW cascade_selection_view AS
SELECT 
    c.id as company_id,
    c.name as company_name,
    cl.id as client_id,
    cl.name as client_name,
    loc.id as location_id,
    loc.name as location_name,
    COUNT(eq.id) as equipment_count
FROM companies c
LEFT JOIN clients cl ON c.id = cl.company_id AND cl.is_active = true
LEFT JOIN client_locations loc ON cl.id = loc.client_id AND loc.is_active = true
LEFT JOIN equipment eq ON loc.id = eq.location_id AND eq.is_active = true
WHERE c.is_active = true
GROUP BY c.id, c.name, cl.id, cl.name, loc.id, loc.name
ORDER BY c.name, cl.name, loc.name;

-- =====================================================
-- DATOS DE EJEMPLO
-- =====================================================

-- Insertar empresa de ejemplo (Banreservas)
INSERT INTO companies (name, description, contact_person, contact_phone, contact_email) 
VALUES (
    'Banreservas',
    'Banco de Reservas de la República Dominicana',
    'Juan Pérez',
    '+1-809-555-0100',
    'contacto@banreservas.com'
) ON CONFLICT DO NOTHING;

-- Obtener el ID de Banreservas para los siguientes inserts
DO $$
DECLARE
    banreservas_id UUID;
    leche_rica_id UUID;
    loc1_id UUID;
    loc2_id UUID;
BEGIN
    -- Obtener ID de Banreservas
    SELECT id INTO banreservas_id FROM companies WHERE name = 'Banreservas' LIMIT 1;
    
    IF banreservas_id IS NOT NULL THEN
        -- Insertar cliente Leche Rica
        INSERT INTO clients (company_id, name, description, contact_person, contact_phone) 
        VALUES (
            banreservas_id,
            'Leche Rica',
            'Empresa láctea cliente de Banreservas',
            'María González',
            '+1-809-555-0200'
        ) ON CONFLICT DO NOTHING;
        
        -- Obtener ID de Leche Rica
        SELECT id INTO leche_rica_id FROM clients WHERE name = 'Leche Rica' AND company_id = banreservas_id LIMIT 1;
        
        IF leche_rica_id IS NOT NULL THEN
            -- Insertar Localidad 1
            INSERT INTO client_locations (client_id, name, address, city, contact_person, contact_phone) 
            VALUES (
                leche_rica_id,
                'Planta Principal',
                'Av. 27 de Febrero #123, Santo Domingo',
                'Santo Domingo',
                'Carlos Rodríguez',
                '+1-809-555-0301'
            ) ON CONFLICT DO NOTHING;
            
            -- Insertar Localidad 2
            INSERT INTO client_locations (client_id, name, address, city, contact_person, contact_phone) 
            VALUES (
                leche_rica_id,
                'Sucursal Santiago',
                'Calle del Sol #456, Santiago',
                'Santiago',
                'Ana Martínez',
                '+1-809-555-0302'
            ) ON CONFLICT DO NOTHING;
            
            -- Obtener IDs de las localidades para insertar equipos
            SELECT id INTO loc1_id FROM client_locations WHERE name = 'Planta Principal' AND client_id = leche_rica_id LIMIT 1;
            SELECT id INTO loc2_id FROM client_locations WHERE name = 'Sucursal Santiago' AND client_id = leche_rica_id LIMIT 1;
            
            -- Equipos para Localidad 1 (Planta Principal)
            IF loc1_id IS NOT NULL THEN
                INSERT INTO equipment (location_id, name, model, serial_number, brand, equipment_type) VALUES
                (loc1_id, 'Equipo 1', 'AC-2000', 'SN001', 'LG', 'aire_acondicionado'),
                (loc1_id, 'Equipo 2', 'REF-500', 'SN002', 'Samsung', 'refrigerador');
            END IF;
            
            -- Equipos para Localidad 2 (Sucursal Santiago)
            IF loc2_id IS NOT NULL THEN
                INSERT INTO equipment (location_id, name, model, serial_number, brand, equipment_type) VALUES
                (loc2_id, 'Equipo 1', 'AC-1500', 'SN003', 'LG', 'aire_acondicionado'),
                (loc2_id, 'Equipo 2', 'AC-1800', 'SN004', 'Carrier', 'aire_acondicionado'),
                (loc2_id, 'Equipo 3', 'LAV-300', 'SN005', 'Whirlpool', 'lavadora');
            END IF;
        END IF;
    END IF;
END $$;

-- =====================================================
-- COMENTARIOS FINALES
-- =====================================================

-- Esta nueva estructura permite:
-- 1. Jerarquía completa: Empresa > Cliente > Localidad > Equipo
-- 2. Múltiples clientes por empresa
-- 3. Múltiples localidades por cliente
-- 4. Múltiples equipos por localidad
-- 5. Información detallada de contacto en cada nivel
-- 6. Estados activo/inactivo para cada nivel
-- 7. Vistas optimizadas para consultas y selección en cascada

-- Próximos pasos:
-- 1. Migrar datos existentes de la tabla 'locations'
-- 2. Actualizar la tabla 'service_tickets' para referenciar equipment_id
-- 3. Crear interfaces de administración para cada nivel
-- 4. Implementar selección en cascada en formularios
