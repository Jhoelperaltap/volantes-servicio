-- =====================================================
-- MIGRACIÓN DE DATOS EXISTENTES DE LOCATIONS
-- =====================================================
-- Este script migra los datos existentes de la tabla 'locations'
-- a la nueva estructura jerárquica
-- =====================================================

-- =====================================================
-- PASO 1: MIGRAR LOCATIONS A COMPANIES
-- =====================================================

-- Crear una empresa por cada location existente
-- (Asumiendo que cada location actual se convertirá en una empresa)
INSERT INTO companies (id, name, address, contact_person, contact_phone, contact_email, created_at, updated_at)
SELECT 
    id,
    name,
    address,
    contact_person,
    contact_phone,
    contact_email,
    created_at,
    updated_at
FROM locations
WHERE NOT EXISTS (SELECT 1 FROM companies WHERE companies.id = locations.id);

-- =====================================================
-- PASO 2: CREAR CLIENTE GENÉRICO PARA CADA EMPRESA
-- =====================================================

-- Para cada empresa (ex-location), crear un cliente genérico
INSERT INTO clients (company_id, name, description, contact_person, contact_phone, contact_email)
SELECT 
    c.id as company_id,
    'Cliente Principal' as name,
    'Cliente principal de ' || c.name as description,
    c.contact_person,
    c.contact_phone,
    c.contact_email
FROM companies c
WHERE NOT EXISTS (
    SELECT 1 FROM clients cl WHERE cl.company_id = c.id
);

-- =====================================================
-- PASO 3: CREAR LOCALIDAD PRINCIPAL PARA CADA CLIENTE
-- =====================================================

-- Para cada cliente, crear una localidad principal
INSERT INTO client_locations (client_id, name, address, contact_person, contact_phone, contact_email)
SELECT 
    cl.id as client_id,
    'Localidad Principal' as name,
    c.address,
    c.contact_person,
    c.contact_phone,
    c.contact_email
FROM companies c
JOIN clients cl ON c.id = cl.company_id
WHERE cl.name = 'Cliente Principal'
AND NOT EXISTS (
    SELECT 1 FROM client_locations loc WHERE loc.client_id = cl.id
);

-- =====================================================
-- PASO 4: CREAR EQUIPO GENÉRICO PARA CADA LOCALIDAD
-- =====================================================

-- Para cada localidad, crear un equipo genérico
INSERT INTO equipment (location_id, name, equipment_type, description)
SELECT 
    loc.id as location_id,
    'Equipo Principal' as name,
    'general' as equipment_type,
    'Equipo principal de la localidad'
FROM client_locations loc
WHERE NOT EXISTS (
    SELECT 1 FROM equipment eq WHERE eq.location_id = loc.id
);

-- =====================================================
-- PASO 5: ACTUALIZAR SERVICE_TICKETS
-- =====================================================

-- Agregar columna equipment_id a service_tickets si no existe
ALTER TABLE service_tickets 
ADD COLUMN IF NOT EXISTS equipment_id UUID REFERENCES equipment(id);

-- Actualizar los tickets existentes para que apunten al equipo correspondiente
UPDATE service_tickets st
SET equipment_id = eq.id
FROM equipment eq
JOIN client_locations loc ON eq.location_id = loc.id
JOIN clients cl ON loc.client_id = cl.id
JOIN companies c ON cl.company_id = c.id
WHERE st.location_id = c.id
AND st.equipment_id IS NULL;

-- =====================================================
-- PASO 6: CREAR ÍNDICES PARA LA NUEVA COLUMNA
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_service_tickets_equipment_id ON service_tickets(equipment_id);

-- =====================================================
-- PASO 7: VISTA DE COMPATIBILIDAD
-- =====================================================

-- Crear una vista que mantenga compatibilidad con el código existente
CREATE OR REPLACE VIEW locations_compatibility AS
SELECT 
    c.id,
    c.name,
    c.address,
    c.contact_person,
    c.contact_phone,
    c.contact_email,
    c.created_at,
    c.updated_at
FROM companies c;

-- =====================================================
-- PASO 8: FUNCIÓN PARA OBTENER JERARQUÍA COMPLETA
-- =====================================================

-- Función para obtener la jerarquía completa de un ticket
CREATE OR REPLACE FUNCTION get_ticket_hierarchy(ticket_id UUID)
RETURNS TABLE (
    company_name VARCHAR(255),
    client_name VARCHAR(255),
    location_name VARCHAR(255),
    equipment_name VARCHAR(255),
    full_path TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.name as company_name,
        cl.name as client_name,
        loc.name as location_name,
        eq.name as equipment_name,
        c.name || ' > ' || cl.name || ' > ' || loc.name || ' > ' || eq.name as full_path
    FROM service_tickets st
    JOIN equipment eq ON st.equipment_id = eq.id
    JOIN client_locations loc ON eq.location_id = loc.id
    JOIN clients cl ON loc.client_id = cl.id
    JOIN companies c ON cl.company_id = c.id
    WHERE st.id = ticket_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VERIFICACIÓN DE MIGRACIÓN
-- =====================================================

-- Mostrar resumen de la migración
DO $$
DECLARE
    companies_count INTEGER;
    clients_count INTEGER;
    locations_count INTEGER;
    equipment_count INTEGER;
    tickets_updated INTEGER;
BEGIN
    SELECT COUNT(*) INTO companies_count FROM companies;
    SELECT COUNT(*) INTO clients_count FROM clients;
    SELECT COUNT(*) INTO locations_count FROM client_locations;
    SELECT COUNT(*) INTO equipment_count FROM equipment;
    SELECT COUNT(*) INTO tickets_updated FROM service_tickets WHERE equipment_id IS NOT NULL;
    
    RAISE NOTICE 'MIGRACIÓN COMPLETADA:';
    RAISE NOTICE '- Empresas creadas: %', companies_count;
    RAISE NOTICE '- Clientes creados: %', clients_count;
    RAISE NOTICE '- Localidades creadas: %', locations_count;
    RAISE NOTICE '- Equipos creados: %', equipment_count;
    RAISE NOTICE '- Tickets actualizados: %', tickets_updated;
END $$;

-- =====================================================
-- COMENTARIOS FINALES
-- =====================================================

-- Esta migración:
-- 1. Convierte cada 'location' existente en una 'company'
-- 2. Crea un cliente genérico para cada empresa
-- 3. Crea una localidad principal para cada cliente
-- 4. Crea un equipo genérico para cada localidad
-- 5. Actualiza los service_tickets para referenciar el equipo
-- 6. Mantiene compatibilidad con código existente mediante vistas
-- 7. Proporciona funciones útiles para consultar la jerarquía

-- IMPORTANTE: 
-- - Los datos originales en 'locations' se mantienen intactos
-- - Se puede revertir la migración si es necesario
-- - La vista 'locations_compatibility' permite que el código existente siga funcionando
