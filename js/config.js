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
  },
};
