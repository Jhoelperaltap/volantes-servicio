-- =====================================================
-- ESQUEMA PARA SOPORTE DE MÚLTIPLES SESIONES Y DISPOSITIVOS
-- =====================================================

-- Tabla de sesiones activas
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_id VARCHAR(255) UNIQUE NOT NULL, -- Identificador único del token JWT
    device_fingerprint VARCHAR(255), -- Huella digital del dispositivo
    device_name VARCHAR(255), -- Nombre del dispositivo (ej: "iPhone 13", "Chrome Windows")
    ip_address INET, -- Dirección IP de la sesión
    user_agent TEXT, -- User agent del navegador
    is_active BOOLEAN DEFAULT true,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de tokens revocados (blacklist)
CREATE TABLE IF NOT EXISTS revoked_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token_id VARCHAR(255) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    revoked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    reason VARCHAR(100) DEFAULT 'manual_logout', -- 'manual_logout', 'logout_all', 'security', 'expired'
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL -- Para limpiar tokens expirados
);

-- Tabla de configuración de sesiones por usuario
CREATE TABLE IF NOT EXISTS user_session_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    max_concurrent_sessions INTEGER DEFAULT 5, -- Máximo de sesiones concurrentes
    session_timeout_minutes INTEGER DEFAULT 480, -- 8 horas por defecto
    require_device_approval BOOLEAN DEFAULT false, -- Requerir aprobación de nuevos dispositivos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

-- Índices para user_sessions
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token_id ON user_sessions(token_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON user_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_user_sessions_last_activity ON user_sessions(last_activity);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_device_fingerprint ON user_sessions(device_fingerprint);

-- Índices para revoked_tokens
CREATE INDEX IF NOT EXISTS idx_revoked_tokens_token_id ON revoked_tokens(token_id);
CREATE INDEX IF NOT EXISTS idx_revoked_tokens_user_id ON revoked_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_revoked_tokens_expires_at ON revoked_tokens(expires_at);

-- Índices para user_session_settings
CREATE INDEX IF NOT EXISTS idx_user_session_settings_user_id ON user_session_settings(user_id);

-- =====================================================
-- TRIGGERS PARA ACTUALIZACIÓN AUTOMÁTICA
-- =====================================================

-- Trigger para actualizar updated_at en user_sessions
DROP TRIGGER IF EXISTS update_user_sessions_updated_at ON user_sessions;
CREATE TRIGGER update_user_sessions_updated_at 
    BEFORE UPDATE ON user_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para actualizar updated_at en user_session_settings
DROP TRIGGER IF EXISTS update_user_session_settings_updated_at ON user_session_settings;
CREATE TRIGGER update_user_session_settings_updated_at 
    BEFORE UPDATE ON user_session_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCIONES PARA GESTIÓN DE SESIONES
-- =====================================================

-- Función para limpiar sesiones expiradas y tokens revocados
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
    -- Marcar sesiones expiradas como inactivas
    UPDATE user_sessions 
    SET is_active = false 
    WHERE expires_at < CURRENT_TIMESTAMP AND is_active = true;
    
    -- Eliminar tokens revocados que ya expiraron
    DELETE FROM revoked_tokens 
    WHERE expires_at < CURRENT_TIMESTAMP;
    
    -- Eliminar sesiones muy antiguas (más de 30 días inactivas)
    DELETE FROM user_sessions 
    WHERE last_activity < CURRENT_TIMESTAMP - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Función para verificar si un token está revocado
CREATE OR REPLACE FUNCTION is_token_revoked(token_id_param VARCHAR(255))
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS(
        SELECT 1 FROM revoked_tokens 
        WHERE token_id = token_id_param 
        AND expires_at > CURRENT_TIMESTAMP
    );
END;
$$ LANGUAGE plpgsql;

-- Función para obtener sesiones activas de un usuario
CREATE OR REPLACE FUNCTION get_user_active_sessions(user_id_param UUID)
RETURNS TABLE(
    session_id UUID,
    device_name VARCHAR(255),
    device_fingerprint VARCHAR(255),
    ip_address INET,
    last_activity TIMESTAMP WITH TIME ZONE,
    is_current BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        us.id,
        us.device_name,
        us.device_fingerprint,
        us.ip_address,
        us.last_activity,
        us.last_activity > CURRENT_TIMESTAMP - INTERVAL '5 minutes' as is_current
    FROM user_sessions us
    WHERE us.user_id = user_id_param 
    AND us.is_active = true 
    AND us.expires_at > CURRENT_TIMESTAMP
    ORDER BY us.last_activity DESC;
END;
$$ LANGUAGE plpgsql;

-- Función para revocar todas las sesiones de un usuario excepto la actual
CREATE OR REPLACE FUNCTION logout_all_devices(user_id_param UUID, current_token_id VARCHAR(255) DEFAULT NULL)
RETURNS INTEGER AS $$
DECLARE
    revoked_count INTEGER := 0;
    session_record RECORD;
BEGIN
    -- Obtener todas las sesiones activas del usuario
    FOR session_record IN 
        SELECT token_id, expires_at 
        FROM user_sessions 
        WHERE user_id = user_id_param 
        AND is_active = true 
        AND expires_at > CURRENT_TIMESTAMP
        AND (current_token_id IS NULL OR token_id != current_token_id)
    LOOP
        -- Agregar token a la blacklist
        INSERT INTO revoked_tokens (token_id, user_id, reason, expires_at)
        VALUES (session_record.token_id, user_id_param, 'logout_all', session_record.expires_at)
        ON CONFLICT (token_id) DO NOTHING;
        
        -- Marcar sesión como inactiva
        UPDATE user_sessions 
        SET is_active = false 
        WHERE token_id = session_record.token_id;
        
        revoked_count := revoked_count + 1;
    END LOOP;
    
    RETURN revoked_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- CONFIGURACIÓN INICIAL
-- =====================================================

-- Insertar configuración por defecto para usuarios existentes
INSERT INTO user_session_settings (user_id, max_concurrent_sessions, session_timeout_minutes)
SELECT id, 5, 480 FROM users
ON CONFLICT (user_id) DO NOTHING;

-- =====================================================
-- VISTA PARA SESIONES ACTIVAS
-- =====================================================

CREATE OR REPLACE VIEW active_user_sessions AS
SELECT 
    us.id,
    us.user_id,
    u.name as user_name,
    u.email as user_email,
    u.role as user_role,
    us.device_name,
    us.device_fingerprint,
    us.ip_address,
    us.user_agent,
    us.last_activity,
    us.created_at as session_started,
    us.expires_at,
    CASE 
        WHEN us.last_activity > CURRENT_TIMESTAMP - INTERVAL '5 minutes' THEN true
        ELSE false
    END as is_current_session
FROM user_sessions us
JOIN users u ON u.id = us.user_id
WHERE us.is_active = true 
AND us.expires_at > CURRENT_TIMESTAMP
ORDER BY us.last_activity DESC;
