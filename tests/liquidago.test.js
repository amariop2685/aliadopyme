/* Pruebas del motor de LiquidaGO. Ejecutar: node tests/liquidago.test.js
   Los valores esperados están calculados a mano con los indicadores
   de septiembre 2026 (UF 40.873,77 · UTM 71.721 · IMM 553.553). */
const assert = require("assert");
const INDICADORES = require("../js/indicadores.js");
const { calcularLiquidacion, impuestoUnico } = require("../js/liquidago-motor.js");

let pasadas = 0;
function prueba(nombre, fn) {
  fn();
  pasadas++;
  console.log("✓", nombre);
}

prueba("impuesto único: tramo exento y primer tramo", () => {
  assert.strictEqual(impuestoUnico(968233, INDICADORES), 0);
  assert.strictEqual(impuestoUnico(1000000, INDICADORES), 1271); // 40.000 − 38.729,34
});

prueba("sueldo $800.000, Fonasa, Habitat, indefinido, gratificación Art. 50", () => {
  const l = calcularLiquidacion({
    sueldoBase: 800000, gratificacion: "art50", afp: "habitat", salud: "fonasa", contrato: "indefinido",
  }, INDICADORES);
  assert.strictEqual(l.imponibles.gratificacion, 200000);
  assert.strictEqual(l.totalImponible, 1000000);
  assert.strictEqual(l.descuentosLegales.afp, 112700);
  assert.strictEqual(l.descuentosLegales.salud, 70000);
  assert.strictEqual(l.descuentosLegales.cesantia, 6000);
  assert.strictEqual(l.baseTributable, 811300);
  assert.strictEqual(l.descuentosLegales.impuesto, 0);
  assert.strictEqual(l.liquido, 811300);
  assert.strictEqual(l.aportesEmpleador.seguroSocial, 35000);
  assert.strictEqual(l.aportesEmpleador.cesantia, 24000);
  assert.strictEqual(l.aportesEmpleador.mutual, 9300);
  assert.strictEqual(l.costoEmpresa, 1068300);
  assert.deepStrictEqual(l.alertas, []);
});

prueba("sueldo $3.000.000, Isapre 6 UF, Capital: tope de gratificación e impuesto 8%", () => {
  const l = calcularLiquidacion({
    sueldoBase: 3000000, gratificacion: "art50", afp: "capital", salud: "isapre", planIsapreUF: 6,
    contrato: "indefinido",
  }, INDICADORES);
  assert.strictEqual(l.imponibles.gratificacion, 219115); // tope 4,75 IMM / 12
  assert.strictEqual(l.totalImponible, 3219115);
  assert.strictEqual(l.descuentosLegales.afp, 368267);
  assert.strictEqual(l.descuentosLegales.salud, 245243); // plan 6 UF > 7%
  assert.strictEqual(l.adicionalIsapre, 245243 - 225338);
  assert.strictEqual(l.descuentosLegales.cesantia, 19315);
  assert.strictEqual(l.baseTributable, 2586290);
  assert.strictEqual(l.descuentosLegales.impuesto, 82109);
  assert.strictEqual(l.liquido, 2504181);
});

prueba("sueldo $5.000.000 sobre tope, ProVida, plazo fijo: cotiza sobre 90 UF", () => {
  const l = calcularLiquidacion({
    sueldoBase: 5000000, gratificacion: "ninguna", afp: "provida", salud: "fonasa", contrato: "plazo_fijo",
  }, INDICADORES);
  assert.strictEqual(l.descuentosLegales.afp, 421204);
  assert.strictEqual(l.descuentosLegales.salud, 257505);
  assert.strictEqual(l.descuentosLegales.cesantia, 0);
  assert.strictEqual(l.baseTributable, 4321291);
  assert.strictEqual(l.descuentosLegales.impuesto, 261347);
  assert.strictEqual(l.aportesEmpleador.cesantia, 150000);
  assert.strictEqual(l.aportesEmpleador.seguroSocial, 128752);
  assert.strictEqual(l.aportesEmpleador.mutual, 34211);
  assert.ok(l.alertas.some((a) => a.includes("tope")));
});

prueba("sueldo mínimo, 20 días, 10 horas extra, 2 cargas, colación", () => {
  const l = calcularLiquidacion({
    sueldoBase: 553553, diasTrabajados: 20, jornadaSemanal: 42, horasExtra: 10, gratificacion: "art50",
    afp: "uno", salud: "fonasa", contrato: "indefinido", cargasFamiliares: 2, colacion: 50000,
  }, INDICADORES);
  assert.strictEqual(l.imponibles.sueldo, 369035);
  assert.strictEqual(l.imponibles.horasExtra, 46129);
  assert.strictEqual(l.imponibles.gratificacion, 103791);
  assert.strictEqual(l.totalImponible, 518955);
  assert.strictEqual(l.noImponibles.asignacionFamiliar, 45202);
  assert.strictEqual(l.totalHaberes, 614157);
  assert.strictEqual(l.descuentosLegales.afp, 54283);
  assert.strictEqual(l.descuentosLegales.salud, 36327);
  assert.strictEqual(l.descuentosLegales.cesantia, 3114);
  assert.strictEqual(l.descuentosLegales.impuesto, 0);
  assert.strictEqual(l.liquido, 520433);
  assert.deepStrictEqual(l.alertas, []);
});

prueba("alerta de sueldo bajo el mínimo", () => {
  const l = calcularLiquidacion({ sueldoBase: 400000, afp: "modelo", salud: "fonasa" }, INDICADORES);
  assert.ok(l.alertas.some((a) => a.includes("ingreso mínimo")));
});

console.log(`\n${pasadas} pruebas de LiquidaGO pasadas`);
