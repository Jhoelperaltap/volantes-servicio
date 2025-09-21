-- =====================================================
-- SCRIPT MAESTRO DE BASE DE DATOS - VOLANTE DE SERVICIO
-- =====================================================
-- Este script contiene toda la estructura de la base de datos
-- consolidada en un solo archivo para facilitar el mantenimiento
-- =====================================================

-- Crear extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLAS PRINCIPALES
-- =====================================================

-- Tabla de usuarios (técnicos, administradores y super administradores)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('tecnico', 'admin', 'super_admin')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de localidades/ubicaciones de servicio
CREATE TABLE IF NOT EXISTS locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    address TEXT,
    contact_person VARCHAR(255),
    contact_phone VARCHAR(50),
    contact_email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de repuestos/partes
CREATE TABLE IF NOT EXISTS parts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    part_number VARCHAR(100),
    description TEXT,
    category VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de volantes de servicio
CREATE TABLE IF NOT EXISTS service_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_number SERIAL UNIQUE NOT NULL,
    technician_id UUID NOT NULL REFERENCES users(id),
    location_id UUID NOT NULL REFERENCES locations(id),
    service_type VARCHAR(100) NOT NULL CHECK (service_type IN ('mantenimiento', 'reparacion', 'instalacion', 'cambio_repuesto')),
    description TEXT NOT NULL,
    work_performed TEXT,
    parts_used JSONB DEFAULT '[]',
    status VARCHAR(50) NOT NULL DEFAULT 'completado' CHECK (status IN ('completado', 'pendiente', 'escalado')),
    requires_return BOOLEAN DEFAULT false,
    pending_items TEXT,
    technician_signature TEXT,
    client_signature TEXT,
    technician_signed_at TIMESTAMP,
    client_signed_at TIMESTAMP,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_locked BOOLEAN DEFAULT false,
    image_url TEXT, -- Para documentar con imágenes
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de mensajes de chat entre usuarios
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID NOT NULL REFERENCES users(id),
    recipient_id UUID NOT NULL REFERENCES users(id),
    message TEXT NOT NULL,
    ticket_id UUID REFERENCES service_tickets(id), -- Opcional: asociar chat a un ticket específico
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraint para evitar que un usuario se envíe mensajes a sí mismo
    CONSTRAINT chat_messages_sender_recipient_check 
        CHECK (sender_id != recipient_id)
);

-- Tabla de notificaciones del sistema
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID REFERENCES service_tickets(id),
    type VARCHAR(50) NOT NULL CHECK (type IN ('pending_reminder', 'escalation', 'overdue', 'chat_message', 'ticket_update')),
    message TEXT NOT NULL,
    title VARCHAR(255), -- Para notificaciones de chat
    related_id UUID, -- ID relacionado (chat, etc.)
    is_read BOOLEAN DEFAULT false,
    sent_to UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de configuración de empresa
CREATE TABLE IF NOT EXISTS company_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name VARCHAR(255) NOT NULL,
    company_address TEXT,
    company_phone VARCHAR(50),
    company_email VARCHAR(255),
    logo_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de configuración de notificaciones
CREATE TABLE IF NOT EXISTS notification_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reminder_hours INTEGER DEFAULT 24,
    escalation_days INTEGER DEFAULT 3,
    overdue_days INTEGER DEFAULT 7,
    email_notifications BOOLEAN DEFAULT true,
    auto_escalation BOOLEAN DEFAULT true,
    reminder_frequency_hours INTEGER DEFAULT 12,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- ÍNDICES PARA OPTIMIZACIÓN DE RENDIMIENTO
-- =====================================================

-- Índices para service_tickets
CREATE INDEX IF NOT EXISTS idx_service_tickets_technician ON service_tickets(technician_id);
CREATE INDEX IF NOT EXISTS idx_service_tickets_location ON service_tickets(location_id);
CREATE INDEX IF NOT EXISTS idx_service_tickets_status ON service_tickets(status);
CREATE INDEX IF NOT EXISTS idx_service_tickets_created_at ON service_tickets(created_at);
CREATE INDEX IF NOT EXISTS idx_service_tickets_image_url ON service_tickets(image_url) WHERE image_url IS NOT NULL;

-- Índices para chat_messages
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_recipient_id ON chat_messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_ticket_id ON chat_messages(ticket_id);

-- Índices para notifications
CREATE INDEX IF NOT EXISTS idx_notifications_sent_to ON notifications(sent_to);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_ticket_id ON notifications(ticket_id);

-- =====================================================
-- FUNCIONES Y TRIGGERS
-- =====================================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at automáticamente
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_locations_updated_at ON locations;
CREATE TRIGGER update_locations_updated_at 
    BEFORE UPDATE ON locations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_parts_updated_at ON parts;
CREATE TRIGGER update_parts_updated_at 
    BEFORE UPDATE ON parts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_service_tickets_updated_at ON service_tickets;
CREATE TRIGGER update_service_tickets_updated_at 
    BEFORE UPDATE ON service_tickets 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_company_settings_updated_at ON company_settings;
CREATE TRIGGER update_company_settings_updated_at 
    BEFORE UPDATE ON company_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para crear notificación automáticamente cuando se envía un mensaje de chat
CREATE OR REPLACE FUNCTION create_chat_notification()
RETURNS TRIGGER AS $$
BEGIN
    -- Crear notificación para el destinatario usando la estructura existente
    INSERT INTO notifications (ticket_id, type, message, sent_to)
    VALUES (
        NEW.ticket_id,
        'chat_message',
        CASE 
            WHEN NEW.ticket_id IS NOT NULL THEN 
                'Nuevo mensaje sobre volante #' || (SELECT ticket_number FROM service_tickets WHERE id = NEW.ticket_id) || ': ' || LEFT(NEW.message, 100) || CASE WHEN LENGTH(NEW.message) > 100 THEN '...' ELSE '' END
            ELSE 
                'Nuevo mensaje de chat: ' || LEFT(NEW.message, 100) || CASE WHEN LENGTH(NEW.message) > 100 THEN '...' ELSE '' END
        END,
        NEW.recipient_id
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para notificaciones automáticas de chat
DROP TRIGGER IF EXISTS trigger_chat_notification ON chat_messages;
CREATE TRIGGER trigger_chat_notification
    AFTER INSERT ON chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION create_chat_notification();

-- Función para procesar notificaciones automáticas de volantes pendientes
CREATE OR REPLACE FUNCTION process_notifications()
RETURNS void AS $$
DECLARE
    ticket_record RECORD;
    notification_exists BOOLEAN;
BEGIN
    -- Procesar volantes pendientes para recordatorios
    FOR ticket_record IN 
        SELECT 
            st.id,
            st.ticket_number,
            st.technician_id,
            st.pending_items,
            EXTRACT(DAY FROM (CURRENT_TIMESTAMP - st.created_at)) as days_pending,
            EXTRACT(HOUR FROM (CURRENT_TIMESTAMP - st.created_at)) as hours_pending
        FROM service_tickets st
        WHERE (st.status = 'pendiente' OR st.requires_return = true)
        AND st.created_at < CURRENT_TIMESTAMP - INTERVAL '24 hours'
    LOOP
        -- Verificar si ya existe una notificación reciente
        SELECT EXISTS(
            SELECT 1 FROM notifications 
            WHERE ticket_id = ticket_record.id 
            AND created_at > CURRENT_TIMESTAMP - INTERVAL '12 hours'
        ) INTO notification_exists;

        -- Crear notificación de recordatorio si no existe una reciente
        IF NOT notification_exists AND ticket_record.hours_pending >= 24 THEN
            INSERT INTO notifications (ticket_id, type, message, sent_to)
            SELECT 
                ticket_record.id,
                'pending_reminder',
                'Volante #' || ticket_record.ticket_number || ' lleva ' || ticket_record.days_pending || ' días pendiente',
                id
            FROM users 
            WHERE role IN ('admin', 'super_admin');
        END IF;

        -- Crear notificación de escalamiento si han pasado 3 días
        IF ticket_record.days_pending >= 3 THEN
            SELECT EXISTS(
                SELECT 1 FROM notifications 
                WHERE ticket_id = ticket_record.id 
                AND type = 'escalation'
            ) INTO notification_exists;

            IF NOT notification_exists THEN
                INSERT INTO notifications (ticket_id, type, message, sent_to)
                SELECT 
                    ticket_record.id,
                    'escalation',
                    'ESCALADO: Volante #' || ticket_record.ticket_number || ' requiere atención inmediata (' || ticket_record.days_pending || ' días)',
                    id
                FROM users 
                WHERE role IN ('admin', 'super_admin');

                -- Actualizar estado del ticket a escalado
                UPDATE service_tickets 
                SET status = 'escalado' 
                WHERE id = ticket_record.id AND status != 'escalado';
            END IF;
        END IF;

        -- Crear notificación de vencido si han pasado 7 días
        IF ticket_record.days_pending >= 7 THEN
            SELECT EXISTS(
                SELECT 1 FROM notifications 
                WHERE ticket_id = ticket_record.id 
                AND type = 'overdue'
            ) INTO notification_exists;

            IF NOT notification_exists THEN
                INSERT INTO notifications (ticket_id, type, message, sent_to)
                SELECT 
                    ticket_record.id,
                    'overdue',
                    'CRÍTICO: Volante #' || ticket_record.ticket_number || ' está vencido (' || ticket_record.days_pending || ' días)',
                    id
                FROM users 
                WHERE role IN ('admin', 'super_admin');
            END IF;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VISTA PARA CONVERSACIONES DE CHAT
-- =====================================================

-- Vista para obtener conversaciones de chat organizadas
CREATE OR REPLACE VIEW chat_conversations AS
SELECT 
    CASE 
        WHEN cm.sender_id < cm.recipient_id 
        THEN cm.sender_id || '-' || cm.recipient_id
        ELSE cm.recipient_id || '-' || cm.sender_id
    END as conversation_id,
    CASE 
        WHEN cm.sender_id < cm.recipient_id 
        THEN cm.sender_id
        ELSE cm.recipient_id
    END as user1_id,
    CASE 
        WHEN cm.sender_id < cm.recipient_id 
        THEN cm.recipient_id
        ELSE cm.sender_id
    END as user2_id,
    u1.name as user1_name,
    u1.role as user1_role,
    u2.name as user2_name,
    u2.role as user2_role,
    cm.message as last_message,
    cm.created_at as last_message_at,
    cm.sender_id as last_sender_id,
    COUNT(CASE WHEN cm2.read_at IS NULL AND cm2.recipient_id = cm.recipient_id THEN 1 END) as unread_count
FROM chat_messages cm
JOIN users u1 ON u1.id = CASE 
    WHEN cm.sender_id < cm.recipient_id 
    THEN cm.sender_id
    ELSE cm.recipient_id
END
JOIN users u2 ON u2.id = CASE 
    WHEN cm.sender_id < cm.recipient_id 
    THEN cm.recipient_id
    ELSE cm.sender_id
END
LEFT JOIN chat_messages cm2 ON (
    (cm2.sender_id = cm.sender_id AND cm2.recipient_id = cm.recipient_id) OR
    (cm2.sender_id = cm.recipient_id AND cm2.recipient_id = cm.sender_id)
)
WHERE cm.created_at = (
    SELECT MAX(created_at)
    FROM chat_messages cm3
    WHERE (
        (cm3.sender_id = cm.sender_id AND cm3.recipient_id = cm.recipient_id) OR
        (cm3.sender_id = cm.recipient_id AND cm3.recipient_id = cm.sender_id)
    )
)
GROUP BY 
    conversation_id, user1_id, user2_id, u1.name, u1.role, u2.name, u2.role,
    cm.message, cm.created_at, cm.sender_id
ORDER BY cm.created_at DESC;

-- =====================================================
-- CONFIGURACIÓN INICIAL
-- =====================================================

-- Insertar configuración por defecto de notificaciones
INSERT INTO notification_settings (reminder_hours, escalation_days, overdue_days) 
VALUES (24, 3, 7)
ON CONFLICT DO NOTHING;

-- =====================================================
-- COMENTARIOS FINALES
-- =====================================================

-- Este script maestro incluye:
-- 1. Todas las tablas necesarias para el sistema de volantes de servicio
-- 2. Sistema de chat entre usuarios
-- 3. Sistema de notificaciones automáticas
-- 4. Índices optimizados para rendimiento
-- 5. Triggers automáticos para actualización de timestamps
-- 6. Funciones para procesamiento de notificaciones
-- 7. Vista para conversaciones de chat
-- 8. Configuración inicial del sistema

-- Para usar este script:
-- 1. Ejecutar en una base de datos PostgreSQL limpia
-- 2. Agregar datos iniciales usando scripts de seed por separado
-- 3. Configurar los datos de empresa específicos
