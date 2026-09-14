/* ============================================================
   ConciliaGO — motor de conciliación bancaria
   Funciones puras (sin DOM) para leer cartolas y libros de banco,
   emparejar movimientos y armar el estado de conciliación.
   Pruebas: tests/conciliago.test.js
   ============================================================ */
(function (raiz) {
  "use strict";

  const DIA = 86400000;

  // Montos en formato chileno ("1.234.567", "-45.000", "$ 12.500",
  // "(3.000)", "1234,5") o numéricos. Devuelve NaN si no es un monto.
  function parseMonto(v) {
    if (typeof v === "number") return v;
    if (v == null) return 0;
    let s = String(v).trim().replace(/\$|CLP|\s/gi, "");
    if (s === "") return 0;
    let negativo = false;
    if (/^\(.*\)$/.test(s)) { negativo = true; s = s.slice(1, -1); }
    if (s.endsWith("-")) { negativo = true; s = s.slice(0, -1); }
    if (/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) s = s.replace(/\./g, "").replace(",", ".");
    else if (/^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) s = s.replace(/,/g, "");
    else if (/^-?\d+,\d+$/.test(s)) s = s.replace(",", ".");
    const x = Number(s);
    if (!Number.isFinite(x)) return NaN;
    return negativo ? -Math.abs(x) : x;
  }

  // Fechas dd/mm/aaaa, dd-mm-aa, aaaa-mm-dd, objetos Date o seriales
  // de Excel. Devuelve un Date en UTC a medianoche, o null.
  function parseFecha(v) {
    if (v instanceof Date && !isNaN(v)) {
      return new Date(Date.UTC(v.getFullYear(), v.getMonth(), v.getDate()));
    }
    if (typeof v === "number" && v > 20000 && v < 80000) {
      const f = new Date(Date.UTC(1899, 11, 30) + Math.round(v) * DIA);
      return isNaN(f) ? null : f;
    }
    if (typeof v !== "string") return null;
    const s = v.trim();
    let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (m) return fechaValida(+m[1], +m[2], +m[3]);
    m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/);
    if (m) {
      const anio = +m[3] < 100 ? 2000 + +m[3] : +m[3];
      return fechaValida(anio, +m[2], +m[1]);
    }
    return null;
  }

  function fechaValida(anio, mes, dia) {
    const f = new Date(Date.UTC(anio, mes - 1, dia));
    return f.getUTCMonth() === mes - 1 && f.getUTCDate() === dia ? f : null;
  }

  // Las cartolas suelen traer líneas de título antes de la tabla:
  // el encabezado es la primera fila (de las 20 primeras) con "fecha".
  function detectarEncabezado(filas) {
    const limite = Math.min(filas.length, 20);
    for (let i = 0; i < limite; i++) {
      if ((filas[i] || []).some((c) => /fecha/i.test(String(c)))) return i;
    }
    return 0;
  }

  const PATRONES = [
    ["fecha", /fecha/i],
    ["ingreso", /abono|cr[eé]dito|ingreso|dep[oó]sito|\bdebe\b/i],
    ["egreso", /cargo|d[eé]bito|egreso|giro|\bhaber\b/i],
    ["monto", /monto|importe|valor/i],
    ["documento", /documento|comprobante|cheque|folio|n[°ºo]\.?\s*(de\s*)?(doc|operaci)/i],
    ["descripcion", /descrip|glosa|detalle|concepto|referencia|movimiento/i],
  ];

  function detectarColumnas(encabezados) {
    const mapa = { fecha: -1, descripcion: -1, documento: -1, monto: -1, ingreso: -1, egreso: -1 };
    const usadas = new Set();
    PATRONES.forEach(([campo, patron]) => {
      const i = encabezados.findIndex((h, idx) => !usadas.has(idx) && !/saldo/i.test(String(h))
        && patron.test(String(h)));
      if (i >= 0) { mapa[campo] = i; usadas.add(i); }
    });
    // Con columnas separadas de ingreso y egreso no se usa monto único.
    if (mapa.ingreso >= 0 && mapa.egreso >= 0) mapa.monto = -1;
    return mapa;
  }

  // Convierte filas (arreglos) en movimientos. El monto es positivo para
  // entradas de dinero (abono en banco / debe en libro) y negativo para
  // salidas (cargo en banco / haber en libro).
  function normalizar(filas, encabezado, mapa, origen) {
    const movimientos = [];
    for (let i = encabezado + 1; i < filas.length; i++) {
      const fila = filas[i] || [];
      const fecha = parseFecha(fila[mapa.fecha]);
      if (!fecha) continue;
      let monto;
      if (mapa.monto >= 0) {
        monto = parseMonto(fila[mapa.monto]);
      } else {
        const entra = Math.abs(parseMonto(fila[mapa.ingreso]));
        const sale = Math.abs(parseMonto(fila[mapa.egreso]));
        monto = (Number.isFinite(entra) ? entra : 0) - (Number.isFinite(sale) ? sale : 0);
      }
      if (!Number.isFinite(monto) || monto === 0) continue;
      if (mapa.invertir) monto = -monto;
      movimientos.push({
        id: `${origen}-${i}`,
        fila: i + 1,
        fecha,
        descripcion: mapa.descripcion >= 0 ? String(fila[mapa.descripcion] ?? "").trim() : "",
        documento: mapa.documento >= 0 ? String(fila[mapa.documento] ?? "").trim() : "",
        monto,
      });
    }
    return movimientos;
  }

  // Empareja cada movimiento del banco con uno del libro de igual monto
  // dentro de la tolerancia de días, eligiendo la fecha más cercana.
  function conciliar(banco, libro, opciones) {
    const tolerancia = opciones && opciones.toleranciaDias != null ? opciones.toleranciaDias : 3;
    const porMonto = new Map();
    libro.forEach((l) => {
      const k = Math.round(l.monto);
      if (!porMonto.has(k)) porMonto.set(k, []);
      porMonto.get(k).push(l);
    });

    const usados = new Set();
    const pares = [];
    const soloBanco = [];
    [...banco].sort((a, b) => a.fecha - b.fecha).forEach((b) => {
      let mejor = null;
      let menorDif = Infinity;
      (porMonto.get(Math.round(b.monto)) || []).forEach((l) => {
        if (usados.has(l.id)) return;
        const dif = Math.abs(l.fecha - b.fecha) / DIA;
        if (dif <= tolerancia && dif < menorDif) { menorDif = dif; mejor = l; }
      });
      if (mejor) {
        usados.add(mejor.id);
        pares.push({ banco: b, libro: mejor, dias: Math.round(menorDif) });
      } else {
        soloBanco.push(b);
      }
    });
    const soloLibro = libro.filter((l) => !usados.has(l.id)).sort((a, b) => a.fecha - b.fecha);

    // Mismo monto pero fuera de la tolerancia: se proponen para revisión manual.
    const sugerencias = [];
    const sugeridos = new Set();
    soloBanco.forEach((b) => {
      const l = soloLibro.find((x) => !sugeridos.has(x.id) && Math.round(x.monto) === Math.round(b.monto));
      if (l) {
        sugeridos.add(l.id);
        sugerencias.push({ banco: b, libro: l, dias: Math.round(Math.abs(l.fecha - b.fecha) / DIA) });
      }
    });

    return { pares, soloBanco, soloLibro, sugerencias };
  }

  const suma = (lista) => lista.reduce((a, m) => a + m.monto, 0);

  function estadoConciliacion(resultado, saldoBanco, saldoLibro) {
    const depositosEnTransito = suma(resultado.soloLibro.filter((m) => m.monto > 0));
    const chequesNoCobrados = -suma(resultado.soloLibro.filter((m) => m.monto < 0));
    const abonosNoRegistrados = suma(resultado.soloBanco.filter((m) => m.monto > 0));
    const cargosNoRegistrados = -suma(resultado.soloBanco.filter((m) => m.monto < 0));
    const saldoBancoAjustado = saldoBanco + depositosEnTransito - chequesNoCobrados;
    const saldoLibroAjustado = saldoLibro + abonosNoRegistrados - cargosNoRegistrados;
    return {
      saldoBanco, saldoLibro, depositosEnTransito, chequesNoCobrados,
      abonosNoRegistrados, cargosNoRegistrados, saldoBancoAjustado, saldoLibroAjustado,
      diferencia: saldoBancoAjustado - saldoLibroAjustado,
    };
  }

  // CSV con ";" y BOM, que Excel en español abre directamente.
  function aCSV(filas) {
    const celda = (v) => {
      const s = v == null ? "" : String(v);
      return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    return "﻿" + filas.map((f) => f.map(celda).join(";")).join("\r\n");
  }

  const api = {
    parseMonto, parseFecha, detectarEncabezado, detectarColumnas, normalizar,
    conciliar, estadoConciliacion, aCSV,
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else raiz.ConciliaGOMotor = api;
})(this);
