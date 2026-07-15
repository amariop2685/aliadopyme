/* ============================================================
   CONFIGURACIÓN DE ALIADOPYME — edita este archivo para cambiar
   precios, contacto y enlaces de agendamiento SIN tocar el resto
   del sitio.
   ============================================================ */

const CONFIG = {

  /* ---------- CONTACTO ---------- */
  // Número de WhatsApp en formato internacional, solo dígitos (56 = Chile).
  // EDITAR: reemplazar por el número real de AliadoPyme.
  WHATSAPP: "56900000000",

  // Correo donde llegan las solicitudes de reunión.
  EMAIL: "amariop2685@gmail.com",

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

  /* ---------- PRECIOS (CLP, netos, referenciales) ---------- */
  PRECIOS: {
    // Remuneraciones mensuales: cargo base + valor por trabajador
    // según tramo (liquidaciones de sueldo, Previred, LRE).
    remuneraciones: {
      base: 30000,
      tramos: [
        { hasta: 5,        porTrabajador: 12000 },
        { hasta: 20,       porTrabajador: 10000 },
        { hasta: 50,       porTrabajador: 8500  },
        { hasta: Infinity, porTrabajador: 7000  },
      ],
    },

    // Valores por documento / evento (pago único, no mensual)
    finiquito: 25000,             // por finiquito
    liquidacionObra: 20000,       // liquidación final de obra o faena, por trabajador
    contrato: 15000,              // contrato de trabajo o anexo, por documento

    // Servicios mensuales de monto fijo
    conciliacionBancaria: 45000,  // por cuenta bancaria, mensual
    contabilidadMensual: 80000,   // contabilidad + F29, desde (mensual)

    // Prevención de riesgos (precio al cliente, por sesión)
    capacitacionPrevencion: 180000, // capacitación Ley Karin u otra obligatoria
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
      { servicio: "Asesoría mensual prevención de riesgos (DS 44)",   cliente: 200000, profesional: 140000 },
      { servicio: "Otra capacitación obligatoria (por sesión)",       cliente: 150000, profesional: 100000 },
    ],
  },
};
