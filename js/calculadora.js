/* ============================================================
   Calculadora de servicios de remuneraciones — AliadoPyme
   Flujo: 1) servicios y trabajadores → 2) valor estimado →
   3) fecha y hora de reunión de 15 min → confirmación.
   ============================================================ */
(function () {
  "use strict";

  const CLP = new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  });

  const $ = (id) => document.getElementById(id);

  let cotizacion = null; // resultado del último cálculo

  /* ---------- utilidades ---------- */

  // Convierte una fracción del sueldo mínimo en pesos, redondeando
  // a los $500 más cercanos (ej: imm(0.045) con IMM $553.553 → $25.000).
  function imm(pct) {
    return Math.round((CONFIG.SUELDO_MINIMO * pct) / 500) * 500;
  }

  function valorPorTrabajador(n) {
    const t = CONFIG.PRECIOS.remuneraciones.tramos.find((tr) => n <= tr.hasta);
    return t ? imm(t.pctPorTrabajador) : 0;
  }

  function marcarOpcion(checkbox) {
    checkbox.closest(".opcion").classList.toggle("seleccionada", checkbox.checked);
  }

  function irAPaso(n) {
    document.querySelectorAll("#calculadora .paso").forEach((p) => p.classList.remove("activo"));
    $("paso-" + n).classList.add("activo");
    $("calculadora").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /* ---------- paso 1: cálculo ---------- */

  function calcular() {
    const trabajadores = Math.max(1, parseInt($("num-trabajadores").value, 10) || 1);
    const lineas = [];
    let mensual = 0;
    let unico = 0;

    if ($("srv-remuneraciones").checked) {
      const p = CONFIG.PRECIOS.remuneraciones;
      const monto = imm(p.basePct) + trabajadores * valorPorTrabajador(trabajadores);
      lineas.push({ nombre: `Remuneraciones mensuales (${trabajadores} trabajadores)`, monto, tipo: "mensual" });
      mensual += monto;
    }

    if ($("srv-conciliacion").checked) {
      const cuentas = Math.max(1, parseInt($("cant-cuentas").value, 10) || 1);
      const monto = cuentas * imm(CONFIG.PRECIOS.conciliacionBancariaPct);
      lineas.push({ nombre: `Conciliación bancaria (${cuentas} cuenta${cuentas > 1 ? "s" : ""})`, monto, tipo: "mensual" });
      mensual += monto;
    }

    if ($("srv-contabilidad").checked) {
      const sel = $("ventas-mensuales");
      const ventas = Number(sel.value);
      const tramo = CONFIG.PRECIOS.contabilidadTramos.find((t) => ventas <= t.hasta);
      const monto = imm(tramo.pct);
      const etiqueta = sel.options[sel.selectedIndex].textContent.trim();
      const esDesde = ventas > 60000000 ? ", desde" : "";
      lineas.push({ nombre: `Contabilidad mensual y F29 (mov. ${etiqueta}${esDesde})`, monto, tipo: "mensual" });
      mensual += monto;
    }

    if ($("srv-finiquitos").checked) {
      const cant = Math.max(1, parseInt($("cant-finiquitos").value, 10) || 1);
      const monto = cant * imm(CONFIG.PRECIOS.finiquitoPct);
      lineas.push({ nombre: `Finiquitos (${cant})`, monto, tipo: "unico" });
      unico += monto;
    }

    if ($("srv-liquidacion-obra").checked) {
      const cant = Math.max(1, parseInt($("cant-liquidacion").value, 10) || 1);
      const monto = cant * imm(CONFIG.PRECIOS.liquidacionObraPct);
      lineas.push({ nombre: `Liquidación final de obra o faena (${cant} trabajadores)`, monto, tipo: "unico" });
      unico += monto;
    }

    if ($("srv-capacitacion").checked) {
      const cant = Math.max(1, parseInt($("cant-capacitaciones").value, 10) || 1);
      const monto = cant * CONFIG.PRECIOS.capacitacionPrevencion;
      lineas.push({ nombre: `Capacitación Ley Karin / prevención de riesgos (${cant} ${cant > 1 ? "sesiones" : "sesión"})`, monto, tipo: "unico" });
      unico += monto;
    }

    if ($("srv-contratos").checked) {
      const cant = Math.max(1, parseInt($("cant-contratos").value, 10) || 1);
      const monto = cant * imm(CONFIG.PRECIOS.contratoPct);
      lineas.push({ nombre: `Contratos de trabajo o anexos (${cant})`, monto, tipo: "unico" });
      unico += monto;
    }

    if (lineas.length === 0) {
      $("error-paso-1").textContent = "Selecciona al menos un servicio para calcular el valor.";
      return;
    }
    $("error-paso-1").textContent = "";

    cotizacion = { trabajadores, lineas, mensual, unico };
    renderResumen();
    irAPaso(2);
  }

  function renderResumen() {
    const cuerpo = $("resumen-cuerpo");
    cuerpo.innerHTML = "";

    cotizacion.lineas.forEach((l) => {
      const tr = document.createElement("tr");
      const etiqueta = l.tipo === "mensual" ? " / mes" : " (pago único)";
      tr.innerHTML = `<td>${l.nombre}</td><td>${CLP.format(l.monto)}${etiqueta}</td>`;
      cuerpo.appendChild(tr);
    });

    if (cotizacion.mensual > 0) {
      const tr = document.createElement("tr");
      tr.className = "total";
      tr.innerHTML = `<td>Total mensual estimado</td><td>${CLP.format(cotizacion.mensual)} + IVA</td>`;
      cuerpo.appendChild(tr);
    }
    if (cotizacion.unico > 0) {
      const tr = document.createElement("tr");
      tr.className = "total";
      tr.innerHTML = `<td>Total pago único estimado</td><td>${CLP.format(cotizacion.unico)} + IVA</td>`;
      cuerpo.appendChild(tr);
    }
  }

  /* ---------- paso 3: agenda ---------- */

  function prepararAgenda() {
    // Si hay un enlace de Google Calendar configurado, se muestra el
    // botón directo además del formulario de fecha y hora.
    if (CONFIG.BOOKING_URL_CALCULADORA) {
      const enlace = $("enlace-booking");
      enlace.href = CONFIG.BOOKING_URL_CALCULADORA;
      enlace.style.display = "inline-block";
    }

    const fecha = $("fecha-reunion");
    const manana = new Date();
    manana.setDate(manana.getDate() + 1);
    fecha.min = manana.toISOString().slice(0, 10);
    const limite = new Date();
    limite.setDate(limite.getDate() + 30);
    fecha.max = limite.toISOString().slice(0, 10);

    // Bloques de 15 minutos entre 09:00 y 18:00
    const hora = $("hora-reunion");
    if (hora.options.length <= 1) {
      for (let h = 9; h < 18; h++) {
        for (const m of [0, 15, 30, 45]) {
          const v = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
          const opt = document.createElement("option");
          opt.value = v;
          opt.textContent = v + " hrs";
          hora.appendChild(opt);
        }
      }
    }
    irAPaso(3);
  }

  function resumenTexto() {
    const l = cotizacion.lineas
      .map((x) => `• ${x.nombre}: ${CLP.format(x.monto)}${x.tipo === "mensual" ? "/mes" : " (pago único)"}`)
      .join("\n");
    let totales = "";
    if (cotizacion.mensual > 0) totales += `\nTotal mensual estimado: ${CLP.format(cotizacion.mensual)} + IVA`;
    if (cotizacion.unico > 0) totales += `\nTotal pago único estimado: ${CLP.format(cotizacion.unico)} + IVA`;
    return l + totales;
  }

  function confirmarReunion(ev) {
    ev.preventDefault();

    const nombre = $("nombre-contacto").value.trim();
    const empresa = $("empresa-contacto").value.trim();
    const telefono = $("telefono-contacto").value.trim();
    const fecha = $("fecha-reunion").value;
    const hora = $("hora-reunion").value;
    const modalidad = $("modalidad-reunion").value;

    if (!nombre || !fecha || !hora) {
      $("error-paso-3").textContent = "Completa tu nombre, la fecha y la hora de la reunión.";
      return;
    }
    $("error-paso-3").textContent = "";

    const fechaLegible = new Date(fecha + "T12:00:00").toLocaleDateString("es-CL", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    });

    const mensaje =
      `Hola AliadoPyme, quiero agendar una reunión de 15 minutos (${modalidad}).\n\n` +
      `Nombre: ${nombre}\n` +
      (empresa ? `Empresa: ${empresa}\n` : "") +
      (telefono ? `Teléfono: ${telefono}\n` : "") +
      `Fecha propuesta: ${fechaLegible} a las ${hora} hrs\n\n` +
      `Cotización estimada desde el sitio web (${cotizacion.trabajadores} trabajadores):\n` +
      resumenTexto();

    $("btn-enviar-whatsapp").href =
      `https://wa.me/${CONFIG.WHATSAPP}?text=${encodeURIComponent(mensaje)}`;
    $("btn-enviar-correo").href =
      `mailto:${CONFIG.EMAIL}?subject=${encodeURIComponent("Solicitud de reunión — cotización AliadoPyme")}` +
      `&body=${encodeURIComponent(mensaje)}`;

    $("texto-confirmacion").textContent =
      `Reunión ${modalidad} propuesta para el ${fechaLegible} a las ${hora} hrs. ` +
      "Envíanos la solicitud por WhatsApp o correo y te confirmaremos la hora a la brevedad.";

    irAPaso(4);
  }

  /* ---------- inicialización ---------- */

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll('#calculadora .opcion input[type="checkbox"]').forEach((cb) => {
      cb.addEventListener("change", () => marcarOpcion(cb));
    });

    const spanImm = $("imm-vigente");
    if (spanImm) spanImm.textContent = CLP.format(CONFIG.SUELDO_MINIMO);

    $("btn-calcular").addEventListener("click", calcular);
    $("btn-volver-1").addEventListener("click", () => irAPaso(1));
    $("btn-agendar").addEventListener("click", prepararAgenda);
    $("btn-volver-2").addEventListener("click", () => irAPaso(2));
    $("form-reunion").addEventListener("submit", confirmarReunion);
  });
})();
