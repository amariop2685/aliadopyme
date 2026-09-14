/* ============================================================
   ConciliaGO — interfaz: carga de archivos, mapeo de columnas,
   resultados y exportación. El cálculo vive en conciliago-motor.js.
   ============================================================ */
(function () {
  "use strict";

  const M = ConciliaGOMotor;
  const $ = (id) => document.getElementById(id);
  const CLP = new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });
  const pesos = (v) => (v < 0 ? "-" : "") + CLP.format(Math.abs(v));
  const fecha = (f) => f.toLocaleDateString("es-CL", { timeZone: "UTC" });
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  const ORIGENES = ["banco", "libro"];
  const fuentes = { banco: null, libro: null };
  let resultado = null;
  let pestanaActiva = "pares";

  const CAMPOS = [
    ["fecha", "Fecha *"],
    ["descripcion", "Descripción"],
    ["documento", "N° documento"],
    ["ingreso", null],
    ["egreso", null],
    ["monto", "Monto único con signo"],
  ];
  const ETIQUETAS = {
    banco: { ingreso: "Abonos (entradas)", egreso: "Cargos (salidas)" },
    libro: { ingreso: "Debe (entradas)", egreso: "Haber (salidas)" },
  };

  function mensaje(texto) {
    $("mensaje").textContent = texto || "";
  }

  // ---------- Lectura de archivos ----------
  function leerTexto(archivo, codificacion) {
    return new Promise((resolver, rechazar) => {
      const lector = new FileReader();
      lector.onload = () => resolver(lector.result);
      lector.onerror = () => rechazar(lector.error);
      lector.readAsText(archivo, codificacion);
    });
  }

  function parseCSV(texto) {
    const muestra = texto.split(/\r?\n/).slice(0, 15).join("\n");
    const delimitador = [";", "\t", ","]
      .map((c) => [c, muestra.split(c).length])
      .sort((a, b) => b[1] - a[1])[0][0];
    const filas = [];
    let fila = [];
    let celda = "";
    let comillas = false;
    for (let i = 0; i < texto.length; i++) {
      const c = texto[i];
      if (comillas) {
        if (c === '"' && texto[i + 1] === '"') { celda += '"'; i++; }
        else if (c === '"') comillas = false;
        else celda += c;
      } else if (c === '"') {
        comillas = true;
      } else if (c === delimitador) {
        fila.push(celda);
        celda = "";
      } else if (c === "\n" || c === "\r") {
        if (c === "\r" && texto[i + 1] === "\n") i++;
        fila.push(celda);
        filas.push(fila);
        fila = [];
        celda = "";
      } else {
        celda += c;
      }
    }
    if (celda !== "" || fila.length) {
      fila.push(celda);
      filas.push(fila);
    }
    return filas;
  }

  async function leerArchivo(archivo) {
    if (/\.xlsx?$/i.test(archivo.name)) {
      if (typeof XLSX === "undefined") {
        throw new Error("no se pudo cargar el lector de Excel. Revisa tu conexión o guarda el archivo como CSV.");
      }
      const libro = XLSX.read(await archivo.arrayBuffer(), { type: "array" });
      // raw: las fechas llegan como número de serie de Excel, que el motor
      // convierte sin los desfases de zona horaria de los objetos Date.
      return XLSX.utils.sheet_to_json(libro.Sheets[libro.SheetNames[0]], { header: 1, raw: true, defval: "" });
    }
    let texto = await leerTexto(archivo, "utf-8");
    if (texto.includes("�")) texto = await leerTexto(archivo, "windows-1252");
    return parseCSV(texto);
  }

  function prepararFuente(origen, nombre, filas) {
    const encabezado = M.detectarEncabezado(filas);
    fuentes[origen] = {
      nombre,
      filas,
      encabezado,
      mapa: Object.assign(M.detectarColumnas(filas[encabezado] || []), { invertir: false }),
    };
    renderMapa(origen);
  }

  async function cargar(origen, archivo) {
    if (!archivo) return;
    mensaje("");
    try {
      prepararFuente(origen, archivo.name, await leerArchivo(archivo));
    } catch (err) {
      fuentes[origen] = null;
      $(`mapa-${origen}`).innerHTML = "";
      mensaje(`No se pudo leer ${archivo.name}: ${err.message}`);
    }
  }

  // ---------- Mapeo de columnas ----------
  function renderMapa(origen) {
    const f = fuentes[origen];
    const encabezados = f.filas[f.encabezado] || [];
    const ancho = Math.max(encabezados.length,
      ...f.filas.slice(f.encabezado, f.encabezado + 6).map((x) => x.length));
    let opciones = '<option value="-1">— no usar —</option>';
    for (let i = 0; i < ancho; i++) {
      opciones += `<option value="${i}">${esc(encabezados[i] || `Columna ${i + 1}`)}</option>`;
    }
    const movimientos = M.normalizar(f.filas, f.encabezado, f.mapa, origen);
    const selects = CAMPOS.map(([campo, etiqueta]) => `
      <div class="campo-app">
        <label for="map-${origen}-${campo}">${etiqueta || ETIQUETAS[origen][campo]}</label>
        <select id="map-${origen}-${campo}" data-campo="${campo}">${opciones}</select>
      </div>`).join("");
    const vista = movimientos.slice(0, 4).map((m) => `
      <tr><td>${fecha(m.fecha)}</td><td>${esc(m.descripcion)}</td>
        <td class="num ${m.monto < 0 ? "negativo" : "positivo"}">${pesos(m.monto)}</td></tr>`).join("");

    $(`mapa-${origen}`).innerHTML = `
      <p class="ayuda-app"><b>${esc(f.nombre)}</b> · ${movimientos.length} movimientos detectados</p>
      <div class="campos">
        <div class="campo-app">
          <label for="enc-${origen}">Fila de encabezados</label>
          <input id="enc-${origen}" type="number" min="1" max="${f.filas.length}" value="${f.encabezado + 1}">
        </div>
        ${selects}
      </div>
      <label class="ayuda-app" style="display:flex;gap:6px;align-items:center;margin:10px 0">
        <input type="checkbox" id="inv-${origen}" ${f.mapa.invertir ? "checked" : ""}>
        Invertir signos (si las entradas de dinero aparecen negativas)
      </label>
      <div class="scroll-x">
        <table class="tabla-app">
          <thead><tr><th>Fecha</th><th>Descripción</th><th class="num">Monto</th></tr></thead>
          <tbody>${vista || '<tr><td colspan="3" class="vacio">Sin movimientos: revisa las columnas de fecha y montos.</td></tr>'}</tbody>
        </table>
      </div>`;
    CAMPOS.forEach(([campo]) => { $(`map-${origen}-${campo}`).value = String(f.mapa[campo]); });
  }

  function cambioMapa(origen, e) {
    const f = fuentes[origen];
    if (!f) return;
    const el = e.target;
    if (el.dataset.campo) {
      f.mapa[el.dataset.campo] = Number(el.value);
    } else if (el.id === `enc-${origen}`) {
      f.encabezado = Math.min(Math.max(0, (Number(el.value) || 1) - 1), f.filas.length - 1);
      Object.assign(f.mapa, M.detectarColumnas(f.filas[f.encabezado] || []));
    } else if (el.id === `inv-${origen}`) {
      f.mapa.invertir = el.checked;
    }
    renderMapa(origen);
  }

  // ---------- Conciliación ----------
  function conciliarAhora() {
    mensaje("");
    if (!fuentes.banco || !fuentes.libro) {
      mensaje("Carga la cartola bancaria y el libro de banco para conciliar.");
      return;
    }
    const banco = M.normalizar(fuentes.banco.filas, fuentes.banco.encabezado, fuentes.banco.mapa, "banco");
    const libro = M.normalizar(fuentes.libro.filas, fuentes.libro.encabezado, fuentes.libro.mapa, "libro");
    if (!banco.length || !libro.length) {
      mensaje(`No se encontraron movimientos en ${banco.length ? "el libro" : "la cartola"}: `
        + "revisa las columnas de fecha y montos.");
      return;
    }
    const tolerancia = Math.max(0, Number($("tolerancia").value) || 0);
    resultado = Object.assign(M.conciliar(banco, libro, { toleranciaDias: tolerancia }), { banco, libro, tolerancia });
    pestanaActiva = "pares";
    renderResultado();
    $("resultado").hidden = false;
    $("resultado").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function leerSaldo(id) {
    const v = $(id).value.trim();
    if (!v) return null;
    const n = M.parseMonto(v);
    return Number.isFinite(n) ? n : null;
  }

  function renderResultado() {
    const r = resultado;
    const tiempos = [...r.banco, ...r.libro].map((m) => m.fecha.getTime());
    $("res-subtitulo").textContent = `Del ${fecha(new Date(Math.min(...tiempos)))} al `
      + `${fecha(new Date(Math.max(...tiempos)))} · tolerancia ${r.tolerancia} días`;

    $("kpis").innerHTML = [
      ["Movimientos banco", r.banco.length],
      ["Movimientos libro", r.libro.length],
      ["Conciliados", r.pares.length],
      ["Cartola conciliada", `${Math.round((r.pares.length / r.banco.length) * 100)}%`],
    ].map(([t, v]) => `<div class="kpi"><span>${t}</span><strong>${v}</strong></div>`).join("");

    const saldoBanco = leerSaldo("saldo-banco");
    const saldoLibro = leerSaldo("saldo-libro");
    const conSaldos = saldoBanco != null && saldoLibro != null;
    const e = M.estadoConciliacion(r, saldoBanco || 0, saldoLibro || 0);
    const linea = (texto, monto, clase) =>
      `<tr class="${clase || ""}"><td>${texto}</td><td class="num">${pesos(monto)}</td></tr>`;
    const cuadra = Math.round(e.diferencia) === 0;

    $("estado").innerHTML = `
      <div class="cargas-grid">
        <div class="scroll-x"><table class="tabla-app">
          <thead><tr><th>Según banco</th><th class="num">Monto</th></tr></thead>
          <tbody>
            ${conSaldos ? linea("Saldo según cartola", e.saldoBanco) : ""}
            ${linea("(+) Depósitos en tránsito", e.depositosEnTransito)}
            ${linea("(−) Cheques y egresos no cobrados", e.chequesNoCobrados)}
            ${conSaldos ? linea("Saldo banco ajustado", e.saldoBancoAjustado, "total") : ""}
          </tbody>
        </table></div>
        <div class="scroll-x"><table class="tabla-app">
          <thead><tr><th>Según libro</th><th class="num">Monto</th></tr></thead>
          <tbody>
            ${conSaldos ? linea("Saldo según libro", e.saldoLibro) : ""}
            ${linea("(+) Abonos del banco no registrados", e.abonosNoRegistrados)}
            ${linea("(−) Cargos del banco no registrados", e.cargosNoRegistrados)}
            ${conSaldos ? linea("Saldo libro ajustado", e.saldoLibroAjustado, "total") : ""}
          </tbody>
        </table></div>
      </div>
      ${conSaldos
        ? `<p class="${cuadra ? "positivo" : "negativo"}" style="font-weight:700;margin-top:12px">${cuadra
          ? "✓ Conciliación cuadrada: los saldos ajustados coinciden."
          : `Diferencia por aclarar: ${pesos(e.diferencia)}`}</p>`
        : '<p class="ayuda-app" style="margin-top:12px">Ingresa los saldos finales de la cartola y del libro para verificar que la conciliación cuadre.</p>'}`;

    const grupos = [
      ["pares", "Conciliados", r.pares.length],
      ["soloBanco", "Solo en banco", r.soloBanco.length],
      ["soloLibro", "Solo en libro", r.soloLibro.length],
      ["sugerencias", "Por revisar", r.sugerencias.length],
    ];
    $("pestanas").innerHTML = grupos.map(([k, t, n]) =>
      `<button type="button" class="pestana" role="tab" aria-selected="${k === pestanaActiva}" data-pestana="${k}">${t} (${n})</button>`).join("");
    $("tabla-detalle").innerHTML = tablaDetalle(pestanaActiva);
  }

  function tablaDetalle(tipo) {
    const r = resultado;
    const monto = (v) => `<td class="num ${v < 0 ? "negativo" : "positivo"}">${pesos(v)}</td>`;
    const vacio = (columnas, texto) => `<tr><td colspan="${columnas}" class="vacio">${texto}</td></tr>`;

    if (tipo === "pares" || tipo === "sugerencias") {
      const revisar = tipo === "sugerencias";
      const filas = r[tipo].map((p, i) => `
        <tr><td>${fecha(p.banco.fecha)}</td><td>${esc(p.banco.descripcion)}</td>
          <td>${fecha(p.libro.fecha)}</td><td>${esc(p.libro.descripcion)}</td>
          ${monto(p.banco.monto)}<td class="num">${p.dias}</td>
          ${revisar ? `<td class="no-print"><button type="button" class="btn-texto" data-aceptar="${i}">Conciliar</button></td>` : ""}
        </tr>`).join("");
      return `
        ${revisar ? '<p class="ayuda-app">Mismo monto en banco y libro, pero con fechas más separadas que la tolerancia. Revísalos y concilia los que correspondan.</p>' : ""}
        <table class="tabla-app">
          <thead><tr><th>Fecha banco</th><th>Descripción banco</th><th>Fecha libro</th><th>Descripción libro</th>
            <th class="num">Monto</th><th class="num">Días</th>${revisar ? '<th class="no-print"></th>' : ""}</tr></thead>
          <tbody>${filas || vacio(revisar ? 7 : 6, revisar ? "No hay coincidencias por revisar." : "No se encontraron movimientos conciliados.")}</tbody>
        </table>`;
    }

    const partida = (m) => (tipo === "soloBanco"
      ? (m.monto < 0 ? "Cargo no registrado en libro" : "Abono no registrado en libro")
      : (m.monto < 0 ? "Cheque o egreso no cobrado" : "Depósito en tránsito"));
    const filas = r[tipo].map((m) => `
      <tr><td>${fecha(m.fecha)}</td><td>${esc(m.descripcion)}</td><td>${esc(m.documento)}</td>
        <td>${partida(m)}</td>${monto(m.monto)}</tr>`).join("");
    return `
      <table class="tabla-app">
        <thead><tr><th>Fecha</th><th>Descripción</th><th>Documento</th><th>Partida</th><th class="num">Monto</th></tr></thead>
        <tbody>${filas || vacio(5, "Sin partidas pendientes ✓")}</tbody>
      </table>`;
  }

  function aceptarSugerencia(e) {
    const i = e.target.dataset.aceptar;
    if (i == null) return;
    const s = resultado.sugerencias.splice(Number(i), 1)[0];
    resultado.pares.push(s);
    resultado.soloBanco = resultado.soloBanco.filter((m) => m !== s.banco);
    resultado.soloLibro = resultado.soloLibro.filter((m) => m !== s.libro);
    renderResultado();
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

  function exportar() {
    if (!resultado) return;
    const r = resultado;
    const filas = [["Estado", "Fecha banco", "Descripción banco", "Fecha libro", "Descripción libro", "Documento", "Monto"]];
    r.pares.forEach((p) => filas.push(["Conciliado", fecha(p.banco.fecha), p.banco.descripcion,
      fecha(p.libro.fecha), p.libro.descripcion, p.libro.documento || p.banco.documento, p.banco.monto]));
    r.soloBanco.forEach((m) => filas.push([m.monto < 0 ? "Cargo no registrado en libro" : "Abono no registrado en libro",
      fecha(m.fecha), m.descripcion, "", "", m.documento, m.monto]));
    r.soloLibro.forEach((m) => filas.push([m.monto < 0 ? "Cheque o egreso no cobrado" : "Depósito en tránsito",
      "", "", fecha(m.fecha), m.descripcion, m.documento, m.monto]));
    descargar(M.aCSV(filas), "conciliacion-bancaria.csv");
  }

  // ---------- Datos de ejemplo (ficticios) ----------
  const EJEMPLO_BANCO = [
    ["Banco Demo S.A. — Cartola cuenta corriente"],
    ["Período: 01/09/2026 al 30/09/2026"],
    [],
    ["Fecha", "Descripción", "N° Documento", "Cargos", "Abonos", "Saldo"],
    ["01/09/2026", "Transferencia recibida Cliente Norte", "", "", "850.000", ""],
    ["02/09/2026", "Pago proveedor Combustibles del Sur", "", "320.000", "", ""],
    ["04/09/2026", "Cheque cobrado", "1021", "150.000", "", ""],
    ["05/09/2026", "Pago Previred", "", "412.300", "", ""],
    ["08/09/2026", "Depósito Cliente Sur", "", "", "1.200.000", ""],
    ["10/09/2026", "Comisión mantención cuenta", "", "8.900", "", ""],
    ["12/09/2026", "Pago F29 SII", "", "265.400", "", ""],
    ["15/09/2026", "Transferencia recibida Cliente Norte", "", "", "640.000", ""],
    ["20/09/2026", "Pago remuneraciones", "", "1.850.000", "", ""],
    ["25/09/2026", "Intereses a favor", "", "", "2.150", ""],
    ["28/09/2026", "Pago proveedor Neumáticos", "", "98.500", "", ""],
  ];
  const EJEMPLO_LIBRO = [
    ["Fecha", "Comprobante", "Glosa", "Debe", "Haber"],
    ["01/09/2026", "I-101", "Cobro factura 1542 Cliente Norte", "850.000", ""],
    ["02/09/2026", "E-201", "Pago factura Combustibles del Sur", "", "320.000"],
    ["03/09/2026", "E-202", "Cheque 1021 proveedor", "", "150.000"],
    ["05/09/2026", "E-203", "Cotizaciones Previred agosto", "", "412.300"],
    ["07/09/2026", "I-102", "Depósito Cliente Sur", "1.200.000", ""],
    ["12/09/2026", "E-204", "IVA F29 agosto", "", "265.400"],
    ["19/09/2026", "I-103", "Cobro factura 1560 Cliente Norte", "640.000", ""],
    ["20/09/2026", "E-205", "Remuneraciones septiembre", "", "1.850.000"],
    ["27/09/2026", "E-206", "Pago Neumáticos", "", "98.500"],
    ["29/09/2026", "E-207", "Cheque 1022 mantención camión", "", "430.000"],
    ["30/09/2026", "I-104", "Depósito Cliente Centro", "510.000", ""],
  ];

  function cargarEjemplo() {
    prepararFuente("banco", "cartola-ejemplo.xlsx", EJEMPLO_BANCO);
    prepararFuente("libro", "libro-banco-ejemplo.xlsx", EJEMPLO_LIBRO);
    $("tolerancia").value = 3;
    $("saldo-banco").value = "1.587.050";
    $("saldo-libro").value = "1.673.800";
    conciliarAhora();
  }

  // ---------- Inicio ----------
  ORIGENES.forEach((origen) => {
    $(`archivo-${origen}`).addEventListener("change", (e) => cargar(origen, e.target.files[0]));
    $(`mapa-${origen}`).addEventListener("change", (e) => cambioMapa(origen, e));
  });
  $("btn-conciliar").addEventListener("click", conciliarAhora);
  $("btn-ejemplo").addEventListener("click", cargarEjemplo);
  $("btn-exportar").addEventListener("click", exportar);
  $("btn-imprimir").addEventListener("click", () => window.print());
  $("pestanas").addEventListener("click", (e) => {
    if (!e.target.dataset.pestana) return;
    pestanaActiva = e.target.dataset.pestana;
    renderResultado();
  });
  $("tabla-detalle").addEventListener("click", aceptarSugerencia);
  ["saldo-banco", "saldo-libro"].forEach((id) => $(id).addEventListener("input", () => {
    if (resultado) renderResultado();
  }));

  // conciliago.html?demo abre la app con el ejemplo ya conciliado (enlace para
  // publicidad); ?demo=captura deja solo el resultado, para imágenes de marketing.
  const demo = new URLSearchParams(location.search).get("demo");
  if (demo !== null) {
    if (demo === "captura") document.body.classList.add("modo-captura");
    cargarEjemplo();
  }
})();
