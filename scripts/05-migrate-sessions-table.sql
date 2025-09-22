-- Migración para agregar columnas faltantes a la tabla user_sessions

-- Agregar columnas que podrían faltar
ALTER TABLE user_sessions 
ADD COLUMN IF NOT EXISTS session_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS device_info TEXT,
ADD COLUMN IF NOT EXISTS ip_address INET,
ADD COLUMN IF NOT EXISTS user_agent TEXT,
ADD COLUMN IF NOT EXISTS last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Hacer session_token único si no lo es
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'user_sessions_session_token_key'
    ) THEN
        ALTER TABLE user_sessions ADD CONSTRAINT user_sessions_session_token_key UNIQUE (session_token);
    END IF;
END $$;

-- Crear índices faltantes
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(is_active);

-- Crear tabla para configuración de sesiones si no existe
CREATE TABLE IF NOT EXISTS session_settings (
  id SERIAL PRIMARY KEY,
  max_concurrent_sessions INTEGER DEFAULT 5,
  session_timeout_minutes INTEGER DEFAULT 480,
  require_device_approval BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar configuración por defecto
INSERT INTO session_settings (max_concurrent_sessions, session_timeout_minutes, require_device_approval)
VALUES (5, 480, false)
ON CONFLICT DO NOTHING;
