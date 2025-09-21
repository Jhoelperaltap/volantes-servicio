-- Consultar las columnas de cada tabla existente
SELECT 'users' as table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

SELECT 'locations' as table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'locations' 
ORDER BY ordinal_position;

SELECT 'service_tickets' as table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'service_tickets' 
ORDER BY ordinal_position;

SELECT 'notifications' as table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'notifications' 
ORDER BY ordinal_position;

SELECT 'parts' as table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'parts' 
ORDER BY ordinal_position;

SELECT 'company_settings' as table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'company_settings' 
ORDER BY ordinal_position;

SELECT 'notification_settings' as table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'notification_settings' 
ORDER BY ordinal_position;
