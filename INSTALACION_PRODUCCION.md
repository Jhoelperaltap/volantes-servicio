# Manual de Instalación para Producción
## Sistema de Volantes de Servicio Técnico

### 📋 REQUISITOS DEL SISTEMA

#### Servidor
- **Sistema Operativo**: Linux (Ubuntu 20.04+ recomendado) o Windows Server
- **Node.js**: Versión 18.0 o superior
- **RAM**: Mínimo 2GB, recomendado 4GB
- **Almacenamiento**: Mínimo 10GB libres
- **Red**: Conexión a internet estable

#### Base de Datos
- **PostgreSQL**: Versión 12 o superior
- **Espacio**: Mínimo 1GB para base de datos
- **Conexiones**: Configurar pool de conexiones (recomendado 20-50)

#### Navegadores Compatibles
- Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

---

### 🔧 INSTALACIÓN PASO A PASO

#### 1. PREPARACIÓN DEL SERVIDOR

\`\`\`bash
# Actualizar sistema (Ubuntu/Debian)
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verificar instalación
node --version  # Debe mostrar v18.x.x
npm --version   # Debe mostrar 9.x.x o superior
\`\`\`

#### 2. INSTALACIÓN DE POSTGRESQL

\`\`\`bash
# Instalar PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Iniciar servicio
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Crear base de datos y usuario
sudo -u postgres psql
\`\`\`

\`\`\`sql
-- En el prompt de PostgreSQL:
CREATE DATABASE volantes_servicio;
CREATE USER volantes_user WITH ENCRYPTED PASSWORD 'PASSWORD_SEGURO_AQUÍ';
GRANT ALL PRIVILEGES ON DATABASE volantes_servicio TO volantes_user;
\q
\`\`\`

#### 3. CONFIGURACIÓN DEL PROYECTO

\`\`\`bash
# Crear directorio del proyecto
sudo mkdir -p /var/www/volantes-servicio
cd /var/www/volantes-servicio

# Descargar/copiar archivos del proyecto aquí
# (usar git clone, scp, o método preferido)

# Instalar dependencias
npm install

# Crear archivo de configuración
sudo nano .env.local
\`\`\`

#### 4. CONFIGURACIÓN DE VARIABLES DE ENTORNO

Crear archivo `.env.local` con el siguiente contenido:

\`\`\`env
# === CONFIGURACIÓN OBLIGATORIA ===

# JWT Secret - GENERAR UNO ÚNICO Y SEGURO
JWT_SECRET=SU_JWT_SECRET_MUY_SEGURO_DE_64_CARACTERES_MINIMO_AQUÍ

# Base de datos PostgreSQL
DATABASE_URL=postgresql://volantes_user:PASSWORD_SEGURO_AQUÍ@localhost:5432/volantes_servicio

# === CONFIGURACIÓN OPCIONAL ===

# Email para envío de volantes (opcional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=notificaciones@suempresa.com
SMTP_PASS=password_email_aplicacion

# Configuración de producción
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://sudominio.com

# === CONFIGURACIÓN DE EMPRESA ===
NEXT_PUBLIC_COMPANY_NAME=SU EMPRESA S.A.
NEXT_PUBLIC_COMPANY_ADDRESS=Dirección completa de su empresa
NEXT_PUBLIC_COMPANY_PHONE=+1234567890
NEXT_PUBLIC_COMPANY_EMAIL=contacto@suempresa.com
\`\`\`

#### 5. CONFIGURACIÓN DE BASE DE DATOS

\`\`\`bash
# Ejecutar scripts de creación de tablas
psql -h localhost -U volantes_user -d volantes_servicio -f scripts/01-create-database-schema.sql

# IMPORTANTE: Personalizar datos iniciales
nano scripts/02-seed-initial-data.sql
# Editar con los datos reales de su empresa

# Ejecutar datos iniciales
psql -h localhost -U volantes_user -d volantes_servicio -f scripts/02-seed-initial-data.sql

# Configurar funciones de notificaciones
psql -h localhost -U volantes_user -d volantes_servicio -f scripts/03-notification-processor.sql
\`\`\`

#### 6. GENERAR CONTRASEÑA SEGURA PARA ADMINISTRADOR

\`\`\`bash
# Instalar bcrypt globalmente para generar hash
npm install -g bcrypt-cli

# Generar hash de contraseña (reemplazar 'SU_CONTRASEÑA' por la real)
bcrypt-cli 'SU_CONTRASEÑA_SEGURA' 10

# Copiar el hash generado y actualizar en la base de datos:
psql -h localhost -U volantes_user -d volantes_servicio
\`\`\`

\`\`\`sql
-- Actualizar contraseña del administrador
UPDATE users 
SET password_hash = '$2b$10$HASH_GENERADO_AQUÍ' 
WHERE email = 'admin@suempresa.com';
\`\`\`

#### 7. CONFIGURAR LOGO DE EMPRESA

\`\`\`bash
# Copiar logo de empresa (formato PNG, 200x80px recomendado)
cp /ruta/a/su/logo.png public/logo-empresa.png

# Ajustar permisos
chmod 644 public/logo-empresa.png
\`\`\`

#### 8. COMPILAR PARA PRODUCCIÓN

\`\`\`bash
# Compilar aplicación
npm run build

# Verificar que no hay errores
npm run start
\`\`\`

---

### 🚀 CONFIGURACIÓN DE SERVIDOR WEB

#### Opción A: PM2 (Recomendado)

\`\`\`bash
# Instalar PM2
sudo npm install -g pm2

# Crear archivo de configuración
nano ecosystem.config.js
\`\`\`

\`\`\`javascript
module.exports = {
  apps: [{
    name: 'volantes-servicio',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/volantes-servicio',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    instances: 'max',
    exec_mode: 'cluster',
    watch: false,
    max_memory_restart: '1G',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
}
\`\`\`

\`\`\`bash
# Crear directorio de logs
mkdir logs

# Iniciar aplicación
pm2 start ecosystem.config.js

# Configurar inicio automático
pm2 startup
pm2 save
\`\`\`

#### Opción B: Nginx como Proxy Reverso

\`\`\`bash
# Instalar Nginx
sudo apt install nginx -y

# Crear configuración
sudo nano /etc/nginx/sites-available/volantes-servicio
\`\`\`

\`\`\`nginx
server {
    listen 80;
    server_name sudominio.com www.sudominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
\`\`\`

\`\`\`bash
# Habilitar sitio
sudo ln -s /etc/nginx/sites-available/volantes-servicio /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
\`\`\`

---

### 🔒 CONFIGURACIÓN DE SEGURIDAD

#### 1. Firewall

\`\`\`bash
# Configurar UFW
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
\`\`\`

#### 2. SSL/HTTPS con Let's Encrypt

\`\`\`bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtener certificado
sudo certbot --nginx -d sudominio.com -d www.sudominio.com

# Verificar renovación automática
sudo certbot renew --dry-run
\`\`\`

#### 3. Respaldos Automáticos

\`\`\`bash
# Crear script de respaldo
sudo nano /usr/local/bin/backup-volantes.sh
\`\`\`

\`\`\`bash
#!/bin/bash
BACKUP_DIR="/var/backups/volantes-servicio"
DATE=$(date +%Y%m%d_%H%M%S)

# Crear directorio de respaldos
mkdir -p $BACKUP_DIR

# Respaldar base de datos
pg_dump -h localhost -U volantes_user volantes_servicio > $BACKUP_DIR/db_backup_$DATE.sql

# Respaldar archivos de aplicación
tar -czf $BACKUP_DIR/app_backup_$DATE.tar.gz /var/www/volantes-servicio

# Limpiar respaldos antiguos (mantener 7 días)
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
\`\`\`

\`\`\`bash
# Hacer ejecutable
sudo chmod +x /usr/local/bin/backup-volantes.sh

# Programar respaldo diario
sudo crontab -e
# Agregar línea:
0 2 * * * /usr/local/bin/backup-volantes.sh
\`\`\`

---

### 📊 MONITOREO Y MANTENIMIENTO

#### 1. Logs del Sistema

\`\`\`bash
# Ver logs de PM2
pm2 logs volantes-servicio

# Ver logs de Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Ver logs de PostgreSQL
sudo tail -f /var/log/postgresql/postgresql-*.log
\`\`\`

#### 2. Monitoreo de Recursos

\`\`\`bash
# Instalar htop para monitoreo
sudo apt install htop -y

# Ver uso de recursos
htop

# Ver estado de servicios
sudo systemctl status postgresql
sudo systemctl status nginx
pm2 status
\`\`\`

#### 3. Actualizaciones

\`\`\`bash
# Actualizar dependencias (con precaución)
npm audit
npm update

# Recompilar después de actualizaciones
npm run build
pm2 restart volantes-servicio
\`\`\`

---

### 🔧 CONFIGURACIÓN INICIAL DEL SISTEMA

#### 1. Primer Acceso

1. Abrir navegador en `https://sudominio.com`
2. Usar credenciales configuradas en la base de datos:
   - **Email**: admin@suempresa.com (el que configuró)
   - **Contraseña**: La que generó con bcrypt

#### 2. Configuración Inicial Obligatoria

1. **Cambiar contraseña del administrador**
2. **Crear usuarios técnicos**:
   - Ir a Admin → Usuarios
   - Crear cuenta para cada técnico
   - Asignar rol "tecnico"
3. **Configurar localidades**:
   - Ir a Admin → Localidades
   - Agregar todas las ubicaciones donde brindan servicio
4. **Crear catálogo de repuestos**:
   - Ir a Admin → Repuestos
   - Agregar todos los repuestos que usan
   - Organizar por categorías

#### 3. Configuración de Notificaciones

1. Ir a Admin → Notificaciones
2. Configurar tiempos de escalamiento:
   - **Recordatorio**: 24 horas (recomendado)
   - **Escalamiento**: 72 horas (recomendado)
   - **Crítico**: 120 horas (recomendado)

---

### ⚠️ SOLUCIÓN DE PROBLEMAS

#### Problema: No se puede conectar a la base de datos
\`\`\`bash
# Verificar estado de PostgreSQL
sudo systemctl status postgresql

# Verificar conexión
psql -h localhost -U volantes_user -d volantes_servicio -c "SELECT 1;"

# Revisar logs
sudo tail -f /var/log/postgresql/postgresql-*.log
\`\`\`

#### Problema: Error de JWT
\`\`\`bash
# Verificar variable de entorno
echo $JWT_SECRET

# Regenerar JWT_SECRET si es necesario
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
\`\`\`

#### Problema: Aplicación no inicia
\`\`\`bash
# Verificar logs
pm2 logs volantes-servicio

# Verificar puerto
sudo netstat -tlnp | grep :3000

# Reiniciar aplicación
pm2 restart volantes-servicio
\`\`\`

#### Problema: Emails no se envían
\`\`\`bash
# Verificar configuración SMTP en .env.local
# Probar conexión SMTP manualmente
telnet smtp.gmail.com 587
\`\`\`

---

### 📞 SOPORTE POST-INSTALACIÓN

#### Lista de Verificación Final

- [ ] Base de datos PostgreSQL funcionando
- [ ] Aplicación compilada sin errores
- [ ] PM2 ejecutando la aplicación
- [ ] Nginx configurado (si aplica)
- [ ] SSL/HTTPS funcionando
- [ ] Respaldos automáticos configurados
- [ ] Primer usuario administrador creado
- [ ] Localidades y repuestos configurados
- [ ] Notificaciones configuradas
- [ ] Logo de empresa actualizado

#### Información de Contacto

- **Documentación técnica**: Ver README.md
- **Manual de usuario**: Ver MANUAL_USUARIO.md
- **Logs del sistema**: `/var/www/volantes-servicio/logs/`
- **Respaldos**: `/var/backups/volantes-servicio/`

---

**IMPORTANTE**: Guarde este manual y las credenciales en un lugar seguro. Realice respaldos regulares y mantenga el sistema actualizado.

**Versión**: 1.0.0 - Producción  
**Fecha**: Diciembre 2024
\`\`\`

```json file="" isHidden
