# Guía: Generar Token Permanente de WhatsApp Cloud API

**Última actualización**: 15 de abril de 2026
**Para**: Libra Servicios Industriales — Agente 4 n8n

---

## ¿Por qué necesito esto?

El token temporal que Meta da por defecto **vence a las 24 horas**. Cada
día hay que renovarlo, y el Agente 4 (chatbot WhatsApp) deja de responder
mensajes reales hasta que se actualice.

**Solución**: crear un **System User** con rol Admin y generarle un
token que **nunca vence**.

---

## Paso a paso (5 minutos)

### 1. Entrar a Meta Business Settings

Abrí en el navegador (logueado con tu cuenta que maneja @chapaypinturaslibra):

👉 **https://business.facebook.com/settings/system-users**

### 2. Crear o seleccionar el System User

**Si no existe ninguno**:
- Click **"Agregar"** (botón azul arriba a la derecha)
- **Nombre**: `n8n Libra Bot`
- **Rol del sistema**: **Admin** ⚠️ (importante, NO "Empleado")
- Click **"Crear usuario del sistema"**

**Si ya existe**: seleccionalo de la lista.

### 3. Asignar la app al System User

Con el System User seleccionado, a la derecha:

- Click **"Agregar activos"**
- Tipo de activo: **Apps**
- Seleccioná la app `libra chapa y pintura` (ID: `1518258359606441`)
- Marcá **"Control total"**
- Click **"Guardar cambios"**

### 4. Generar el token

- Click **"Generar nuevo token"** (al lado del botón anterior)
- **Seleccionar app**: la misma app
- **Caducidad del token**: **"Nunca"** ⚠️ (muy importante)
- **Permisos disponibles**, marcá solo estas 2:
  - ✅ `whatsapp_business_messaging`
  - ✅ `whatsapp_business_management`
- Click **"Generar token"**

### 5. Copiar el token

Te va a mostrar el token en un recuadro. **Copialo completo** (empieza con
`EAA...` y tiene unos 200 caracteres). Guardalo en un lugar seguro —
Meta NO te lo va a volver a mostrar.

---

## Cómo cargarlo en n8n

### Opción A — Rápida (lo hacés vos)

1. Ir a n8n → workflow **"Agente 4 — WhatsApp Cloud API + Claude"**
2. Abrir el nodo **"WhatsApp Cloud API"**
3. En la sección **Headers**, encontrá `Authorization`
4. Reemplazar el valor actual `Bearer EAAVk2...` por `Bearer <tu_token_nuevo>`
5. **Save** y **Publish**

### Opción B — Me lo pasás y lo hago yo

Pegame el token en el chat y lo actualizo automáticamente en el workflow
desde el SDK.

---

## Verificar que funciona

Mandá un WhatsApp de prueba a **+54 297-4773784** desde tu celular con:

> "Hola, cuánto sale cambiar pastillas de freno de un Corsa 2015?"

Deberías recibir respuesta en segundos **sin ningún precio en pesos**,
pidiéndote que lo lleves al taller o mandes fotos para presupuesto.

Si recibís respuesta → ✅ token permanente andando.
Si no recibís nada → chequear en n8n si hubo error 401 (token inválido).

---

## Importante

- **El token permanente NO caduca**, pero sí puede revocarse si cambiás
  la contraseña de la cuenta Meta o si alguien lo reporta como filtrado.
- **NUNCA lo compartas** en redes, capturas públicas, ni lo subas a GitHub.
- Si sospechás que se filtró, volvé a `business.facebook.com/settings/system-users`
  y revocalo + generá otro.

---

*Skill mantenido por Bruno Suárez · Libra Servicios Industriales*
