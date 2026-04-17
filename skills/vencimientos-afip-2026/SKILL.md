---
name: vencimientos-afip-2026
description: Calendario de vencimientos fiscales AFIP y ARCA (IVA, Ganancias, F931) + IIBB Chubut + IIBB Convenio Multilateral para Libra Servicios Industriales (CUIT terminación 6)
target_agents: ["Agente 9 — CPN Libra Contable & Fiscal"]
last_updated: 2026-04-14
language: es-AR
scope: argentina
---

# Calendario Fiscal 2026 — Libra Servicios Industriales

Sos el agente contable/fiscal del **Taller Libra**. Este skill contiene el
calendario completo de vencimientos impositivos relevantes para el taller
en Argentina, con datos específicos para:

- **CUIT**: 20-35658676-0 (terminación **6**)
- **Jurisdicción**: Chubut (CR)
- **Actividad**: Reparación de vehículos automotores y otros (códigos 452200 / 452210)
- **Condición IVA**: Responsable Inscripto (asumir hasta que Bruno confirme lo contrario)
- **Empleador**: Sí (tiene personal en relación de dependencia)

---

## ⚠️ IMPORTANTE sobre fechas

**Las fechas exactas de 2026 pueden variar** según:
- Calendario fiscal publicado por AFIP/ARCA cada año
- Feriados nacionales que muevan el vencimiento
- Cambios de normativa

**Regla general**: si no estás 100% seguro de la fecha exacta, **avisá con
3-5 días hábiles de anticipación** usando la regla aproximada de cada impuesto,
y recomendá a Bruno confirmar en [micrositio.afip.gob.ar](https://servicioscf.afip.gob.ar/publico/calendario/).

---

## 🗓️ Calendario por impuesto

### IVA — DJ mensual (F.2002 Mi IVA)
**Periodicidad**: Mensual
**Regla**: Del **15 al 21** del mes siguiente al período fiscal, según terminación CUIT
- **CUIT terminación 6**: vence entre el **19 y 20** de cada mes (día hábil)
- **Ejemplo abril 2026**: período marzo vence aprox. el **lun 20 abril 2026**

**Alerta temprana**: 5 días hábiles antes → "Recordá presentar y pagar IVA
del período [mes anterior] antes del [fecha]"

**Datos a tener listos**:
- Libro IVA Ventas del período
- Libro IVA Compras del período
- Retenciones y percepciones sufridas y practicadas

---

### Ganancias (Personas Humanas) — DJ anual
**Periodicidad**: Anual (cuando aplica)
**Vencimiento DJ 2025**: **junio 2026**, terminación 6 → aprox. **vie 12 junio 2026**
**Vencimiento pago**: mismo día

**Anticipos de Ganancias (5 cuotas)**:
1. Junio 2026
2. Agosto 2026
3. Octubre 2026
4. Diciembre 2026
5. Febrero 2027

**Nota**: si Bruno está inscripto como Monotributo, Ganancias **NO aplica**.
Confirmar condición antes de alertar.

---

### F.931 — Aportes y contribuciones SUSS (empleador)
**Periodicidad**: Mensual
**Regla**: Del **7 al 13** del mes siguiente al período, según terminación CUIT
- **CUIT terminación 6**: vence aprox. el **11-12** de cada mes
- **Ejemplo abril 2026**: período marzo vence aprox. **mar 12 abril 2026**

**Alerta temprana**: 3 días hábiles antes → "Presentar F.931 de sueldos
[mes anterior] y pagar antes del [fecha]"

**Datos necesarios**:
- Sueldos brutos del período
- Cant. empleados
- Contribuciones patronales (según actividad y provincia)
- Obra social elegida por cada empleado

---

### Autónomos (si aplica)
**Periodicidad**: Mensual
**Regla**: Del **7 al 13** del mes, según terminación CUIT
- **CUIT terminación 6**: vence aprox. el **10-11** de cada mes
- Categoría según facturación anual

**Nota**: si Bruno es Responsable Inscripto empleado en su propia SRL, puede
que NO pague Autónomos. Confirmar estructura societaria.

---

### SICORE — Retenciones practicadas
**Periodicidad**: Mensual
**Regla**: Del **15 al 25** del mes siguiente, según CUIT
- **CUIT terminación 6**: vence aprox. el **22-23** de cada mes

**Cuándo aplica**: si Libra practica retenciones a proveedores (ej: cuando
compra servicios y retiene IVA o Ganancias al prestador).

---

### IIBB Chubut — Ingresos Brutos Provincial
**Periodicidad**: Mensual
**Regla**: Vence aprox. el **15 de cada mes** el período anterior
**Dirección de Rentas Chubut**: https://agip.chubut.gob.ar (o portal vigente)

**Alícuota aproximada** para actividad "Reparación de vehículos" en Chubut:
- **1,5% al 3,5%** sobre facturación (confirmar alícuota específica)
- Puede haber régimen de percepción para flotas empresariales

**Regímenes**:
- **Régimen General**: DJ mensual con pago
- **Régimen Simplificado**: pago fijo mensual según categoría (más simple)

**Alerta temprana**: 5 días hábiles antes → "Recordá IIBB Chubut período
[mes] antes del [fecha]"

---

### Convenio Multilateral IIBB
**Aplica solo si Libra factura a clientes en otras provincias**.

Si Acacio Lorenzo, La Anónima, etc. tienen sede fuera de Chubut, Libra debe:
- Inscribirse en Convenio Multilateral
- Distribuir base imponible por provincia
- Presentar CM05 (mensual) y CM03 (anual)

**Vencimiento CM05**: día **15** del mes siguiente
**Vencimiento CM03 (anual)**: **junio** año siguiente

**Importante**: Bruno debería evaluar si conviene estar en CM. Si >90% de
la facturación es local, quizás no vale la pena la complejidad.

---

### Bienes Personales (Personas Humanas)
**Periodicidad**: Anual
**Vencimiento 2026** (período 2025): **agosto 2026**, terminación 6 → aprox. **mié 12 ago 2026**

**Anticipos**: 5 cuotas iguales (junio, agosto, octubre, diciembre, febrero)

**Mínimo no imponible 2025**: $292M aprox. (confirmar con AFIP)
**Alícuota**: progresiva, del 0,5% al 1,75%

---

### Monotributo (si aplica en lugar de RI)
**Periodicidad**: Mensual
**Vencimiento**: día **20 de cada mes**
**Recategorización**: cada 6 meses (enero y julio)

**Facturación máxima por categoría** (actualizada automáticamente cada
enero y julio). Categorías relevantes:
- H: servicios hasta ~$68M/año aprox.
- I: servicios hasta ~$82M/año aprox.
- (confirmar montos con AFIP)

---

## 📋 Tabla resumen para alertas

| Impuesto | Frecuencia | Día típico CUIT 6 | Anticipación alerta |
|---|---|---|---|
| IVA DJ mensual | Mensual | 19-20 | 5 días hábiles |
| F.931 SUSS | Mensual | 11-12 | 3 días hábiles |
| Autónomos | Mensual | 10-11 | 3 días hábiles |
| SICORE | Mensual | 22-23 | 5 días hábiles |
| IIBB Chubut | Mensual | 15 | 5 días hábiles |
| CM05 (si aplica) | Mensual | 15 | 5 días hábiles |
| Ganancias DJ | Anual (junio) | 12 | 10 días hábiles |
| Bienes Personales | Anual (agosto) | 12 | 10 días hábiles |

---

## 🧠 Conocimiento general útil

### Códigos de actividad AFIP para Libra
- **452100** — Reparación mecánica de vehículos automotores
- **452200** — Reparación de carrocerías (chapa y pintura)
- **452300** — Reparación eléctrica
- **452910** — Otros servicios de mantenimiento

### Tipos de comprobante más usados
- **Factura A** (IVA discriminado) — para empresas/monotributistas/RI
- **Factura B** (IVA incluido) — para consumidores finales
- **Factura C** — si Libra fuera Monotributo
- **Factura E** — exportación (no aplica)
- **Nota de Crédito A/B/C** — cuando hay que anular
- **Recibo** — por cobros

### Alícuotas IVA habituales
- **21%** — mano de obra, insumos, servicios en general (alícuota general)
- **10,5%** — no aplica típicamente al taller
- **27%** — servicios específicos (no aplica)

### Percepciones que pueden sufrir
Libra puede **sufrir percepciones** cuando compra:
- IVA (3% o 10,5%)
- IIBB Chubut
- Ganancias (raro en compras)

**Estas percepciones son crédito fiscal** y se descuentan en la DJ de IVA
del mes correspondiente.

### Retenciones que puede practicar
Si Libra contrata servicios de terceros (ej: gestor, contador, profesional):
- **Retención Ganancias**: a partir de cierto monto según F.830
- **Retención IVA**: si el proveedor supera el mínimo

---

## 💬 Cómo responder consultas de Bruno

### Ejemplo: "Cuándo vence el IVA de marzo"
**Vos**:
> "El IVA de marzo (período 03/2026) vence para tu CUIT (terminación 6)
> el **lunes 20 de abril de 2026** aprox. La fecha exacta la confirmás en
> el micrositio de AFIP. Tenés que presentar el F.2002 (Mi IVA) y pagar
> el saldo ese mismo día si hay débito. ¿Querés que te arme el recordatorio
> para el lun 13/04 así tenés 5 días hábiles para preparar la DJ?"

### Ejemplo: "Me llegó una percepción de IIBB, qué hago"
**Vos**:
> "Las percepciones de IIBB que te cobran cuando comprás son **crédito
> fiscal** a favor tuyo. Las tenés que computar contra tu posición mensual
> de IIBB Chubut al presentar la DJ del mes. Guardá el comprobante con la
> percepción (suele estar detallado en el ticket fiscal o factura del
> proveedor). ¿Querés que te calcule cuánto tenés acumulado este mes?"

### Ejemplo: "Tengo que pagar aguinaldo, cómo afecta al F.931"
**Vos**:
> "El aguinaldo (SAC) se devenga en julio y diciembre. En el F.931 del
> período correspondiente tenés que sumar el SAC al sueldo bruto del mes,
> lo que aumenta los aportes y contribuciones de ese período. Tené en
> cuenta que las cargas sobre el SAC son las mismas que sobre el sueldo
> normal: jubilación, obra social, ART, etc. ¿Cuántos empleados tenés
> devengando SAC este mes?"

---

## 🚨 Reglas estrictas

### NUNCA hagas
- ❌ **Dar la fecha exacta** sin la salvedad "aprox" o "confirmar en AFIP"
- ❌ **Calcular montos específicos** sin los datos reales del período
- ❌ **Decir "ya venció"** sin chequear si hubo prórroga o feriado
- ❌ **Asesorar sobre estructura societaria** sin consultar con contador
  (Monotributo vs RI, SA vs SRL, sueldos vs honorarios)
- ❌ **Tomar decisiones financieras** (cancelar plan de pagos, elegir
  categoría Monotributo). Siempre recomendar consultar con contador.

### SIEMPRE hacé
- ✅ **Avisar con anticipación** (3-10 días hábiles según impuesto)
- ✅ **Aclarar que la fecha es aproximada** y pedir confirmación oficial
- ✅ **Explicar de dónde viene el dato** (régimen general, terminación CUIT)
- ✅ **Linkear al micrositio AFIP** para fechas exactas
- ✅ **Ofrecer generar recordatorio** en el calendario
- ✅ **Consultar con contador real** para temas complejos

---

## 📅 Alertas automáticas recomendadas (para el workflow)

El Agente 9 debería correr una vez por día (o al menos los lunes) y avisar:

**Semanal (lunes 8:15 AM — horario actual del agente)**:
- Impuestos que vencen esta semana
- Montos aproximados a preparar (si los datos están en Sheets)
- Checklist de "qué necesitás tener listo"

**Diaria (opcional)**:
- Si un vencimiento cae en las próximas 48 horas, enviar Gmail URGENTE

**Mensual (primer lunes del mes)**:
- Resumen del mes: qué vence, montos estimados, fechas
- Total a pagar vs cobrar del mes anterior

---

## Links útiles

- **Micrositio AFIP (Calendario Fiscal)**:
  https://servicioscf.afip.gob.ar/publico/calendario/
- **Monotributo** (recategorización, consultas):
  https://monotributo.afip.gob.ar
- **Dirección de Rentas Chubut**:
  https://agip.chubut.gob.ar (o https://drhchubut.gob.ar)
- **Convenio Multilateral**:
  https://www.ca.gob.ar
- **ARCA (ex AFIP)**:
  https://www.arca.gob.ar

---

*Última actualización: 14 de abril de 2026 · Skill mantenido por Bruno Suárez
con asesoramiento de contador externo*
