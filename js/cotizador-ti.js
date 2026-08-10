/* ============================================================
   Cotizador de servicios tecnológicos — AliadoPyme
   Calcula un valor estimado (proyecto + mensual) y arma la
   solicitud por WhatsApp o correo. Precios en CONFIG.PRECIOS_TI.
   ============================================================ */
(function () {
  "use strict";

  const CLP = new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  });

  const $ = (id) => document.getElementById(id);
  const P = () => CONFIG.PRECIOS_TI;

  function marcarOpcion(cb) {
    cb.closest(".opcion").classList.toggle("seleccionada", cb.checked);
  }

  function calcular() {
    const lineas = [];
    let unico = 0;
    let mensual = 0;

    if ($("ti-m365").checked) {
      const usuarios = Math.max(1, parseInt($("ti-m365-usuarios").value, 10) || 1);
      let monto = Math.max(P().m365Minimo, usuarios * P().m365PorUsuario);
      let nombre = `Implementación Microsoft 365 (${usuarios} usuarios)`;
      if ($("ti-m365-migracion").checked) {
        monto += usuarios * P().migracionCorreoPorUsuario;
        nombre += " con migración de correo";
      }
      lineas.push({ nombre, monto, tipo: "unico" });
      unico += monto;
    }

    if ($("ti-azure").checked) {
      lineas.push({ nombre: "Migración de servidores a Azure (desde)", monto: P().migracionAzure, tipo: "unico" });
      unico += P().migracionAzure;
      if ($("ti-azure-admin").checked) {
        lineas.push({ nombre: "Administración y monitoreo Azure", monto: P().adminAzureMensual, tipo: "mensual" });
        mensual += P().adminAzureMensual;
      }
    }

    if ($("ti-soporte").checked) {
      const horas = $("ti-soporte-horas").value;
      const monto = P().soporteMensualHoras[horas];
      lineas.push({ nombre: `Soporte mensual (bolsa de ${horas} horas)`, monto, tipo: "mensual" });
      mensual += monto;
    }

    if ($("ti-web").checked) {
      const tipo = $("ti-web-tipo").value;
      const monto = tipo === "corporativa" ? P().webCorporativa : P().webLanding;
      lineas.push({
        nombre: tipo === "corporativa" ? "Sitio web corporativo (desde)" : "Landing page / sitio simple (desde)",
        monto, tipo: "unico",
      });
      unico += monto;
    }

    if ($("ti-crm").checked) {
      lineas.push({ nombre: "Implementación CRM + capacitación (desde)", monto: P().crmImplementacion, tipo: "unico" });
      unico += P().crmImplementacion;
    }

    if (lineas.length === 0) {
      $("ti-error").textContent = "Selecciona al menos un servicio para cotizar.";
      $("ti-resultado").style.display = "none";
      return;
    }
    $("ti-error").textContent = "";

    const cuerpo = $("ti-resumen-cuerpo");
    cuerpo.innerHTML = "";
    lineas.forEach((l) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${l.nombre}</td><td>${CLP.format(l.monto)}${l.tipo === "mensual" ? " / mes" : ""}</td>`;
      cuerpo.appendChild(tr);
    });
    if (unico > 0) {
      const tr = document.createElement("tr");
      tr.className = "total";
      tr.innerHTML = `<td>Total proyecto estimado</td><td>${CLP.format(unico)} + IVA</td>`;
      cuerpo.appendChild(tr);
    }
    if (mensual > 0) {
      const tr = document.createElement("tr");
      tr.className = "total";
      tr.innerHTML = `<td>Total mensual estimado</td><td>${CLP.format(mensual)} + IVA</td>`;
      cuerpo.appendChild(tr);
    }

    const detalle = lineas
      .map((l) => `• ${l.nombre}: ${CLP.format(l.monto)}${l.tipo === "mensual" ? "/mes" : ""}`)
      .join("\n");
    let totales = "";
    if (unico > 0) totales += `\nTotal proyecto estimado: ${CLP.format(unico)} + IVA`;
    if (mensual > 0) totales += `\nTotal mensual estimado: ${CLP.format(mensual)} + IVA`;

    const mensaje =
      "Hola AliadoPyme, quiero agendar un diagnóstico tecnológico gratuito. " +
      "Cotización estimada desde el sitio web:\n" + detalle + totales;

    $("ti-cotizar-whatsapp").href =
      `https://wa.me/${CONFIG.WHATSAPP}?text=${encodeURIComponent(mensaje)}`;
    $("ti-cotizar-correo").href =
      `mailto:${CONFIG.EMAIL}?subject=${encodeURIComponent("Cotización tecnología — AliadoPyme")}` +
      `&body=${encodeURIComponent(mensaje)}`;

    $("ti-resultado").style.display = "block";
    $("ti-resultado").scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll('#cotizador-ti .opcion input[type="checkbox"]').forEach((cb) => {
      cb.addEventListener("change", () => marcarOpcion(cb));
    });
    $("ti-btn-calcular").addEventListener("click", calcular);

    // Precios "desde" visibles en las tarjetas de servicios
    const refs = {
      "precio-m365": Math.max(P().m365Minimo, 5 * P().m365PorUsuario),
      "precio-azure": P().migracionAzure,
      "precio-soporte": P().soporteMensualHoras[5],
      "precio-web": P().webLanding,
      "precio-crm": P().crmImplementacion,
      "precio-hora": P().horaConsultoria,
    };
    Object.entries(refs).forEach(([id, valor]) => {
      const el = $(id);
      if (el) el.textContent = CLP.format(valor);
    });
  });
})();
