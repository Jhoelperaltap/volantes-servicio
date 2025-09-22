-- Crear tabla de configuración de sesiones
CREATE TABLE IF NOT EXISTS session_settings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  max_concurrent_sessions INTEGER DEFAULT 5 CHECK (max_concurrent_sessions >= 1 AND max_concurrent_sessions <= 10),
  session_timeout_minutes INTEGER DEFAULT 480 CHECK (session_timeout_minutes >= 60 AND session_timeout_minutes <= 1440),
  require_device_approval BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

-- Crear índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_session_settings_user_id ON session_settings(user_id);

-- Insertar configuración por defecto para usuarios existentes
INSERT INTO session_settings (user_id, max_concurrent_sessions, session_timeout_minutes, require_device_approval)
SELECT id, 5, 480, false 
FROM users 
WHERE id NOT IN (SELECT user_id FROM session_settings WHERE user_id IS NOT NULL)
ON CONFLICT (user_id) DO NOTHING;
