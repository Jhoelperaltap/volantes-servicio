-- =====================================================
-- JOB AUTOMÁTICO PARA LIMPIEZA DE SESIONES
-- =====================================================

-- Crear función para ejecutar limpieza automática
CREATE OR REPLACE FUNCTION auto_cleanup_sessions()
RETURNS void AS $$
BEGIN
    -- Ejecutar limpieza de sesiones expiradas
    PERFORM cleanup_expired_sessions();
    
    -- Log de la limpieza (opcional)
    RAISE NOTICE 'Limpieza automática de sesiones ejecutada en %', CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- Nota: Para programar la ejecución automática, se puede usar:
-- 1. pg_cron (extensión de PostgreSQL)
-- 2. Cron job del sistema operativo
-- 3. Scheduler de la aplicación (recomendado)

-- Ejemplo con pg_cron (si está disponible):
-- SELECT cron.schedule('cleanup-sessions', '0 */6 * * *', 'SELECT auto_cleanup_sessions();');

-- Para ejecutar manualmente:
-- SELECT auto_cleanup_sessions();
