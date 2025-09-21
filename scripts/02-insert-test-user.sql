-- Insertar usuario de prueba
INSERT INTO users (email, password_hash, name, role, is_active) 
VALUES (
    'Jhoelp@ejsupportit.com',
    '$2a$10$jOOMUHzCxukz.eMKAHbqcO/hK/GXbb23P37I/tyBbOrtu1/TEJkUq',
    'Admin',
    'super_admin',
    true
) ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active,
    updated_at = CURRENT_TIMESTAMP;
