-- Agregar campo para nota de cierre en volantes
ALTER TABLE service_tickets 
ADD COLUMN IF NOT EXISTS completion_note TEXT;

-- Agregar comentario para documentar el campo
COMMENT ON COLUMN service_tickets.completion_note IS 'Nota del administrador al completar el volante, indicando qué volante cerró el pendiente o seguimiento';
