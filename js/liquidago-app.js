/* ============================================================
   LiquidaGO — interfaz: formulario, liquidación imprimible,
   costo empresa y nómina guardada en el navegador.
   El cálculo vive en liquidago-motor.js.
   ============================================================ */
(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const CLP = new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });
  const pesos = (v) => (v < 0 ? "-" : "") + CLP.format(Math.abs(v));
  const pct = (x) => (x * 100).toLocaleString("es-CL", { maximumFractionDigits: 2 }) + "%";
  const numero = (x, dec = 0) => Number(x).toLocaleString("es-CL", { minimumFractionDigits: dec, maximumFractionDigits: dec });
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  const CLAVE_NOMINA = "liquidago_nomina_v1";

  // Copia de trabajo de los indicadores: UF y UTM se ajustan en pantalla.
  const ind = Object.assign({}, INDICADORES);
  let ultimo = null;

  const CAMPOS_TEXTO = ["empresa", "rutEmpresa", "trabajador", "rutTrabajador", "cargo", "periodo",
    "gratificacion", "afp", "salud", "contrato"];
  const CAMPOS_NUMERO = ["sueldoBase", "diasTrabajados", "jornadaSemanal", "horasExtra", "bonosImponibles",
    "gratificacionMonto", "colacion", "movilizacion", "viaticos", "cargasFamiliares", "planIsapreUF",
    "apvRegimenB", "anticipos", "prestamos", "otrosDescuentos"];
  const SIEMPRE_VISIBLES = ["diasTrabajados", "jornadaSemanal"];

  function mesActual() {
    const h = new Date();
    return `${h.getFullYear()}-${String(h.getMonth() + 1).padStart(2, "0")}`;
  }

  function periodoTexto(valor) {
    const m = /^(\d{4})-(\d{2})$/.exec(valor || "");
    if (!m) return ind.periodo;
    const t = new Date(+m[1], +m[2] - 1, 1).toLocaleDateString("es-CL", { month: "long", year: "numeric" });
    return t.charAt(0).toUpperCase() + t.slice(1);
  }

  function valoresIniciales() {
    return {
      gratificacion: "art50", afp: "habitat", salud: "fonasa", contrato: "indefinido",
      diasTrabajados: 30, jornadaSemanal: ind.jornadaMaxima, periodo: mesActual(),
    };
  }

  // Datos ficticios para mostrar la app.
  function ejemplo() {
    return {
      empresa: "Transportes Demo SpA", rutEmpresa: "76.000.000-0",
      trabajador: "Camila Rojas Pérez", rutTrabajador: "11.111.111-1", cargo: "Asistente administrativa",
      periodo: mesActual(), sueldoBase: 750000, diasTrabajados: 30, jornadaSemanal: ind.jornadaMaxima,
      horasExtra: 4, bonosImponibles: 50000, gratificacion: "art50", colacion: 40000, movilizacion: 30000,
      cargasFamiliares: 1, afp: "habitat", salud: "fonasa", contrato: "indefinido",
    };
  }

  function llenarSelects() {
    $("afp").innerHTML = Object.entries(ind.afp)
      .map(([k, a]) => `<option value="${k}">${esc(a.nombre)} (${pct(a.tasa)})</option>`).join("");
    $("contrato").innerHTML = Object.entries(ind.cesantia)
      .map(([k, c]) => `<option value="${k}">${esc(c.nombre)}</option>`).join("");
  }

  function leerFormulario() {
    const d = {};
    CAMPOS_TEXTO.forEach((k) => { d[k] = $(k).value.trim(); });
    CAMPOS_NUMERO.forEach((k) => { d[k] = $(k).value === "" ? 0 : Number($(k).value); });
    if ($("diasTrabajados").value === "") d.diasTrabajados = 30;
    d.mutualTasa = $("mutualTasa").value === "" ? null : Number($("mutualTasa").value) / 100;
    return d;
  }

  function escribirFormulario(d) {
    CAMPOS_TEXTO.forEach((k) => { $(k).value = d[k] == null ? "" : d[k]; });
    CAMPOS_NUMERO.forEach((k) => {
      const v = d[k];
      $(k).value = v == null || (v === 0 && !SIEMPRE_VISIBLES.includes(k)) ? "" : v;
    });
    $("mutualTasa").value = d.mutualTasa == null ? "" : +(d.mutualTasa * 100).toFixed(4);
    // Un select sin la opción guardada queda vacío: se vuelve al valor inicial.
    ["gratificacion", "afp", "salud", "contrato"].forEach((k) => {
      if (!$(k).value) $(k).value = valoresIniciales()[k];
    });
  }

  function actualizarVisibilidad() {
    $("wrap-gratificacionMonto").hidden = $("gratificacion").value !== "monto";
    $("wrap-planIsapreUF").hidden = $("salud").value !== "isapre";
  }

  function mensaje(texto, exito) {
    const el = $("mensaje-form");
    el.textContent = texto || "";
    el.classList.toggle("positivo", !!exito);
  }

  const fila = (concepto, monto) =>
    monto ? `<tr><td>${concepto}</td><td class="num">${pesos(monto)}</td></tr>` : "";
  const subtotal = (concepto, monto) =>
    `<tr class="subtotal"><td>${concepto}</td><td class="num">${pesos(monto)}</td></tr>`;

  function render() {
    actualizarVisibilidad();
    const d = leerFormulario();
    let l;
    try {
      l = LiquidaGOMotor.calcularLiquidacion(d, ind);
    } catch (err) {
      $("liquidacion").innerHTML = `<p>${esc(err.message)}</p>`;
      return;
    }
    ultimo = { d, l };

    $("alertas").innerHTML = l.alertas.map((a) => `<li>⚠️ ${esc(a)}</li>`).join("");

    const im = l.imponibles;
    const ni = l.noImponibles;
    const dl = l.descuentosLegales;
    const od = l.otrosDescuentos;
    const contrato = ind.cesantia[d.contrato] || ind.cesantia.indefinido;
    const salud = d.salud === "isapre"
      ? `Salud Isapre (plan ${numero(d.planIsapreUF, 3).replace(/,?0+$/, "")} UF)`
      : "Salud Fonasa (7%)";

    $("liquidacion").innerHTML = `
      <div class="doc-encabezado">
        <div class="doc-empresa">${esc(d.empresa) || "Razón social del empleador"}
          <span>${d.rutEmpresa ? "RUT " + esc(d.rutEmpresa) : "&nbsp;"}</span></div>
        <div class="doc-titulo"><h2>Liquidación de sueldo</h2><span>${esc(periodoTexto(d.periodo))}</span></div>
      </div>
      <div class="doc-partes">
        <div><b>Trabajador:</b> ${esc(d.trabajador) || "—"}</div>
        <div><b>RUT:</b> ${esc(d.rutTrabajador) || "—"}</div>
        <div><b>Cargo:</b> ${esc(d.cargo) || "—"}</div>
        <div><b>Contrato:</b> ${esc(l.contratoNombre)}</div>
        <div><b>Días trabajados:</b> ${l.dias}</div>
        <div><b>Jornada:</b> ${l.jornada} horas semanales</div>
      </div>
      <table class="tabla-doc">
        <thead><tr><th>Haberes</th><th class="num">Monto</th></tr></thead>
        <tbody>
          ${fila(`Sueldo base (${l.dias} días)`, im.sueldo)}
          ${fila(`Horas extra (${numero(d.horasExtra, 1).replace(/,0$/, "")} h × ${pesos(l.valorHoraExtra)})`, im.horasExtra)}
          ${fila(d.gratificacion === "art50" ? "Gratificación legal Art. 50" : "Gratificación", im.gratificacion)}
          ${fila("Bonos y comisiones", im.bonos)}
          ${subtotal("Total imponible", l.totalImponible)}
          ${fila("Colación", ni.colacion)}
          ${fila("Movilización", ni.movilizacion)}
          ${fila("Viáticos", ni.viaticos)}
          ${fila(`Asignación familiar (${l.cargas} ${l.cargas === 1 ? "carga" : "cargas"})`, ni.asignacionFamiliar)}
          ${l.totalNoImponible ? subtotal("Total no imponible", l.totalNoImponible) : ""}
          ${subtotal("Total haberes", l.totalHaberes)}
        </tbody>
      </table>
      <table class="tabla-doc">
        <thead><tr><th>Descuentos</th><th class="num">Monto</th></tr></thead>
        <tbody>
          ${fila(`AFP ${esc(l.afpNombre)} (${pct(l.afpTasa)})`, dl.afp)}
          ${fila(salud, dl.salud)}
          ${fila(`Seguro de cesantía (${pct(contrato.trabajador)})`, dl.cesantia)}
          ${fila("Impuesto único de segunda categoría", dl.impuesto)}
          ${fila("APV régimen B", dl.apv)}
          ${subtotal("Total descuentos legales", l.totalDescuentosLegales)}
          ${fila("Anticipos", od.anticipos)}
          ${fila("Préstamos / cuotas CCAF", od.prestamos)}
          ${fila("Otros descuentos", od.otros)}
          ${l.totalOtrosDescuentos ? subtotal("Total otros descuentos", l.totalOtrosDescuentos) : ""}
        </tbody>
      </table>
      <div class="liquido"><span>Líquido a pagar</span><span>${pesos(l.liquido)}</span></div>
      <p class="doc-pie">Base tributable ${pesos(l.baseTributable)} · Tope imponible ${ind.topes.afpUF} UF
        (${pesos(l.topeAfp)}) · UF ${numero(ind.uf, 2)} · UTM ${pesos(ind.utm)}</p>
      <div class="firmas"><div>Firma empleador</div><div>Recibí conforme · firma trabajador</div></div>
      <p class="doc-marca">Generada con LiquidaGO · aliadopyme.cl</p>`;

    const ae = l.aportesEmpleador;
    const ss = ind.seguroSocialEmpleador;
    const detalle = ss.detalle.map((x) => `${esc(x.nombre)} ${pct(x.tasa)}`).join(" · ");
    $("panel-costo").innerHTML = `
      <h2>Costo para el empleador</h2>
      <table class="tabla-doc"><tbody>
        ${subtotal("Total haberes", l.totalHaberes)}
        <tr><td>Cotización empleador Ley 21.735 (${pct(ss.total)})</td><td class="num">${pesos(ae.seguroSocial)}</td></tr>
        <tr class="detalle"><td colspan="2">Incluye: ${detalle}</td></tr>
        <tr><td>Seguro de cesantía empleador (${pct(contrato.empleador)})</td><td class="num">${pesos(ae.cesantia)}</td></tr>
        <tr><td>Mutual de seguridad (${pct(l.mutualTasa)})</td><td class="num">${pesos(ae.mutual)}</td></tr>
        ${subtotal("Costo total empresa", l.costoEmpresa)}
      </tbody></table>
      ${l.liquido > 0 ? `<p class="doc-pie">Por cada $100 de sueldo líquido, la empresa desembolsa
        ${pesos(Math.round((l.costoEmpresa / l.liquido) * 100))}.</p>` : ""}`;
  }

  // ---------- Nómina en el navegador ----------
  function leerNomina() {
    try {
      return JSON.parse(localStorage.getItem(CLAVE_NOMINA)) || [];
    } catch (err) {
      return [];
    }
  }

  function escribirNomina(lista) {
    try {
      localStorage.setItem(CLAVE_NOMINA, JSON.stringify(lista));
      return true;
    } catch (err) {
      return false;
    }
  }

  function guardarEnNomina() {
    if (!ultimo) return;
    const { d, l } = ultimo;
    if (!d.trabajador) {
      mensaje("Ingresa el nombre del trabajador para guardarlo en la nómina.");
      return;
    }
    const lista = leerNomina().filter((x) => !(x.d.trabajador === d.trabajador
      && x.d.rutTrabajador === d.rutTrabajador && x.d.periodo === d.periodo));
    const dl = l.descuentosLegales;
    lista.push({
      id: Date.now(),
      d,
      resumen: {
        imponible: l.totalImponible, noImponible: l.totalNoImponible, haberes: l.totalHaberes,
        afp: dl.afp, salud: dl.salud, cesantia: dl.cesantia, impuesto: dl.impuesto, apv: dl.apv,
        otros: l.totalOtrosDescuentos, liquido: l.liquido,
        aportesEmpleador: l.totalAportesEmpleador, costo: l.costoEmpresa,
      },
    });
    if (!escribirNomina(lista)) {
      mensaje("No se pudo guardar: este navegador bloquea el almacenamiento local.");
      return;
    }
    mensaje(`${d.trabajador} quedó guardado en la nómina de ${periodoTexto(d.periodo)}.`, true);
    renderNomina();
  }

  function renderNomina() {
    const lista = leerNomina();
    if (!lista.length) {
      $("nomina-cuerpo").innerHTML = '<tr><td colspan="7" class="vacio">Aún no hay liquidaciones guardadas.</td></tr>';
      return;
    }
    const total = (k) => lista.reduce((a, x) => a + x.resumen[k], 0);
    $("nomina-cuerpo").innerHTML = lista.map((x) => `
      <tr>
        <td>${esc(x.d.trabajador)}</td><td>${esc(x.d.rutTrabajador)}</td><td>${esc(periodoTexto(x.d.periodo))}</td>
        <td class="num">${pesos(x.resumen.imponible)}</td>
        <td class="num">${pesos(x.resumen.liquido)}</td>
        <td class="num">${pesos(x.resumen.costo)}</td>
        <td style="white-space:nowrap">
          <button type="button" class="btn-texto" data-abrir="${x.id}">Abrir</button>
          <button type="button" class="btn-texto" data-eliminar="${x.id}">Eliminar</button>
        </td>
      </tr>`).join("") + `
      <tr class="total"><td colspan="3">Total nómina (${lista.length})</td>
        <td class="num">${pesos(total("imponible"))}</td><td class="num">${pesos(total("liquido"))}</td>
        <td class="num">${pesos(total("costo"))}</td><td></td></tr>`;
  }

  function accionNomina(e) {
    const abrir = e.target.dataset.abrir;
    const eliminar = e.target.dataset.eliminar;
    if (!abrir && !eliminar) return;
    const lista = leerNomina();
    if (abrir) {
      const x = lista.find((y) => String(y.id) === abrir);
      if (!x) return;
      escribirFormulario(x.d);
      render();
      mensaje(`Liquidación de ${x.d.trabajador} abierta.`, true);
      $("form-liq").scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      escribirNomina(lista.filter((y) => String(y.id) !== eliminar));
      renderNomina();
    }
  }

  function descargar(contenido, nombre) {
    const url = URL.createObjectURL(new Blob([contenido], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = nombre;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function exportarLibro() {
    const lista = leerNomina();
    if (!lista.length) {
      mensaje("No hay liquidaciones guardadas para exportar.");
      return;
    }
    const celda = (v) => {
      const s = v == null ? "" : String(v);
      return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const filas = [["Período", "Trabajador", "RUT", "Cargo", "Total imponible", "Total no imponible",
      "Total haberes", "AFP", "Salud", "Seguro cesantía", "Impuesto único", "APV", "Otros descuentos",
      "Líquido", "Aportes empleador", "Costo empresa"]];
    lista.forEach((x) => {
      const r = x.resumen;
      filas.push([x.d.periodo, x.d.trabajador, x.d.rutTrabajador, x.d.cargo, r.imponible, r.noImponible,
        r.haberes, r.afp, r.salud, r.cesantia, r.impuesto, r.apv, r.otros, r.liquido, r.aportesEmpleador, r.costo]);
    });
    const csv = "﻿" + filas.map((f) => f.map(celda).join(";")).join("\r\n");
    descargar(csv, `libro-remuneraciones-${lista[0].d.periodo || mesActual()}.csv`);
  }

  // ---------- UF y UTM del día ----------
  function cargarIndicadoresEnVivo() {
    $("estado-indicadores").textContent = `Actualizando UF y UTM… (respaldo: ${ind.periodo})`;
    fetch("https://mindicador.cl/api")
      .then((r) => r.json())
      .then((j) => {
        if (j.uf && j.uf.valor > 0) ind.uf = j.uf.valor;
        if (j.utm && j.utm.valor > 0) ind.utm = j.utm.valor;
        $("uf").value = ind.uf;
        $("utm").value = ind.utm;
        const fecha = j.uf && j.uf.fecha ? new Date(j.uf.fecha).toLocaleDateString("es-CL") : "hoy";
        $("estado-indicadores").textContent =
          `UF y UTM al ${fecha} (mindicador.cl). Tasas y topes: indicadores ${ind.periodo}.`;
        render();
      })
      .catch(() => {
        $("estado-indicadores").textContent =
          `Sin conexión a mindicador.cl: se usan UF y UTM de respaldo (${ind.periodo}).`;
      });
  }

  // ---------- Inicio ----------
  llenarSelects();
  escribirFormulario(valoresIniciales());
  $("uf").value = ind.uf;
  $("utm").value = ind.utm;
  document.querySelectorAll("[data-periodo]").forEach((el) => { el.textContent = ind.periodo; });

  $("form-liq").addEventListener("submit", (e) => e.preventDefault());
  $("form-liq").addEventListener("input", (e) => {
    if (e.target.id === "uf") ind.uf = Number(e.target.value) || INDICADORES.uf;
    if (e.target.id === "utm") ind.utm = Number(e.target.value) || INDICADORES.utm;
    mensaje("");
    render();
  });
  $("form-liq").addEventListener("change", render);
  $("btn-imprimir").addEventListener("click", () => window.print());
  $("btn-guardar").addEventListener("click", guardarEnNomina);
  $("btn-ejemplo").addEventListener("click", () => { escribirFormulario(ejemplo()); render(); });
  $("btn-limpiar").addEventListener("click", () => {
    const vacio = {};
    [...CAMPOS_TEXTO, ...CAMPOS_NUMERO].forEach((k) => { vacio[k] = null; });
    escribirFormulario(Object.assign(vacio, valoresIniciales()));
    mensaje("");
    render();
  });
  $("nomina-cuerpo").addEventListener("click", accionNomina);
  $("btn-exportar").addEventListener("click", exportarLibro);

  // liquidago.html?demo abre la app con una liquidación de ejemplo (enlace para
  // publicidad); ?demo=captura deja solo el documento, para imágenes de marketing.
  const demo = new URLSearchParams(location.search).get("demo");
  if (demo !== null) {
    if (demo === "captura") document.body.classList.add("modo-captura");
    escribirFormulario(ejemplo());
  }

  render();
  renderNomina();
  cargarIndicadoresEnVivo();
})();
