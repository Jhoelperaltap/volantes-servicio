-- =====================================================
-- CORRECCIÓN DE TABLAS DE SESIONES
-- =====================================================
-- Corrige la estructura de las tablas de sesiones para usar
-- la estructura correcta basada en el schema maestro

-- Eliminar tablas existentes si tienen estructura incorrecta
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS session_settings CASCADE;

-- Crear tabla de sesiones de usuario con estructura correcta
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    device_info JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMP NOT NULL,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de configuración de sesiones
CREATE TABLE IF NOT EXISTS session_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    max_sessions INTEGER DEFAULT 5,
    session_timeout_hours INTEGER DEFAULT 24,
    require_2fa BOOLEAN DEFAULT false,
    allow_concurrent_sessions BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Un usuario solo puede tener una configuración
    UNIQUE(user_id)
);

-- Crear índices optimizados
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(is_active, last_activity);

CREATE INDEX IF NOT EXISTS idx_session_settings_user_id ON session_settings(user_id);

-- Trigger para actualizar updated_at en session_settings
DROP TRIGGER IF EXISTS update_session_settings_updated_at ON session_settings;
CREATE TRIGGER update_session_settings_updated_at 
    BEFORE UPDATE ON session_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insertar configuración por defecto para usuarios existentes
INSERT INTO session_settings (user_id, max_sessions, session_timeout_hours, require_2fa, allow_concurrent_sessions)
SELECT 
    id,
    5,
    24,
    false,
    true
FROM users
ON CONFLICT (user_id) DO NOTHING;

-- Función para limpiar sesiones expiradas
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
    DELETE FROM user_sessions 
    WHERE expires_at < CURRENT_TIMESTAMP 
    OR (last_activity < CURRENT_TIMESTAMP - INTERVAL '7 days');
END;
$$ LANGUAGE plpgsql;
