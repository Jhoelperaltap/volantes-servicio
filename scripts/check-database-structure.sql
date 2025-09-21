-- Script para verificar la estructura actual de las tablas
-- Esto nos ayudará a entender qué columnas existen realmente

-- Verificar estructura de la tabla users
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- Verificar estructura de la tabla locations
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'locations' 
ORDER BY ordinal_position;

-- Verificar estructura de la tabla service_tickets
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'service_tickets' 
ORDER BY ordinal_position;

-- Verificar estructura de la tabla parts
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'parts' 
ORDER BY ordinal_position;

-- Verificar estructura de la tabla notifications
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'notifications' 
ORDER BY ordinal_position;

-- Mostrar todas las tablas existentes
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
