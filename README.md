... existing code ...

## Instalación y Configuración

### ⚠️ IMPORTANTE PARA PRODUCCIÓN

**Este sistema está listo para producción. NO contiene datos ficticios.**

Para instalación completa en servidor de producción, consulte:
- **INSTALACION_PRODUCCION.md** - Manual completo de instalación
- **MANUAL_USUARIO.md** - Guía de uso del sistema

### Requisitos Previos
- Node.js 18+ 
- Base de datos PostgreSQL
- Servidor web (Nginx recomendado)

### Variables de Entorno Requeridas
\`\`\`env
# JWT Secret para autenticación (OBLIGATORIO)
JWT_SECRET=generar_jwt_secret_seguro_de_64_caracteres

# Base de datos PostgreSQL (OBLIGATORIO)
DATABASE_URL=postgresql://usuario:password@localhost:5432/volantes_db

# Email para envío de volantes (OPCIONAL)
SMTP_HOST=smtp.suproveedor.com
SMTP_PORT=587
SMTP_USER=notificaciones@SUDOMINIO.COM
SMTP_PASS=password_aplicacion_email

# Configuración de empresa (PERSONALIZAR)
NEXT_PUBLIC_COMPANY_NAME=SU EMPRESA S.A.
NEXT_PUBLIC_COMPANY_ADDRESS=Dirección de su empresa
NEXT_PUBLIC_COMPANY_PHONE=+1234567890
NEXT_PUBLIC_COMPANY_EMAIL=contacto@SUDOMINIO.COM
\`\`\`

### Instalación Rápida (Desarrollo)

1. **Instalar dependencias**:
   \`\`\`bash
   npm install
   \`\`\`
2. **Configurar variables de entorno**:
   - Crear archivo `.env.local`
   - Agregar `JWT_SECRET` (obligatorio)
3. **Ejecutar scripts de base de datos**:
   - Personalizar `scripts/02-seed-initial-data.sql` con sus datos
   - Ejecutar scripts en PostgreSQL
4. **Iniciar aplicación**:
   \`\`\`bash
   npm run dev
   \`\`\`

## Configuración Inicial del Sistema

### 1. Primer Acceso
- **Usuario**: El configurado en `scripts/02-seed-initial-data.sql`
- **Contraseña**: La generada con bcrypt para su usuario
- **Rol**: Super Administrador

### 2. Configuración Obligatoria
1. **Cambiar contraseña** del administrador
2. **Crear técnicos** desde Admin → Usuarios
3. **Agregar localidades** desde Admin → Localidades
4. **Crear catálogo de repuestos** desde Admin → Repuestos
5. **Configurar notificaciones** desde Admin → Notificaciones

### 3. Personalización de Empresa
1. **Actualizar información** en variables de entorno
2. **Reemplazar logo** en `public/logo-empresa.png`
3. **Personalizar colores** en `app/globals.css` (opcional)

... existing code ...

### Información de Empresa
Editar variables de entorno o actualizar en:
\`\`\`tsx
// components/volantes/printable-ticket.tsx
const COMPANY_INFO = {
  name: process.env.NEXT_PUBLIC_COMPANY_NAME || "SU EMPRESA",
  address: process.env.NEXT_PUBLIC_COMPANY_ADDRESS || "Dirección",
  phone: process.env.NEXT_PUBLIC_COMPANY_PHONE || "Teléfono",
  email: process.env.NEXT_PUBLIC_COMPANY_EMAIL || "Email"
}
\`\`\`

... existing code ...

**⚠️ SISTEMA LISTO PARA PRODUCCIÓN - SIN DATOS FICTICIOS**
\`\`\`

```json file="" isHidden
