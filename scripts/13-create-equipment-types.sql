-- =====================================================
-- TABLA DE TIPOS DE EQUIPO
-- =====================================================
-- Crear tabla para gestionar tipos de equipo como entidades independientes

CREATE TABLE IF NOT EXISTS equipment_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_equipment_types_name ON equipment_types(name);
CREATE INDEX IF NOT EXISTS idx_equipment_types_is_active ON equipment_types(is_active);

-- Trigger para updated_at
DROP TRIGGER IF EXISTS update_equipment_types_updated_at ON equipment_types;
CREATE TRIGGER update_equipment_types_updated_at 
    BEFORE UPDATE ON equipment_types 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insertar tipos de equipo predefinidos
INSERT INTO equipment_types (name, display_name, description) VALUES
('aire_acondicionado', 'Aire Acondicionado', 'Equipos de climatización y aire acondicionado'),
('refrigeracion', 'Refrigeración', 'Equipos de refrigeración comercial e industrial'),
('calefaccion', 'Calefacción', 'Equipos de calefacción y calentamiento'),
('ventilacion', 'Ventilación', 'Equipos de ventilación y extracción de aire'),
('electrodomestico', 'Electrodoméstico', 'Electrodomésticos diversos'),
('otro', 'Otro', 'Otros tipos de equipos no categorizados')
ON CONFLICT (name) DO NOTHING;

-- Actualizar la tabla equipment para usar foreign key (opcional, mantener compatibilidad)
-- ALTER TABLE equipment ADD COLUMN equipment_type_id UUID REFERENCES equipment_types(id);

-- Vista para mostrar equipos con información del tipo
CREATE OR REPLACE VIEW equipment_with_type_view AS
SELECT 
    eq.*,
    et.display_name as equipment_type_display,
    et.description as equipment_type_description,
    loc.name as location_name,
    cl.name as client_name,
    c.name as company_name
FROM equipment eq
LEFT JOIN equipment_types et ON eq.equipment_type = et.name
JOIN client_locations loc ON eq.location_id = loc.id
JOIN clients cl ON loc.client_id = cl.id
JOIN companies c ON cl.company_id = c.id
ORDER BY c.name, cl.name, loc.name, eq.name;
