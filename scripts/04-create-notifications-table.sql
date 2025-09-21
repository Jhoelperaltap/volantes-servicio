-- Crear tabla de notificaciones para el sistema de chat
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'chat_message', 'ticket_update', etc.
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  related_id UUID, -- ID del volante, chat, etc.
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Modificar tabla chat_messages para agregar referencia al volante
ALTER TABLE chat_messages 
ADD COLUMN IF NOT EXISTS ticket_id UUID REFERENCES tickets(id) ON DELETE SET NULL;

-- Crear índice para ticket_id
CREATE INDEX IF NOT EXISTS idx_chat_messages_ticket_id ON chat_messages(ticket_id);

-- Función para crear notificación automáticamente cuando se envía un mensaje
CREATE OR REPLACE FUNCTION create_chat_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Crear notificación para el destinatario
  INSERT INTO notifications (user_id, type, title, message, related_id)
  VALUES (
    NEW.recipient_id,
    'chat_message',
    CASE 
      WHEN NEW.ticket_id IS NOT NULL THEN 
        'Nuevo mensaje sobre volante #' || (SELECT numero FROM tickets WHERE id = NEW.ticket_id)
      ELSE 
        'Nuevo mensaje de chat'
    END,
    LEFT(NEW.message, 100) || CASE WHEN LENGTH(NEW.message) > 100 THEN '...' ELSE '' END,
    NEW.ticket_id
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
