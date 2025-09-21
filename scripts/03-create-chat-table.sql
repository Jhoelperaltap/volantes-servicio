-- Crear tabla para el sistema de chat entre admin/super_admin y técnicos
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES users(id),
  recipient_id UUID NOT NULL REFERENCES users(id),
  message TEXT NOT NULL,
  ticket_id UUID REFERENCES service_tickets(id), -- Opcional: asociar chat a un ticket específico
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP WITH TIME ZONE,
  
  -- Índices para mejorar performance
  CONSTRAINT chat_messages_sender_recipient_check 
    CHECK (sender_id != recipient_id)
);

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_recipient_id ON chat_messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_ticket_id ON chat_messages(ticket_id);

-- Crear vista para conversaciones
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

-- Eliminé los datos ficticios que causaban el error de sender_id null
