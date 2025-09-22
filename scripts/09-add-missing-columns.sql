-- =====================================================
-- AGREGAR COLUMNAS FALTANTES A TABLAS EXISTENTES
-- =====================================================
-- Agrega las columnas que faltan sin eliminar datos existentes

-- Agregar columnas faltantes a session_settings si no existen
DO $$ 
BEGIN
    -- Verificar y agregar max_sessions
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'session_settings' AND column_name = 'max_sessions') THEN
        ALTER TABLE session_settings ADD COLUMN max_sessions INTEGER DEFAULT 5;
    END IF;
    
    -- Verificar y agregar session_timeout_hours
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'session_settings' AND column_name = 'session_timeout_hours') THEN
        ALTER TABLE session_settings ADD COLUMN session_timeout_hours INTEGER DEFAULT 8;
    END IF;
    
    -- Verificar y agregar require_2fa
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'session_settings' AND column_name = 'require_2fa') THEN
        ALTER TABLE session_settings ADD COLUMN require_2fa BOOLEAN DEFAULT false;
    END IF;
    
    -- Verificar y agregar allow_concurrent_sessions
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'session_settings' AND column_name = 'allow_concurrent_sessions') THEN
        ALTER TABLE session_settings ADD COLUMN allow_concurrent_sessions BOOLEAN DEFAULT true;
    END IF;
    
    -- Verificar y agregar user_id si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'session_settings' AND column_name = 'user_id') THEN
        ALTER TABLE session_settings ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE CASCADE;
        -- Crear índice para user_id
        CREATE INDEX IF NOT EXISTS idx_session_settings_user_id ON session_settings(user_id);
        -- Agregar constraint único
        ALTER TABLE session_settings ADD CONSTRAINT unique_user_session_settings UNIQUE(user_id);
    END IF;
END $$;

-- Agregar columnas faltantes a user_sessions si no existen
DO $$ 
BEGIN
    -- Verificar y agregar session_token
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_sessions' AND column_name = 'session_token') THEN
        ALTER TABLE user_sessions ADD COLUMN session_token VARCHAR(255) UNIQUE;
    END IF;
    
    -- Verificar y agregar device_info
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_sessions' AND column_name = 'device_info') THEN
        ALTER TABLE user_sessions ADD COLUMN device_info JSONB DEFAULT '{}';
    END IF;
    
    -- Verificar y agregar ip_address
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_sessions' AND column_name = 'ip_address') THEN
        ALTER TABLE user_sessions ADD COLUMN ip_address INET;
    END IF;
    
    -- Verificar y agregar user_agent
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_sessions' AND column_name = 'user_agent') THEN
        ALTER TABLE user_sessions ADD COLUMN user_agent TEXT;
    END IF;
    
    -- Verificar y agregar expires_at
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_sessions' AND column_name = 'expires_at') THEN
        ALTER TABLE user_sessions ADD COLUMN expires_at TIMESTAMP NOT NULL DEFAULT (CURRENT_TIMESTAMP + INTERVAL '8 hours');
    END IF;
    
    -- Verificar y agregar last_activity
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_sessions' AND column_name = 'last_activity') THEN
        ALTER TABLE user_sessions ADD COLUMN last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;
    
    -- Verificar y agregar is_active
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_sessions' AND column_name = 'is_active') THEN
        ALTER TABLE user_sessions ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Insertar configuración por defecto para usuarios existentes que no la tengan
INSERT INTO session_settings (user_id, max_sessions, session_timeout_hours, require_2fa, allow_concurrent_sessions)
SELECT 
    id,
    5,
    8,
    false,
    true
FROM users
WHERE id NOT IN (SELECT user_id FROM session_settings WHERE user_id IS NOT NULL)
ON CONFLICT (user_id) DO NOTHING;
