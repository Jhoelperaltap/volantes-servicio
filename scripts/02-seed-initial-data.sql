-- Eliminando email ficticio y usando placeholder más claro
-- Script de configuración inicial para producción
-- IMPORTANTE: Este script debe ser personalizado con los datos reales de su empresa

-- Insertar configuración inicial de la empresa (PERSONALIZAR CON SUS DATOS)
INSERT INTO company_settings (company_name, company_address, company_phone, company_email) 
VALUES (
    'SU EMPRESA AQUÍ',
    'DIRECCIÓN DE SU EMPRESA',
    'TELÉFONO DE SU EMPRESA',
    'EMAIL DE SU EMPRESA'
);

-- IMPORTANTE: Crear el primer usuario administrador
-- DEBE cambiar el email y generar un hash de contraseña seguro
-- Para generar el hash: usar bcrypt con la contraseña deseada
INSERT INTO users (email, password_hash, name, role) 
VALUES (
    'ADMIN_EMAIL_AQUI@SUDOMINIO.COM', -- CAMBIAR POR SU EMAIL REAL
    '$2b$10$HASH_DE_CONTRASEÑA_AQUÍ', -- GENERAR HASH REAL CON BCRYPT
    'Administrador Principal', -- CAMBIAR POR SU NOMBRE
    'super_admin'
);

-- Las localidades y repuestos deben agregarse manualmente desde el panel de administración
-- NO incluir datos de ejemplo en producción
