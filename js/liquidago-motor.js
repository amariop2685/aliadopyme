/* ============================================================
   LiquidaGO — motor de cálculo de liquidaciones de sueldo (Chile)
   Funciones puras: reciben los datos del trabajador y los
   indicadores, y devuelven el detalle completo. Sin DOM, para
   poder probarse con Node (tests/liquidago.test.js).
   ============================================================ */
(function (raiz) {
  "use strict";

  const r = Math.round;
  const num = (v) => Math.max(0, Number(v) || 0);
  const sumar = (obj) => Object.values(obj).reduce((a, b) => a + b, 0);

  function impuestoUnico(base, ind) {
    const t = ind.impuestoUnico.find((x) => base <= x.hastaUTM * ind.utm);
    return Math.max(0, r(base * t.factor - t.rebajaUTM * ind.utm));
  }

  function calcularLiquidacion(d, ind) {
    const afpInfo = ind.afp[d.afp];
    if (!afpInfo) throw new Error(`AFP desconocida: ${d.afp}`);
    const contrato = ind.cesantia[d.contrato] || ind.cesantia.indefinido;

    // ---- Haberes imponibles
    const dias = d.diasTrabajados == null ? 30 : Math.min(30, num(d.diasTrabajados));
    const jornada = num(d.jornadaSemanal) || ind.jornadaMaxima;
    const sueldoBase = num(d.sueldoBase);
    const sueldo = r((sueldoBase * dias) / 30);

    // Fórmula DT: sueldo / 30 × 28 / (horas semanales × 4), con recargo.
    const recargo = d.recargoHorasExtra == null ? 0.5 : num(d.recargoHorasExtra);
    const valorHoraExtra = ((sueldoBase / 30) * 28) / (jornada * 4) * (1 + recargo);
    const horasExtra = r(valorHoraExtra * num(d.horasExtra));
    const bonos = r(num(d.bonosImponibles));

    let gratificacion = 0;
    const topeGratificacion = r((ind.gratificacion.topeIMMAnual * ind.sueldoMinimo) / 12);
    if (d.gratificacion === "art50") {
      gratificacion = Math.min(r((sueldo + horasExtra + bonos) * ind.gratificacion.tasa), topeGratificacion);
    } else if (d.gratificacion === "monto") {
      gratificacion = r(num(d.gratificacionMonto));
    }

    const imponibles = { sueldo, horasExtra, gratificacion, bonos };
    const totalImponible = sumar(imponibles);

    // ---- Topes
    const topeAfp = ind.topes.afpUF * ind.uf;
    const baseAfp = Math.min(totalImponible, topeAfp);
    const baseCesantia = Math.min(totalImponible, ind.topes.cesantiaUF * ind.uf);

    // ---- Haberes no imponibles
    const cargas = Math.floor(num(d.cargasFamiliares));
    const montoPorCarga = ind.asignacionFamiliar.find((t) => totalImponible <= t.hasta).monto;
    const noImponibles = {
      colacion: r(num(d.colacion)),
      movilizacion: r(num(d.movilizacion)),
      viaticos: r(num(d.viaticos)),
      asignacionFamiliar: cargas * montoPorCarga,
    };
    const totalNoImponible = sumar(noImponibles);
    const totalHaberes = totalImponible + totalNoImponible;

    // ---- Descuentos legales
    const afp = r(baseAfp * afpInfo.tasa);
    const saludLegal = r(baseAfp * ind.salud.legal);
    let salud = saludLegal;
    if (d.salud === "isapre") salud = Math.max(saludLegal, r(num(d.planIsapreUF) * ind.uf));
    const adicionalIsapre = salud - saludLegal;
    const cesantia = r(baseCesantia * contrato.trabajador);
    const apv = Math.min(r(num(d.apvRegimenB)), r(ind.topes.apvMensualUF * ind.uf));

    // Base tributable: la salud (incluido el adicional Isapre) se rebaja
    // solo hasta el 7% del tope imponible (criterio SII).
    const saludRebajable = Math.min(salud, r(topeAfp * ind.salud.legal));
    const baseTributable = Math.max(0, totalImponible - afp - saludRebajable - cesantia - apv);
    const impuesto = impuestoUnico(baseTributable, ind);

    const descuentosLegales = { afp, salud, cesantia, impuesto, apv };
    const totalDescuentosLegales = sumar(descuentosLegales);

    const otrosDescuentos = {
      anticipos: r(num(d.anticipos)),
      prestamos: r(num(d.prestamos)),
      otros: r(num(d.otrosDescuentos)),
    };
    const totalOtrosDescuentos = sumar(otrosDescuentos);

    const liquido = totalHaberes - totalDescuentosLegales - totalOtrosDescuentos;

    // ---- Costo del empleador
    const ss = ind.seguroSocialEmpleador;
    const mutualTasa = d.mutualTasa == null || d.mutualTasa === "" ? ind.mutualBasica : num(d.mutualTasa);
    const aportesEmpleador = {
      seguroSocial: r(baseAfp * ss.total),
      cesantia: r(baseCesantia * contrato.empleador),
      mutual: r(baseAfp * mutualTasa),
    };
    const totalAportesEmpleador = sumar(aportesEmpleador);
    const costoEmpresa = totalHaberes + totalAportesEmpleador;

    // ---- Alertas
    const alertas = [];
    const minimoProporcional = r((ind.sueldoMinimo * jornada) / ind.jornadaMaxima);
    if (sueldoBase > 0 && sueldoBase < minimoProporcional) {
      alertas.push(`El sueldo base es inferior al ingreso mínimo para una jornada de ${jornada} horas `
        + `($${minimoProporcional.toLocaleString("es-CL")}).`);
    }
    if (jornada > ind.jornadaMaxima) {
      alertas.push(`La jornada supera el máximo legal de ${ind.jornadaMaxima} horas semanales.`);
    }
    if (num(d.horasExtra) > 12) {
      alertas.push("Las horas extra no pueden exceder 2 por día (≈ 12 a la semana).");
    }
    if (totalImponible > topeAfp) {
      alertas.push(`La renta imponible supera el tope de ${ind.topes.afpUF} UF: AFP, salud y aportes `
        + "del empleador se calculan sobre el tope.");
    }
    if (liquido < 0) alertas.push("Los descuentos superan los haberes: revisa anticipos y préstamos.");

    return {
      dias, jornada, afpNombre: afpInfo.nombre, afpTasa: afpInfo.tasa, contratoNombre: contrato.nombre,
      valorHoraExtra: r(valorHoraExtra), topeGratificacion, montoPorCarga, cargas,
      imponibles, totalImponible, noImponibles, totalNoImponible, totalHaberes,
      baseAfp, baseCesantia, topeAfp: r(topeAfp),
      descuentosLegales, adicionalIsapre, saludRebajable, baseTributable, totalDescuentosLegales,
      otrosDescuentos, totalOtrosDescuentos, liquido,
      aportesEmpleador, totalAportesEmpleador, costoEmpresa, mutualTasa,
      alertas,
    };
  }

  const api = { calcularLiquidacion, impuestoUnico };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else raiz.LiquidaGOMotor = api;
})(this);
