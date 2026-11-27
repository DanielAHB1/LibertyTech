export const CLAVE_TOKEN = "origenes_token";

export class ErrorApi extends Error {
  constructor(mensaje, estado, datos) {
    super(mensaje);
    this.estado = estado;
    this.datos = datos;
  }
}

export async function solicitud(ruta, { metodo = "GET", cuerpo } = {}) {
  const token = sessionStorage.getItem(CLAVE_TOKEN);
  const headers = { Accept: "application/json" };
  if (cuerpo !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  let respuesta;
  try {
    respuesta = await fetch(`/api${ruta}`, {
      method: metodo,
      headers,
      body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined,
    });
  } catch {
    throw new ErrorApi("No se pudo conectar con el servidor. Verifica que el backend esté encendido.", 0);
  }

  const datos = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) {
    const porEstado = {
      400: "Los datos enviados no son válidos.",
      401: "Tu sesión no es válida. Inicia sesión de nuevo.",
      403: "No tienes permiso para realizar esta acción.",
      404: "El recurso solicitado no existe.",
      500: "Error interno del servidor.",
    };
    throw new ErrorApi(datos.mensaje || porEstado[respuesta.status] || `Error HTTP ${respuesta.status}`, respuesta.status, datos);
  }
  return datos;
}