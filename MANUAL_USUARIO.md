# Manual de Usuario - Sistema de Volantes de Servicio

## Guía Rápida por Rol

### 👨‍🔧 TÉCNICOS

#### Crear un Volante de Servicio
1. **Iniciar sesión** con tus credenciales
2. **Ir a "Volantes"** → **"Crear Volante"**
3. **Completar información**:
   - **Cliente**: Nombre y teléfono
   - **Localidad**: Seleccionar de la lista
   - **Tipo de servicio**: Mantenimiento, Cambio repuestos, etc.
   - **Descripción**: Detalle del trabajo realizado
   - **Repuestos**: Seleccionar si se cambiaron partes
   - **Estado**: ¿Queda algo pendiente?
4. **Firmar** en el recuadro correspondiente
5. **Solicitar firma del cliente**
6. **Enviar volante** ✅

#### Ver Historial de Volantes
- **Dashboard** → Ver tus volantes recientes
- **Volantes** → Ver lista completa
- **Filtrar** por fecha, estado, localidad

#### Imprimir Volante
- **Abrir volante** → **Botón "Imprimir"**
- Se abre versión para impresión con logo de empresa

---

### 👨‍💼 ADMINISTRADORES

#### Dashboard Principal
- **Estadísticas** en tiempo real
- **Volantes pendientes** que requieren atención
- **Rendimiento** de técnicos
- **Notificaciones** importantes

#### Gestionar Volantes
- **Ver todos** los volantes del sistema
- **Filtrar** por técnico, fecha, estado
- **Revisar detalles** completos
- **Imprimir** cualquier volante

#### Centro de Notificaciones
- **Campana** en esquina superior derecha
- **Recordatorios** automáticos
- **Escalamientos** de volantes críticos
- **Marcar como leído**

---

### 👨‍💻 SUPER ADMINISTRADORES

#### Gestión de Usuarios
1. **Admin** → **Usuarios** → **Crear Usuario**
2. **Completar datos**:
   - Nombre completo
   - Email (será el usuario)
   - Contraseña temporal
   - Rol (Técnico/Administrador)
3. **Activar/Desactivar** usuarios existentes

#### Gestión de Localidades
1. **Admin** → **Localidades** → **Crear Localidad**
2. **Información requerida**:
   - Nombre de la localidad
   - Dirección completa
   - Persona de contacto
   - Teléfono
3. **Activar/Desactivar** localidades

#### Gestión de Repuestos
1. **Admin** → **Repuestos** → **Crear Repuesto**
2. **Datos del repuesto**:
   - Código único
   - Nombre/descripción
   - Categoría
   - Precio (opcional)
3. **Organizar por categorías**

#### Configuración de Notificaciones
- **Tiempos de recordatorio** personalizables
- **Escalamiento automático**
- **Tipos de notificaciones**

---

## Flujos de Trabajo Típicos

### 🔄 Servicio Técnico Completo
1. **Técnico recibe asignación** de servicio
2. **Se dirige a la localidad**
3. **Realiza el trabajo** (mantenimiento/reparación)
4. **Crea volante** en el sistema
5. **Cliente firma** conformidad
6. **Sistema envía email** automáticamente
7. **Administrador recibe** notificación
8. **Seguimiento** si queda pendiente

### 🚨 Escalamiento de Problemas
1. **Volante marcado** como "Requiere Seguimiento"
2. **Sistema genera** recordatorio a 24h
3. **Si no se resuelve** → Escalamiento a 72h
4. **Administrador recibe** notificación crítica
5. **Seguimiento manual** del caso

### 📊 Generación de Reportes
1. **Dashboard administrativo**
2. **Filtros por período** de tiempo
3. **Estadísticas por técnico**
4. **Análisis de localidades**
5. **Reportes de repuestos**

---

## Consejos y Mejores Prácticas

### ✅ Para Técnicos
- **Completar volantes** inmediatamente después del servicio
- **Ser específico** en las descripciones
- **Verificar firma** del cliente antes de enviar
- **Marcar correctamente** si queda trabajo pendiente
- **Revisar notificaciones** regularmente

### ✅ Para Administradores
- **Monitorear dashboard** diariamente
- **Revisar volantes pendientes** semanalmente
- **Seguir escalamientos** críticos
- **Generar reportes** mensuales
- **Mantener catálogos** actualizados

### ✅ Para Super Administradores
- **Crear usuarios** con contraseñas seguras
- **Mantener localidades** actualizadas
- **Revisar catálogo** de repuestos regularmente
- **Configurar notificaciones** según necesidades
- **Hacer respaldos** periódicos

---

## Preguntas Frecuentes

### ❓ ¿Puedo editar un volante después de enviarlo?
**No**, los volantes son inmutables una vez enviados para mantener integridad.

### ❓ ¿Qué pasa si olvido mi contraseña?
Contactar al **Super Administrador** para reseteo de contraseña.

### ❓ ¿Cómo agregar una nueva localidad?
Solo **Super Administradores** pueden crear localidades desde el panel admin.

### ❓ ¿El sistema funciona offline?
**No**, requiere conexión a internet para sincronizar datos.

### ❓ ¿Puedo usar el sistema en móvil?
**Sí**, la interfaz es responsive y funciona en tablets y móviles.

### ❓ ¿Cómo imprimir múltiples volantes?
Desde el panel administrativo, seleccionar volantes y usar función de impresión.

### ❓ ¿Las firmas son legalmente válidas?
Las firmas digitales tienen validez según la legislación local de firma electrónica.

---

## Atajos de Teclado

- **Ctrl + N**: Crear nuevo volante (en página de volantes)
- **Ctrl + P**: Imprimir volante actual
- **Esc**: Cerrar modales/formularios
- **Tab**: Navegar entre campos de formulario

---

## Soporte Técnico

### 🆘 Problemas Comunes
1. **No puedo iniciar sesión**
   - Verificar usuario y contraseña
   - Contactar administrador

2. **La firma no funciona**
   - Verificar que JavaScript esté habilitado
   - Probar con otro navegador

3. **No recibo emails**
   - Verificar carpeta de spam
   - Contactar administrador del sistema

4. **El sistema está lento**
   - Verificar conexión a internet
   - Cerrar otras aplicaciones

### 📞 Contacto
Para soporte técnico, contactar al administrador del sistema o al departamento de IT de la empresa.
