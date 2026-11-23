const API_BASE = '/api/inventario';

const procesarRespuesta = async (response, mensajeErrorDefault) => {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detalle = data.detalle || data.error ? ` (${data.detalle || data.error})` : '';
    throw new Error(`${data.mensaje || mensajeErrorDefault}${detalle}`);
  }
  return data;
};

export const inventarioService = {
  // GET /api/inventario/estado
  async obtenerEstado() {
    const response = await fetch(`${API_BASE}/estado`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    const data = await procesarRespuesta(
      response,
      `Error HTTP ${response.status} al consultar el inventario`
    );
    return {
      insumos: data.insumos || [],
      productosReventa: data.productosReventa || [],
    };
  },

  // GET /api/inventario/alertas
  async obtenerAlertas() {
    const response = await fetch(`${API_BASE}/alertas`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    const data = await procesarRespuesta(
      response,
      `Error HTTP ${response.status} al consultar alertas de stock`
    );
    return data.alertasStockMinimo || [];
  },

  // POST /api/inventario/insumos
  async crearInsumo(insumo) {
    const response = await fetch(`${API_BASE}/insumos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(insumo),
    });
    return await procesarRespuesta(
      response,
      `Error HTTP ${response.status} al registrar el insumo`
    );
  },

  // GET /api/inventario/elaborados
  async obtenerProductosElaborados() {
    const response = await fetch(`${API_BASE}/elaborados`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    const data = await procesarRespuesta(
      response,
      `Error HTTP ${response.status} al cargar el menú elaborado`
    );
    return data.elaborados || [];
  },

  // GET /api/inventario/recetas/:idProducto
  async obtenerReceta(idProducto) {
    const response = await fetch(`${API_BASE}/recetas/${idProducto}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    const data = await procesarRespuesta(
      response,
      `Error HTTP ${response.status} al consultar la receta`
    );
    return data.ingredientes || [];
  },

  // POST /api/inventario/recetas/insumo
  async guardarInsumoReceta(item) {
    const response = await fetch(`${API_BASE}/recetas/insumo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(item),
    });
    return await procesarRespuesta(
      response,
      `Error HTTP ${response.status} al guardar el ingrediente en la receta`
    );
  },

  // DELETE /api/inventario/recetas/insumo/:idReceta
  async eliminarInsumoReceta(idReceta) {
    const response = await fetch(`${API_BASE}/recetas/insumo/${idReceta}`, {
      method: 'DELETE',
      headers: { Accept: 'application/json' },
    });
    return await procesarRespuesta(
      response,
      `Error HTTP ${response.status} al eliminar el ingrediente`
    );
  },
};