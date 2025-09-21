-- Verificar que el usuario existe
SELECT id, email, name, role, is_active, created_at 
FROM users 
WHERE email = 'Jhoelp@ejsupportit.com';
