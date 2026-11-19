const Inventariorecetas = require('../services/Inventariorecetas');

class InventarioController {
    async descontarPorVenta(req, res) {
        try {
            // Endpoint para descontar inventario a partir de los productos que se han vendido en un pedido o venta
            const productosVendidos = Array.isArray(req.body) ? req.body : req.body?.productosVendidos;

            // Valida que haya al menos un producto
            if (!Array.isArray(productosVendidos) || productosVendidos.length === 0) {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'Debes de tener al menos un producto en "productosVendidos" con productoId y cantidad'
                });
            }

            const resultado = await Inventariorecetas.descontarporventa(productosVendidos);

            // Responderá con 200 y el resumen además de las alertas generadas por el servicio
            return res.status(200).json({
                ok: true,
                ...resultado
            });
        } catch (error) {
            const msm = error.message || 'Error al procesar el descuento de inventario';
            const esErrorValidacion =
                msm.includes('invalido') ||
                msm.includes('no existe') ||
                msm.includes('no tiene una receta') ||
                msm.includes('Tipo de producto no valido') ||
                msm.includes('Stock insuficiente');

            return res.status(esErrorValidacion ? 400 : 500).json({
                ok: false,
                mensaje: msm
            });
        }
    }
    //consultar ele stado actual del inventario (los insumos y los productos de reventa)
    async obtenerEstadoInventario(req, res) {
        try {
            const estado = await Inventariorecetas.obtenerEstadoInventario();
            return res.status(200).json({
                ok: true,
                ...estado
            });
        } catch (error) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al obtener el estado del inventario',
                detalle: error.message
            });
        }
    }

    async obtenerAlertas(req, res) {
        try {
            const alertas = await Inventariorecetas.obtenerAlertasStockMinimo();
            return res.status(200).json({
                ok: true,
                alertasStockMinimo: alertas
            });
        } catch (error) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al obtener las alertas de stock minimo',
                detalle: error.message
            });
        }
    }
}

module.exports = new InventarioController();