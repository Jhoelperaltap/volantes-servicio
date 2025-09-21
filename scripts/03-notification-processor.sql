-- Función para procesar notificaciones automáticas
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

-- Crear tabla para configuración de notificaciones
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

-- Insertar configuración por defecto
INSERT INTO notification_settings (reminder_hours, escalation_days, overdue_days) 
VALUES (24, 3, 7)
ON CONFLICT DO NOTHING;

-- Actualizar esquema de service_tickets para incluir estado escalado
ALTER TABLE service_tickets 
DROP CONSTRAINT IF EXISTS service_tickets_status_check;

ALTER TABLE service_tickets 
ADD CONSTRAINT service_tickets_status_check 
CHECK (status IN ('completado', 'pendiente', 'escalado'));
