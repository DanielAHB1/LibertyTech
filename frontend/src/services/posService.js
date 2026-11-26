
const API_BASE = '/api/productos';

export const posService = {
  // Consulta los productos de venta de una sucursal.
  async obtenerProductos(idSucursal = 1) {
    // Verifica que la sucursal tenga un ID válido.
    if (!Number.isInteger(idSucursal) || idSucursal <= 0) {
      throw new Error('La sucursal seleccionada no es válida');
    }

    // Solicita el catálogo al backend.
    const response = await fetch(
      `${API_BASE}?id_sucursal=${idSucursal}`,
      {
        method: 'GET',
        headers: { Accept: 'application/json' },
      }
    );

    // Convierte la respuesta del servidor a JSON.
    const data = await response.json().catch(() => ({}));

    // Notifica si el servidor devuelve un error.
    if (!response.ok) {
      throw new Error(
        data.mensaje || `Error HTTP ${response.status} al cargar productos`
      );
    }

    // Devuelve los productos elaborados y de reventa.
    return data.productos || [];
  },
};
