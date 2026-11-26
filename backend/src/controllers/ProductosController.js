const { getPool, sql } = require('../config/db');

const listarProductosVenta = async (req, res) => {
  const idSucursal = Number(req.query.id_sucursal ?? 1);

  if (!Number.isInteger(idSucursal) || idSucursal <= 0) {
    return res.status(400).json({ ok: false, mensaje: 'id_sucursal debe ser un entero positivo' });
  }

  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('id_sucursal', sql.Int, idSucursal)
      .query(`
        SELECT id_producto, nombre, tipo, precio, unidad, stock_actual
        FROM Productos
        WHERE id_sucursal = @id_sucursal AND tipo IN ('ELABORADO', 'REVENTA')
        ORDER BY tipo, nombre`);

    res.json({ ok: true, productos: result.recordset });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error al listar los productos', error: error.message });
  }
};

module.exports = { listarProductosVenta };