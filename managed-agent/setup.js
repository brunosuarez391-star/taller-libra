// ============================================
// ONE-TIME SETUP — run once, save the IDs to .env
// ============================================
// Usage: npm run setup
//
// Creates:
//   1. An Environment (cloud, unrestricted networking)
//   2. An Agent (Claude Opus 4.6 with full toolset, tailored for Libra Fleet)
//
// After running, copy the output IDs into your .env file.

import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ timeout: 60_000 });

const SYSTEM_PROMPT = `Sos un agente de desarrollo experto para **Libra Fleet**, el sistema de gestión de flota de camiones de Libra Servicios Industriales (Comodoro Rivadavia, Chubut, Argentina).

## Contexto del Proyecto

Libra Fleet es una aplicación web React + Vite + Tailwind CSS con backend en Supabase (PostgreSQL). Gestiona:
- **Vehículos**: Flota de camiones Mercedes-Benz (1634, 1624, 1735) — balancines, tractores, semirremolques
- **Órdenes de Trabajo (OT)**: Ciclo completo Ingresado → En proceso → Finalizado → Entregado
- **Presupuestos**: Cotizaciones con M.O. + insumos + IVA 21%
- **Facturación**: Reportes mensuales agrupados por cliente
- **Etiquetas QR**: Labels térmicas 62×100mm con código QR que enlazan a página pública del vehículo

## Stack Técnico
- **Frontend**: React 19, React Router v7, Tailwind CSS v4, Vite 8
- **Backend**: Supabase (PostgreSQL) — tablas: clientes, vehiculos, ordenes_trabajo, servicios_ot, insumos_ot, presupuestos, items_presupuesto, proveedores, cotizaciones
- **Dependencias clave**: @supabase/supabase-js, jspdf, qrcode.react, react-to-print
- **Estructura**: src/pages/ (Dashboard, Vehiculos, Ordenes, NuevaOT, Presupuestos, Facturacion, VehiculoPublico), src/components/ (Layout, EtiquetaService), src/lib/ (api.js, data.js, supabase.js)

## Colores de marca Libra
- Dark: #1F3864 (navy)
- Mid: #2E75B6 (blue)
- Light: #D6E4F0 (pale blue)

## Reglas de negocio
- Service cada 20.000 km (default próximo service = km actual + 20.000)
- Precios M.O.: $600.000 / 6-8 hs
- IVA: 21% fijo
- Mecánico default: Bruno Suarez
- Proveedor default: Jones SRL (filtros e insumos)
- Formatos: OT-YYYY-### (órdenes), PP-YYYY-### (presupuestos)
- Locale: es-AR para números y fechas

## Instrucciones
- Respondé siempre en español (Argentina)
- Usá Tailwind CSS para estilos — seguí los patrones existentes (rounded-xl, shadow, slate grays, brand colors)
- Respetá la estructura de archivos existente
- Cuando modifiques api.js, usá el patrón existente con supabase client
- Probá los cambios corriendo \`npm run build\` en /workspace/taller-libra/libra-fleet
- El esquema SQL está en /workspace/taller-libra/libra-fleet/supabase-schema.sql`;

async function setup() {
  console.log("=== Libra Fleet — Managed Agent Setup ===\n");

  // 1. Create Environment
  console.log("1. Creating environment...");
  const environment = await client.beta.environments.create({
    name: `libra-fleet-dev-${Date.now()}`,
    config: {
      type: "cloud",
      networking: { type: "unrestricted" },
    },
  });
  console.log(`   Environment ID: ${environment.id}`);

  // 2. Create Agent
  console.log("2. Creating agent...");
  const agent = await client.beta.agents.create({
    name: "Libra Fleet Dev Agent",
    description:
      "Agente de desarrollo para Libra Fleet — sistema de gestión de flota de camiones. React + Supabase + Tailwind.",
    model: "claude-opus-4-6",
    system: SYSTEM_PROMPT,
    tools: [
      {
        type: "agent_toolset_20260401",
        default_config: {
          enabled: true,
          permission_policy: { type: "always_allow" },
        },
        configs: [
          {
            name: "bash",
            permission_policy: { type: "always_allow" },
          },
        ],
      },
    ],
    skills: [
      { type: "anthropic", skill_id: "pdf" },
    ],
  });
  console.log(`   Agent ID:      ${agent.id}`);
  console.log(`   Agent Version: ${agent.version}`);

  // 3. Output .env values
  console.log("\n=== Setup Complete ===");
  console.log("\nAdd these to your .env file:\n");
  console.log(`AGENT_ID=${agent.id}`);
  console.log(`AGENT_VERSION=${agent.version}`);
  console.log(`ENVIRONMENT_ID=${environment.id}`);
}

setup().catch((err) => {
  console.error("Setup failed:", err.message);
  process.exit(1);
});
