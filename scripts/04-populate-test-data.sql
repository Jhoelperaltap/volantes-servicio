-- Insertar localidades de prueba
INSERT INTO locations (name, address, contact_person, contact_phone, contact_email) VALUES
('Oficina Central', 'Av. Principal 123, Ciudad', 'María González', '+1-555-0101', 'maria@empresa.com'),
('Sucursal Norte', 'Calle Norte 456, Zona Norte', 'Carlos Rodríguez', '+1-555-0102', 'carlos@empresa.com'),
('Sucursal Sur', 'Av. Sur 789, Zona Sur', 'Ana López', '+1-555-0103', 'ana@empresa.com'),
('Centro de Distribución', 'Industrial Park 321, Zona Industrial', 'Roberto Silva', '+1-555-0104', 'roberto@empresa.com'),
('Almacén Principal', 'Calle Almacén 654, Centro', 'Laura Martínez', '+1-555-0105', 'laura@empresa.com');

-- Insertar repuestos/partes de prueba
INSERT INTO parts (name, part_number, description, category, is_active) VALUES
('Filtro de Aire', 'FA-001', 'Filtro de aire para equipos de climatización', 'Filtros', true),
('Correa de Transmisión', 'CT-002', 'Correa para motores industriales', 'Transmisión', true),
('Sensor de Temperatura', 'ST-003', 'Sensor digital de temperatura', 'Sensores', true),
('Válvula de Presión', 'VP-004', 'Válvula reguladora de presión', 'Válvulas', true),
('Cable de Red Cat6', 'CR-005', 'Cable de red categoría 6', 'Cables', true),
('Fusible 20A', 'FU-006', 'Fusible de 20 amperios', 'Eléctricos', true),
('Rodamiento 6205', 'RO-007', 'Rodamiento de bolas 6205', 'Rodamientos', true),
('Aceite Hidráulico', 'AH-008', 'Aceite hidráulico ISO 46', 'Lubricantes', true),
('Junta Tórica', 'JT-009', 'Junta tórica de goma', 'Juntas', true),
('Interruptor Magnético', 'IM-010', 'Interruptor magnético 24V', 'Eléctricos', true);

-- Insertar técnicos adicionales
INSERT INTO users (email, password_hash, name, role, is_active) VALUES
('tecnico1@empresa.com', '$2a$10$jOOMUHzCxukz.eMKAHbqcO/hK/GXbb23P37I/tyBbOrtu1/TEJkUq', 'Juan Pérez', 'tecnico', true),
('tecnico2@empresa.com', '$2a$10$jOOMUHzCxukz.eMKAHbqcO/hK/GXbb23P37I/tyBbOrtu1/TEJkUq', 'Pedro Sánchez', 'tecnico', true),
('admin1@empresa.com', '$2a$10$jOOMUHzCxukz.eMKAHbqcO/hK/GXbb23P37I/tyBbOrtu1/TEJkUq', 'Supervisor Admin', 'admin', true);

-- Insertar volantes de servicio de prueba
INSERT INTO service_tickets (
    technician_id, 
    location_id, 
    service_type, 
    description, 
    work_performed, 
    parts_used, 
    status, 
    requires_return, 
    pending_items,
    completed_at
) 
SELECT 
    u.id as technician_id,
    l.id as location_id,
    CASE 
        WHEN random() < 0.25 THEN 'mantenimiento'
        WHEN random() < 0.5 THEN 'reparacion'
        WHEN random() < 0.75 THEN 'instalacion'
        ELSE 'cambio_repuesto'
    END as service_type,
    CASE 
        WHEN random() < 0.2 THEN 'Mantenimiento preventivo de equipos de climatización'
        WHEN random() < 0.4 THEN 'Reparación de sistema eléctrico'
        WHEN random() < 0.6 THEN 'Instalación de nuevo equipo'
        WHEN random() < 0.8 THEN 'Cambio de filtros y lubricantes'
        ELSE 'Revisión general de sistemas'
    END as description,
    CASE 
        WHEN random() < 0.2 THEN 'Se realizó limpieza completa y cambio de filtros'
        WHEN random() < 0.4 THEN 'Se reparó conexión eléctrica defectuosa'
        WHEN random() < 0.6 THEN 'Se instaló equipo según especificaciones'
        WHEN random() < 0.8 THEN 'Se cambiaron componentes desgastados'
        ELSE 'Se verificó funcionamiento correcto de todos los sistemas'
    END as work_performed,
    CASE 
        WHEN random() < 0.3 THEN '[]'::jsonb
        WHEN random() < 0.6 THEN '[{"id": "' || p1.id || '", "name": "' || p1.name || '", "quantity": 1}]'::jsonb
        ELSE '[{"id": "' || p1.id || '", "name": "' || p1.name || '", "quantity": 1}, {"id": "' || p2.id || '", "name": "' || p2.name || '", "quantity": 2}]'::jsonb
    END as parts_used,
    CASE 
        WHEN random() < 0.7 THEN 'completado'
        WHEN random() < 0.9 THEN 'pendiente'
        ELSE 'escalado'
    END as status,
    random() < 0.2 as requires_return,
    CASE 
        WHEN random() < 0.8 THEN NULL
        ELSE 'Pendiente entrega de repuesto adicional'
    END as pending_items,
    CURRENT_TIMESTAMP - (random() * interval '30 days') as completed_at
FROM 
    (SELECT id FROM users WHERE role IN ('tecnico', 'super_admin') ORDER BY random() LIMIT 1) u,
    (SELECT id FROM locations ORDER BY random() LIMIT 1) l,
    (SELECT id, name FROM parts WHERE is_active = true ORDER BY random() LIMIT 1) p1,
    (SELECT id, name FROM parts WHERE is_active = true ORDER BY random() LIMIT 1) p2,
    generate_series(1, 25);

-- Insertar notificaciones de prueba
INSERT INTO notifications (ticket_id, type, message, is_read, sent_to)
SELECT 
    st.id as ticket_id,
    CASE 
        WHEN st.status = 'pendiente' THEN 'pending_reminder'
        WHEN st.status = 'escalado' THEN 'escalation'
        ELSE 'overdue'
    END as type,
    CASE 
        WHEN st.status = 'pendiente' THEN 'Volante #' || st.ticket_number || ' requiere atención'
        WHEN st.status = 'escalado' THEN 'Volante #' || st.ticket_number || ' ha sido escalado'
        ELSE 'Volante #' || st.ticket_number || ' está vencido'
    END as message,
    random() < 0.3 as is_read,
    u.id as sent_to
FROM service_tickets st
CROSS JOIN (SELECT id FROM users WHERE role IN ('admin', 'super_admin') ORDER BY random() LIMIT 1) u
WHERE st.status IN ('pendiente', 'escalado')
LIMIT 10;

-- Insertar configuración de empresa
INSERT INTO company_settings (company_name, company_address, company_phone, company_email)
VALUES ('Servicios Técnicos EJ Support IT', 'Av. Tecnología 123, Ciudad Tech', '+1-555-TECH', 'info@ejsupportit.com');
