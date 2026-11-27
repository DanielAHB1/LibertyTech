const express = require('express');
const cors = require('cors');
const { getPool } = require('./config/db');
const cajaRoutes = require('./routes/CajaRoutes');
const VentasRoutes = require('./routes/VentasRoutes');
const InventarioRoutes = require('./routes/InventarioRoutes');
const productosRoutes = require('./routes/ProductosRoutes');
const nominaRoutes = require('./routes/NominaRoutes');

const app = express();
app.use(cors());
app.use(express.json());

// para probar la conexion con LibertyTech :=), antes de empezar a realizar cada parte que les toca
// prueben que la base de datos les funcione correctamente 
app.get('/api/prueba', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .query('SELECT id_sucursal, nombre, correlativo_fcf, correlativo_ccf FROM Sucursal');

    res.json({
      ok: true,
      mensaje: 'Conexión activa con LibertyTech',
      sucursales: result.recordset,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      mensaje: 'Error al consultar SQL Server',
      error: error.message,
    });
  }
});

app.use('/api/caja', cajaRoutes);
app.use('/api/ventas', VentasRoutes);
app.use('/api/inventario', InventarioRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/nomina', nominaRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});