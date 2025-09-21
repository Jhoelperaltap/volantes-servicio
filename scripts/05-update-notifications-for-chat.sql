-- Agregar columnas necesarias para el sistema de chat a la tabla existente
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS title VARCHAR(255),
ADD COLUMN IF NOT EXISTS related_id UUID;

-- Actualizar el constraint de tipo para incluir chat_message
ALTER TABLE notifications 
DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications 
ADD CONSTRAINT notifications_type_check 
CHECK (type IN ('pending_reminder', 'escalation', 'overdue', 'chat_message', 'ticket_update'));

-- Modificar tabla chat_messages para agregar referencia al volante
ALTER TABLE chat_messages 
ADD COLUMN IF NOT EXISTS ticket_id UUID REFERENCES service_tickets(id) ON DELETE SET NULL;

-- Crear índice para ticket_id
CREATE INDEX IF NOT EXISTS idx_chat_messages_ticket_id ON chat_messages(ticket_id);

-- Función para crear notificación automáticamente cuando se envía un mensaje
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

-- Crear trigger para notificaciones automáticas
DROP TRIGGER IF EXISTS trigger_chat_notification ON chat_messages;
CREATE TRIGGER trigger_chat_notification
  AFTER INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION create_chat_notification();
