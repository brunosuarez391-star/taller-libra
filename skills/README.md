# Skills — Sistema IA Taller Libra

Esta carpeta contiene **skills** (knowledge base reutilizable) para los agentes
del sistema. Cada skill es una carpeta con un `SKILL.md` que define instrucciones
y contexto especializado de un dominio.

## Cómo se usa

Los skills se inyectan en el **system prompt** del agente n8n correspondiente.
La forma más simple es copiar el contenido del `SKILL.md` y pegarlo en el campo
`system` del nodo HTTP Request que llama a la API de Claude.

Para evitar duplicación, podés:

1. **Inline directo** (lo más simple) — pegás el `SKILL.md` en el system prompt.
2. **Variable de n8n** — guardás el skill como una variable de entorno y la
   referenciás con `$env.SKILL_FAQ_LIBRA` en el body del HTTP Request.
3. **Hosted en GitHub** — el agente hace fetch del raw URL antes de cada
   ejecución (más fresco pero suma latencia).

## Skills disponibles

| Skill | Carpeta | Para qué agente | Estado |
|---|---|---|---|
| **FAQ Taller Libra** | `faq-taller-libra/` | Agente 4 WhatsApp, Agente 6 Gestión | ✅ Listo |
| **Vencimientos AFIP 2026** | `vencimientos-afip-2026/` | Agente 9 CPN Contable | ✅ Listo |
| **Catálogo Jones SRL** | `catalogo-jones-srl/` | Agente F2 Presupuestos Flota, Agentes F1 + 3 | ✅ Listo |
| **Brand Libra** | `brand-libra/` | Agentes 1, 8, 10 (marketing) | ✅ Listo |
| **Mapa de Agentes** | `mapa-agentes-libra/` | Bus de Eventos Coordinador | ✅ Listo |
| (próximos) | | | |

## Convenciones

- Cada carpeta tiene un `SKILL.md` con el contenido principal
- Los datos sensibles (precios actuales, vencimientos) se actualizan editando
  el archivo y pusheando — Vercel o n8n los re-leen al próximo ciclo
- El tono es siempre español argentino, formal-cercano (como Bruno habla)
- Los skills NO ejecutan código, solo proveen contexto al modelo

## Cómo crear un skill nuevo

```
skills/
└── nombre-del-skill/
    └── SKILL.md       ← contenido principal
    └── ejemplos.md    ← (opcional) ejemplos few-shot
    └── datos.json     ← (opcional) datos estructurados
```

El `SKILL.md` debe empezar con un frontmatter mínimo:

```markdown
---
name: nombre-del-skill
description: Una línea explicando qué hace este skill
target_agents: ["Agente 4 WhatsApp", "Agente 6 Gestión"]
last_updated: 2026-04-14
---

# Título del skill

Contenido...
```
