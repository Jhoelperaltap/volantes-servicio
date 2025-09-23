-- =====================================================
-- MIGRACIÓN CORREGIDA PARA SERVICE_TICKETS
-- =====================================================
-- Corrige las referencias de ubicaciones en service_tickets
-- para usar la nueva estructura jerárquica
-- =====================================================

-- Verificar si la columna location_id ya referencia client_locations
DO $$
BEGIN
    -- Eliminar la restricción antigua si existe (referencia a locations)
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'service_tickets_location_id_fkey' 
        AND table_name = 'service_tickets'
    ) THEN
        ALTER TABLE service_tickets DROP CONSTRAINT service_tickets_location_id_fkey;
        RAISE NOTICE 'Restricción antigua service_tickets_location_id_fkey eliminada';
    END IF;
    
    -- Agregar nueva restricción que referencia client_locations
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'service_tickets_location_id_client_locations_fkey' 
        AND table_name = 'service_tickets'
    ) THEN
        ALTER TABLE service_tickets 
        ADD CONSTRAINT service_tickets_location_id_client_locations_fkey 
        FOREIGN KEY (location_id) REFERENCES client_locations(id) ON DELETE CASCADE;
        RAISE NOTICE 'Nueva restricción service_tickets_location_id_client_locations_fkey creada';
    END IF;
    
    -- Agregar columna client_id si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'service_tickets' AND column_name = 'client_id'
    ) THEN
        ALTER TABLE service_tickets ADD COLUMN client_id UUID;
        RAISE NOTICE 'Columna client_id agregada a service_tickets';
    END IF;
    
    -- Agregar columna company_id si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'service_tickets' AND column_name = 'company_id'
    ) THEN
        ALTER TABLE service_tickets ADD COLUMN company_id UUID;
        RAISE NOTICE 'Columna company_id agregada a service_tickets';
    END IF;
    
    -- Actualizar los datos existentes para establecer client_id y company_id
    UPDATE service_tickets 
    SET 
        client_id = cl.client_id,
        company_id = c.id
    FROM client_locations cl
    JOIN clients cli ON cl.client_id = cli.id
    JOIN companies c ON cli.company_id = c.id
    WHERE service_tickets.location_id = cl.id
    AND service_tickets.client_id IS NULL;
    
    RAISE NOTICE 'Datos de service_tickets actualizados con client_id y company_id';
    
    -- Agregar restricciones de clave foránea para client_id y company_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'service_tickets_client_id_fkey' 
        AND table_name = 'service_tickets'
    ) THEN
        ALTER TABLE service_tickets 
        ADD CONSTRAINT service_tickets_client_id_fkey 
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;
        RAISE NOTICE 'Restricción service_tickets_client_id_fkey creada';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'service_tickets_company_id_fkey' 
        AND table_name = 'service_tickets'
    ) THEN
        ALTER TABLE service_tickets 
        ADD CONSTRAINT service_tickets_company_id_fkey 
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
        RAISE NOTICE 'Restricción service_tickets_company_id_fkey creada';
    END IF;
    
END $$;

-- =====================================================
-- CREAR VISTA MEJORADA PARA SERVICE_TICKETS
-- =====================================================

CREATE OR REPLACE VIEW service_tickets_detailed AS
SELECT 
    st.*,
    comp.name as company_name,
    cli.name as client_name,
    cl.name as location_name,
    cl.address as location_address,
    cl.city as location_city,
    eq.name as equipment_name,
    eq.model as equipment_model,
    eq.serial_number as equipment_serial,
    eq.equipment_type,
    u.name as technician_name,
    u.email as technician_email
FROM service_tickets st
LEFT JOIN companies comp ON st.company_id = comp.id
LEFT JOIN clients cli ON st.client_id = cli.id
LEFT JOIN client_locations cl ON st.location_id = cl.id
LEFT JOIN equipment eq ON st.equipment_id = eq.id
LEFT JOIN users u ON st.assigned_to = u.id
ORDER BY st.created_at DESC;

-- =====================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_service_tickets_client_id ON service_tickets(client_id);
CREATE INDEX IF NOT EXISTS idx_service_tickets_company_id ON service_tickets(company_id);
CREATE INDEX IF NOT EXISTS idx_service_tickets_location_id ON service_tickets(location_id);
CREATE INDEX IF NOT EXISTS idx_service_tickets_equipment_id ON service_tickets(equipment_id);
CREATE INDEX IF NOT EXISTS idx_service_tickets_status ON service_tickets(status);
CREATE INDEX IF NOT EXISTS idx_service_tickets_priority ON service_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_service_tickets_assigned_to ON service_tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_service_tickets_created_at ON service_tickets(created_at);
