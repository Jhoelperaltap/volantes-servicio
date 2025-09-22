-- Crear tabla para gestión de sesiones de usuario
CREATE TABLE IF NOT EXISTS user_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_token VARCHAR(255) NOT NULL UNIQUE,
  device_info TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  is_active BOOLEAN DEFAULT true
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(is_active);

-- Crear tabla para configuración de sesiones
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
