/* ============================================================
   Indicadores previsionales y tributarios — LiquidaGO (AliadoPyme)

   ACTUALIZAR CADA MES con:
   - Previred: https://www.previred.com/indicadores-previsionales/
   - SII, tabla del impuesto único de segunda categoría
   UF y UTM se actualizan solas desde mindicador.cl al abrir la app;
   los valores de aquí son el respaldo si esa consulta falla.

   Cambios de calendario a vigilar:
   - Enero: topes imponibles en UF (Superintendencia de Pensiones).
   - Mayo: ingreso mínimo mensual (y tramos de asignación familiar).
   - Agosto: cotización del empleador de la reforma (Ley 21.735):
     3,5% desde ago-2026, 4,25% desde ago-2027 ... 8,5% en ago-2033.
   - Abril 2028: jornada máxima baja de 42 a 40 horas.
   ============================================================ */

const INDICADORES = {
  periodo: "Septiembre 2026",
  fuentes: "Previred (indicadores agosto 2026), SII Circular N°32/2026, Ley 21.735, Ley 21.561",

  uf: 40873.77,        // respaldo: UF al 31-08-2026
  utm: 71721,          // UTM septiembre 2026
  sueldoMinimo: 553553,
  jornadaMaxima: 42,   // horas semanales (Ley 40 horas, vigente desde 26-04-2026)

  topes: {
    afpUF: 90,          // AFP, salud y seguro social del empleador
    cesantiaUF: 135.2,  // seguro de cesantía
    apvMensualUF: 50,   // APV régimen B rebajable del impuesto
  },

  // Tasa de cargo del trabajador: 10% cuenta individual + comisión.
  afp: {
    capital:   { nombre: "Capital",   tasa: 0.1144 },
    cuprum:    { nombre: "Cuprum",    tasa: 0.1144 },
    habitat:   { nombre: "Habitat",   tasa: 0.1127 },
    planvital: { nombre: "PlanVital", tasa: 0.1116 },
    provida:   { nombre: "ProVida",   tasa: 0.1145 },
    modelo:    { nombre: "Modelo",    tasa: 0.1058 },
    uno:       { nombre: "Uno",       tasa: 0.1046 },
  },

  salud: { legal: 0.07 },

  cesantia: {
    indefinido:    { nombre: "Plazo indefinido",          trabajador: 0.006, empleador: 0.024 },
    plazo_fijo:    { nombre: "Plazo fijo / obra o faena", trabajador: 0,     empleador: 0.03  },
    indefinido_11: { nombre: "Indefinido, 11+ años",      trabajador: 0,     empleador: 0.008 },
  },

  // Cotización de cargo del empleador, Ley 21.735 (desde agosto 2026).
  // El SIS ya está incluido aquí: no se suma aparte.
  seguroSocialEmpleador: {
    total: 0.035,
    detalle: [
      { nombre: "Seguro de invalidez y sobrevivencia (SIS)", tasa: 0.0178 },
      { nombre: "Compensación por expectativa de vida",      tasa: 0.0072 },
      { nombre: "Cotización con rentabilidad protegida",     tasa: 0.009  },
      { nombre: "Cuenta individual AFP",                     tasa: 0.001  },
    ],
  },

  mutualBasica: 0.0093, // Ley 16.744 0,90% + Ley SANNA 0,03% (sin cotización adicional)

  // Gratificación Art. 50 Código del Trabajo: 25% con tope anual de 4,75 IMM.
  gratificacion: { tasa: 0.25, topeIMMAnual: 4.75 },

  // Monto por carga según renta mensual del trabajador.
  asignacionFamiliar: [
    { hasta: 649039,   monto: 22601 },
    { hasta: 947990,   monto: 13870 },
    { hasta: 1478539,  monto: 4382  },
    { hasta: Infinity, monto: 0     },
  ],

  // Impuesto único de segunda categoría, tabla mensual en UTM.
  // Impuesto = base × factor − rebaja × UTM
  impuestoUnico: [
    { hastaUTM: 13.5,     factor: 0,     rebajaUTM: 0     },
    { hastaUTM: 30,       factor: 0.04,  rebajaUTM: 0.54  },
    { hastaUTM: 50,       factor: 0.08,  rebajaUTM: 1.74  },
    { hastaUTM: 70,       factor: 0.135, rebajaUTM: 4.49  },
    { hastaUTM: 90,       factor: 0.23,  rebajaUTM: 11.14 },
    { hastaUTM: 120,      factor: 0.304, rebajaUTM: 17.8  },
    { hastaUTM: 310,      factor: 0.35,  rebajaUTM: 23.32 },
    { hastaUTM: Infinity, factor: 0.4,   rebajaUTM: 38.82 },
  ],
};

if (typeof module !== "undefined" && module.exports) module.exports = INDICADORES;
