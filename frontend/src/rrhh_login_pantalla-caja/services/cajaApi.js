import { solicitud } from "./http.js";

export async function obtenerCajaActiva(id_sucursal) {
  try {
    const datos = await solicitud(`/caja/activa/${id_sucursal}`);
    return datos.caja || null;
  } catch (e) {
    if (e.estado === 404) return null; // no hay caja abierta: no es un error
    throw e;
  }
}

export async function abrirCaja({ id_sucursal, id_empleado, monto_inicial }) {
  return solicitud("/caja/abrir", { metodo: "POST", cuerpo: { id_sucursal, id_empleado, monto_inicial } });
}

export async function cerrarCaja(id_caja, { efectivo_fisico, tarjeta_voucher, bitcoin_confirmado }) {
  return solicitud(`/caja/cerrar/${id_caja}`, {
    metodo: "PUT",
    cuerpo: { efectivo_fisico, tarjeta_voucher, bitcoin_confirmado },
  });
}