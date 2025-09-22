-- Crear tabla de sesiones de usuario si no existe
CREATE TABLE IF NOT EXISTS user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    device_info TEXT,
    ip_address INET,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);

-- Crear tabla de configuración de sesiones si no existe
CREATE TABLE IF NOT EXISTS session_settings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL,
    max_concurrent_sessions INTEGER DEFAULT 5,
    session_timeout_minutes INTEGER DEFAULT 480,
    require_device_approval BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índice para la tabla de configuración
CREATE INDEX IF NOT EXISTS idx_session_settings_user_id ON session_settings(user_id);

-- Insertar configuración por defecto para usuarios existentes (si la tabla usuarios existe)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'usuarios') THEN
        INSERT INTO session_settings (user_id, max_concurrent_sessions, session_timeout_minutes, require_device_approval)
        SELECT id, 5, 480, false 
        FROM usuarios 
        WHERE id NOT IN (SELECT user_id FROM session_settings);
    END IF;
END $$;
