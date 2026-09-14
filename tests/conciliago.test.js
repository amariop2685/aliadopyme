/* Pruebas del motor de ConciliaGO. Ejecutar: node tests/conciliago.test.js */
const assert = require("assert");
const M = require("../js/conciliago-motor.js");

let pasadas = 0;
function prueba(nombre, fn) {
  fn();
  pasadas++;
  console.log("✓", nombre);
}

const iso = (f) => f.toISOString().slice(0, 10);

prueba("montos en formato chileno", () => {
  assert.strictEqual(M.parseMonto("1.234.567"), 1234567);
  assert.strictEqual(M.parseMonto("-45.000"), -45000);
  assert.strictEqual(M.parseMonto("$ 12.500"), 12500);
  assert.strictEqual(M.parseMonto("(3.000)"), -3000);
  assert.strictEqual(M.parseMonto("1234,5"), 1234.5);
  assert.strictEqual(M.parseMonto(1500), 1500);
  assert.strictEqual(M.parseMonto(""), 0);
  assert.ok(Number.isNaN(M.parseMonto("abc")));
});

prueba("fechas en distintos formatos", () => {
  assert.strictEqual(iso(M.parseFecha("05/09/2026")), "2026-09-05");
  assert.strictEqual(iso(M.parseFecha("5-9-26")), "2026-09-05");
  assert.strictEqual(iso(M.parseFecha("2026-09-05")), "2026-09-05");
  const serial = (Date.UTC(2026, 8, 5) - Date.UTC(1899, 11, 30)) / 86400000;
  assert.strictEqual(iso(M.parseFecha(serial)), "2026-09-05");
  assert.strictEqual(M.parseFecha("31/02/2026"), null);
  assert.strictEqual(M.parseFecha("Saldo inicial"), null);
});

prueba("detecta encabezado y columnas de una cartola", () => {
  const filas = [
    ["Banco Ejemplo - Cartola"], [],
    ["Fecha", "Descripción", "N° Documento", "Cargos", "Abonos", "Saldo"],
    ["01/09/2026", "Depósito", "", "", "500.000", "1.500.000"],
  ];
  const enc = M.detectarEncabezado(filas);
  assert.strictEqual(enc, 2);
  const mapa = M.detectarColumnas(filas[enc]);
  assert.deepStrictEqual(
    [mapa.fecha, mapa.descripcion, mapa.documento, mapa.egreso, mapa.ingreso, mapa.monto],
    [0, 1, 2, 3, 4, -1],
  );
});

prueba("libro con Debe/Haber se normaliza con el mismo signo que el banco", () => {
  const filas = [["Fecha", "Glosa", "Debe", "Haber"], ["02/09/2026", "Cobro cliente", "300.000", ""],
    ["03/09/2026", "Pago proveedor", "", "120.000"], ["", "Total", "300.000", "120.000"]];
  const mapa = M.detectarColumnas(filas[0]);
  const movs = M.normalizar(filas, 0, mapa, "libro");
  assert.deepStrictEqual(movs.map((m) => m.monto), [300000, -120000]);
});

prueba("concilia por monto y fecha cercana, y arma el estado de conciliación", () => {
  const mov = (id, fecha, monto) => ({ id, fecha: M.parseFecha(fecha), monto, descripcion: id });
  const banco = [
    mov("b1", "01/09/2026", 500000),   // concilia con l1 (1 día)
    mov("b2", "05/09/2026", -120000),  // concilia con l2 (mismo día)
    mov("b3", "10/09/2026", -3500),    // comisión no registrada
    mov("b4", "20/09/2026", 80000),    // mismo monto que l4, pero a 12 días: sugerencia
  ];
  const libro = [
    mov("l1", "02/09/2026", 500000),
    mov("l2", "05/09/2026", -120000),
    mov("l3", "28/09/2026", -250000),  // cheque girado no cobrado
    mov("l4", "08/09/2026", 80000),
  ];
  const r = M.conciliar(banco, libro, { toleranciaDias: 3 });
  assert.deepStrictEqual(r.pares.map((p) => [p.banco.id, p.libro.id, p.dias]), [["b1", "l1", 1], ["b2", "l2", 0]]);
  assert.deepStrictEqual(r.soloBanco.map((m) => m.id), ["b3", "b4"]);
  assert.deepStrictEqual(r.soloLibro.map((m) => m.id), ["l4", "l3"]);
  assert.deepStrictEqual(r.sugerencias.map((s) => [s.banco.id, s.libro.id, s.dias]), [["b4", "l4", 12]]);

  const e = M.estadoConciliacion(r, 1000000, 1172500);
  assert.strictEqual(e.depositosEnTransito, 80000);
  assert.strictEqual(e.chequesNoCobrados, 250000);
  assert.strictEqual(e.abonosNoRegistrados, 80000);
  assert.strictEqual(e.cargosNoRegistrados, 3500);
  assert.strictEqual(e.saldoBancoAjustado, 830000);
  assert.strictEqual(e.saldoLibroAjustado, 1249000);
});

prueba("CSV compatible con Excel", () => {
  const csv = M.aCSV([["Fecha", "Glosa"], ["01/09/2026", 'Pago "urgente"; proveedor']]);
  assert.ok(csv.startsWith("﻿"));
  assert.ok(csv.includes('"Pago ""urgente""; proveedor"'));
});

console.log(`\n${pasadas} pruebas de ConciliaGO pasadas`);
