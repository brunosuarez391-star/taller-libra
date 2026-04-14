# Integración del skill `faq-taller-libra` con el Agente 4 (WhatsApp)

Guía paso a paso para incorporar este skill al workflow n8n del Agente 4.

## Opción 1 — Inline en el system prompt (más simple)

1. Abrí el workflow **"Agente 4 — WhatsApp Cloud API + Claude"** en n8n
2. Hacé doble click en el nodo **HTTP Request → Claude**
3. En el campo `jsonBody`, buscá el `system` prompt
4. Reemplazalo con todo el contenido de `SKILL.md` (sin el frontmatter de YAML)
5. Guardá y publicá

## Opción 2 — Variable de entorno (recomendado)

Más mantenible: el skill vive en una variable y se referencia por nombre.

### Paso 1 — Crear la variable en n8n

1. n8n → **Settings** → **Variables**
2. **Crear variable nueva**:
   - Key: `SKILL_FAQ_LIBRA`
   - Value: pegá el contenido del `SKILL.md` (sin frontmatter YAML)

### Paso 2 — Modificar el system prompt del Agente 4

En el HTTP Request a Claude, cambiar el `system` por:

```
={{ $vars.SKILL_FAQ_LIBRA }}
```

Y opcionalmente sumarle contexto dinámico:

```
={{ $vars.SKILL_FAQ_LIBRA + '\n\n## Contexto de la conversación actual\n\nNombre del cliente: ' + $json.profile_name + '\nNúmero: ' + $json.from + '\nFecha y hora: ' + new Date().toLocaleString('es-AR') }}
```

## Opción 3 — Fetch desde GitHub (siempre fresco)

Antes del nodo de Claude, agregar un **HTTP Request GET**:

- URL: `https://raw.githubusercontent.com/brunosuarez391-star/taller-libra/main/skills/faq-taller-libra/SKILL.md`
- Output: `{{ $node["Fetch Skill"].json.data }}`

Después en el system del Claude:
```
={{ $node["Fetch Skill"].json + '\n\n## Mensaje actual\n' + $json.message }}
```

**Pros**: cada cambio en el repo se aplica al instante sin tocar n8n.
**Contras**: suma ~200ms de latencia y depende de GitHub.

## Cómo testear

Una vez integrado:

1. **Mensaje de prueba 1** — consulta de precio:
   > "Hola, cuánto sale cambiar pastillas de freno de un Corsa?"

   Respuesta esperada: rango orientativo + invitación a presupuesto + pedido
   de nombre.

2. **Mensaje de prueba 2** — consulta de service de camión:
   > "Hola necesito service de un MB 1634"

   Respuesta esperada: precio aprox $1.023.946 + IVA con detalle de qué
   incluye, mención a Jones SRL.

3. **Mensaje de prueba 3** — fuera de scope:
   > "Hacen tapizado de asientos?"

   Respuesta esperada: deriva amablemente a otro proveedor.

4. **Mensaje de prueba 4** — queja:
   > "El service que me hicieron no anduvo, qué hago?"

   Respuesta esperada: empatía + pedido de número de OT + escalamiento a Bruno.

## Mantenimiento del skill

- **Cuando cambien precios**: editar la sección "Precios orientativos"
- **Cuando cambien horarios**: editar la sección "Horarios"
- **Cuando cambien servicios**: editar las listas "SÍ/NO hacemos"
- **Cuando agregues empresas cliente**: agregar a la sección de flotas

Después de editar:
- Si usás la **opción 2** (variable n8n) → actualizar la variable manualmente
- Si usás la **opción 3** (fetch GitHub) → solo commit y push, el agente
  lo lee en la próxima consulta

## Métricas a observar

Después de 1 semana con el skill activo, revisar en n8n las ejecuciones del
Agente 4:

- ✅ **Tasa de respuestas útiles** — (subjetivo) ¿el cliente avanza al
  siguiente paso?
- ✅ **Cantidad de derivaciones a Bruno** — debería bajar para consultas
  rutinarias y subir para casos legítimamente complejos
- ✅ **Conversiones a turno/presupuesto** — más fácil de medir si el agente
  registra cuando alguien pide un turno
- ✅ **Errores de info** — si el agente da algún dato incorrecto, agregarlo
  al SKILL.md como caso conocido
