-- Actualizar la tabla service_tickets para referenciar client_locations en lugar de locations
-- y agregar campos adicionales necesarios

-- Primero, agregar las nuevas columnas
ALTER TABLE service_tickets 
ADD COLUMN IF NOT EXISTS company_id UUID,
ADD COLUMN IF NOT EXISTS client_id UUID,
ADD COLUMN IF NOT EXISTS equipment_id UUID;

-- Agregar las referencias de clave foránea a las nuevas tablas
ALTER TABLE service_tickets 
ADD CONSTRAINT service_tickets_company_id_fkey 
FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT;

ALTER TABLE service_tickets 
ADD CONSTRAINT service_tickets_client_id_fkey 
FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT;

ALTER TABLE service_tickets 
ADD CONSTRAINT service_tickets_equipment_id_fkey 
FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE RESTRICT;

-- Eliminar la restricción antigua de location_id hacia locations
ALTER TABLE service_tickets 
DROP CONSTRAINT IF EXISTS service_tickets_location_id_fkey;

-- Agregar nueva restricción de location_id hacia client_locations
ALTER TABLE service_tickets 
ADD CONSTRAINT service_tickets_location_id_fkey 
FOREIGN KEY (location_id) REFERENCES client_locations(id) ON DELETE RESTRICT;

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_service_tickets_company_id ON service_tickets(company_id);
CREATE INDEX IF NOT EXISTS idx_service_tickets_client_id ON service_tickets(client_id);
CREATE INDEX IF NOT EXISTS idx_service_tickets_equipment_id ON service_tickets(equipment_id);
