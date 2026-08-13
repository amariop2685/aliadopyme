/* ============================================================
   CONFIGURACIÓN DE ALIADOPYME — edita este archivo para cambiar
   precios, contacto y enlaces de agendamiento SIN tocar el resto
   del sitio.
   ============================================================ */

const CONFIG = {

  /* ---------- CONTACTO ---------- */
  // Número de WhatsApp en formato internacional, solo dígitos (56 = Chile).
  WHATSAPP: "56952284219",

  // Correo donde llegan las solicitudes de reunión.
  EMAIL: "contacto@aliadopyme.cl",

  /* ---------- AGENDAMIENTO ---------- */
  // URL del "Horario de citas" de Google Calendar para la reunión
  // de 15 minutos de la calculadora (opcional). Si se deja vacío,
  // el sitio usa el flujo de WhatsApp/correo con fecha y hora.
  // Cómo crearla: Google Calendar → Crear → Horario de citas →
  // duración 15 min → días/horas disponibles → Compartir → Enlace.
  BOOKING_URL_CALCULADORA: "",

  // URL del "Horario de citas" de Google Calendar DEL ABOGADO para
  // la asesoría legal (página legal.html). El abogado controla desde
  // su propio Google Calendar los días y horas disponibles, y cada
  // reserva genera automáticamente una videollamada de Google Meet.
  BOOKING_URL_LEGAL: "",

  // URL del "Horario de citas" DEL PREVENCIONISTA DE RIESGOS para la
  // página prevencion.html (mismo mecanismo que el abogado).
  BOOKING_URL_PREVENCION: "",

  // URL del "Horario de citas" para el diagnóstico de CONSULTORÍA
  // TECNOLÓGICA (tecnologia.html) — calendario de Mario.
  BOOKING_URL_TECNOLOGIA: "",

  /* ---------- SUELDO MÍNIMO (base de cálculo) ----------
     Ingreso mínimo mensual vigente en Chile. Los precios de los
     servicios contables y de remuneraciones se expresan como % de
     este valor, así se reajustan solos: cuando cambie el sueldo
     mínimo, basta actualizar este número.
     Vigente desde 01-05-2026 (Ley 21.830).                        */
  SUELDO_MINIMO: 553553,

  /* ---------- PRECIOS (netos, referenciales) ----------
     Los campos que terminan en "Pct" son fracción del sueldo mínimo
     (0.045 = 4,5% del sueldo mínimo). El resultado se redondea a
     los $500 más cercanos.                                        */
  PRECIOS: {
    // Remuneraciones mensuales: cargo base + valor por trabajador
    // según tramo (liquidaciones de sueldo, Previred, LRE).
    remuneraciones: {
      basePct: 0.055,             // ≈ $30.500 hoy
      tramos: [
        { hasta: 5,        pctPorTrabajador: 0.022  }, // ≈ $12.000 c/u
        { hasta: 20,       pctPorTrabajador: 0.018  }, // ≈ $10.000 c/u
        { hasta: 50,       pctPorTrabajador: 0.0155 }, // ≈ $8.500 c/u
        { hasta: Infinity, pctPorTrabajador: 0.013  }, // ≈ $7.000 c/u
      ],
    },

    // Valores por documento / evento (pago único, no mensual)
    finiquitoPct: 0.045,          // por finiquito           ≈ $25.000
    liquidacionObraPct: 0.036,    // final de obra, por trab. ≈ $20.000
    contratoPct: 0.027,           // contrato o anexo         ≈ $15.000

    // Servicios mensuales
    conciliacionBancariaPct: 0.08,   // por cuenta bancaria   ≈ $44.500

    // Contabilidad mensual + F29: el valor depende del movimiento
    // de la empresa (ventas + compras mensuales según SII).
    // "hasta" = ventas+compras mensuales en CLP; pct = % del sueldo mínimo.
    contabilidadTramos: [
      { hasta: 5000000,   pct: 0.145 }, // hasta $5M      ≈ $80.500
      { hasta: 15000000,  pct: 0.20  }, // $5M a $15M     ≈ $110.500
      { hasta: 30000000,  pct: 0.27  }, // $15M a $30M    ≈ $149.500
      { hasta: 60000000,  pct: 0.36  }, // $30M a $60M    ≈ $199.500
      { hasta: Infinity,  pct: 0.50  }, // sobre $60M     ≈ $276.500 (desde)
    ],

    // Prevención de riesgos (CLP fijo, precio al cliente por sesión)
    capacitacionPrevencion: 180000,

    // Prevencionista de riesgos mensual: visita semanal + toda la
    // documentación de prevención al día. Precio al cliente según
    // cantidad de trabajadores (referencia real de mercado:
    // 44 trabajadores → $260.000/mes).
    prevencionistaMensual: [
      { hasta: 10,       precio: 120000 },
      { hasta: 25,       precio: 180000 },
      { hasta: 50,       precio: 260000 },
      { hasta: 100,      precio: 350000 },
      { hasta: Infinity, precio: 450000 }, // sobre 100, desde
    ],
  },

  /* ---------- PRECIOS TECNOLOGÍA (CLP, netos, referenciales) ----
     Servicios propios de consultoría TI (margen 100% AliadoPyme). */
  PRECIOS_TI: {
    horaConsultoria: 50000,           // hora de consultoría / soporte
    m365PorUsuario: 40000,            // implementación Microsoft 365, por usuario
    m365Minimo: 200000,               // mínimo del proyecto M365
    migracionCorreoPorUsuario: 15000, // adicional por usuario si hay migración de correo
    migracionAzure: 500000,           // migración de servidores a Azure (desde, por proyecto)
    adminAzureMensual: 150000,        // administración y monitoreo Azure, mensual
    soporteMensualHoras: {            // bolsas de soporte mensual
      5: 200000,
      10: 380000,
      20: 720000,
    },
    webLanding: 400000,               // landing page / sitio simple
    webCorporativa: 700000,           // sitio corporativo completo
    crmImplementacion: 400000,        // implementación CRM + capacitación
  },

  /* ---------- MODELO DE NEGOCIO (uso interno: margenes.html) ----------
     Cuánto paga el cliente, cuánto recibe el profesional externo y
     cuánto queda para AliadoPyme. Esta sección NO se muestra en las
     páginas públicas del sitio, solo en margenes.html.               */
  NEGOCIO: {
    // Abogado: él fija su honorario al cliente final y AliadoPyme
    // cobra una comisión por derivación y gestión (0.15 = 15%).
    comisionAbogado: 0.15,

    // Ejemplos de honorarios del abogado para simular la comisión
    ejemplosAbogado: [
      { servicio: "Consulta / entrevista asesoría",              honorario: 80000 },
      { servicio: "Contrato de trabajo a medida",                honorario: 150000 },
      { servicio: "Protocolo + implementación Ley Karin",        honorario: 400000 },
      { servicio: "Asesoría ante denuncia Ley Karin (proceso)",  honorario: 600000 },
    ],

    // Prevencionista de riesgos: modelo de reventa — AliadoPyme fija
    // el precio al cliente y paga una tarifa acordada al profesional.
    prevencion: [
      { servicio: "Capacitación Ley Karin (hasta 20 asistentes)",     cliente: 180000, profesional: 120000 },
      { servicio: "Protocolo de prevención Ley Karin (documento)",    cliente: 250000, profesional: 170000 },
      { servicio: "Prevencionista mensual 26-50 trab. (visita semanal + documentación)", cliente: 260000, profesional: 190000 },
      { servicio: "Otra capacitación obligatoria (por sesión)",       cliente: 150000, profesional: 100000 },
    ],
  },
};
