import { CARGOS } from "./formato.js";

export function validarEmpleado(e) {
    const errores = {};
    const soloLetras = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' ]+$/;
    if (!e.nombre?.trim()) errores.nombre = "El nombre es obligatorio.";
    else if (!soloLetras.test(e.nombre.trim())) errores.nombre = "Solo se permiten letras.";
    if (!e.apellido?.trim()) errores.apellido = "El apellido es obligatorio.";
    else if (!soloLetras.test(e.apellido.trim())) errores.apellido = "Solo se permiten letras.";
    if (!/^\d{8}-\d$/.test(e.dui || "")) errores.dui = "Formato de DUI: 00000000-0.";
    if (!CARGOS.includes(e.cargo)) errores.cargo = "Selecciona un puesto.";
    if (!e.id_sucursal) errores.id_sucursal = "Selecciona una sucursal.";
    const s = Number(e.salario_mensual);
    if (e.salario_mensual === "" || Number.isNaN(s)) errores.salario_mensual = "Ingresa el salario.";
    else if (s <= 0) errores.salario_mensual = "El salario debe ser mayor que 0.";
    return errores;
}

export function validarMonto(valor, { permitirCero = true } = {}) {
    if (valor === "" || valor === null) return "Ingresa un monto.";
    const n = Number(valor);
    if (Number.isNaN(n)) return "El monto no es válido.";
    if (n < 0 || (!permitirCero && n === 0)) return "El monto no puede ser negativo.";
    if (!/^\d+(\.\d{1,2})?$/.test(String(valor))) return "Máximo dos decimales.";
    return null;
}

export function validarPeriodo({ id_sucursal, periodo_inicio, periodo_fin, fecha_pago }) {
    const errores = {};
    if (!id_sucursal) errores.id_sucursal = "Selecciona una sucursal.";
    if (!periodo_inicio) errores.periodo_inicio = "Fecha requerida.";
    if (!periodo_fin) errores.periodo_fin = "Fecha requerida.";
    if (periodo_inicio && periodo_fin && periodo_fin < periodo_inicio) errores.periodo_fin = "Debe ser posterior al inicio.";
    if (!fecha_pago) errores.fecha_pago = "Fecha requerida.";
    else if (periodo_fin && fecha_pago < periodo_fin) errores.fecha_pago = "No puede ser antes del fin del período.";
    return errores;
}
