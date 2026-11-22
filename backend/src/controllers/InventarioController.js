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

    //para registrar nuevo insumo base:

    async crearInsumo(req, res) { //registrara una nueva materia prima
        try {
            const { nombre, unidad } = req.body;
            if (!nombre || !unidad) { //debe de tener un nombre y la unidad que se registrara
                return res.status(400).json({
                    ok: false,
                    mensaje: 'Los campos "nombre" y "unidad" son obligatorios para poder registrar un insumo'
                });
            }

            const insumoCreado = await Inventariorecetas.crearInsumo(req.body);
            return res.status(201).json({
                ok: true,
                insumo: insumoCreado
            });
        } catch (error) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al registrar el insumo',
                detalle: error.message
            });
        }
    }

    //para consultar los productos del menu que se preparan con receta

    async obtenerProductosElaborados(req, res) {
        try {
            const elaborados = await Inventariorecetas.obtenerProductosElaborados();

            return res.status(200).json({
                ok: true,
                elaborados
            });
        } catch (error) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al obtener los productos elaborados',
                detalle: error.message
            });
        }
    }

    //ingredientes que lleva un producto elaborado

    async obtenerReceta(req, res) {
        try {
            const idProducto = Number(req.params.idProducto);

            if (!Number.isInteger(idProducto) || idProducto <= 0) {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'El parámetro "idProducto" debe ser un número entero válido.'
                });
            }

            const ingredientes = await Inventariorecetas.obtenerReceta(idProducto);

            return res.status(200).json({
                ok: true,
                ingredientes
            });
        } catch (error) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al obtener la receta del producto.',
                detalle: error.message
            });
        }
    }



    //para agregar un ingredietne a la receta de un producto elaborado
    async guardarInsumoreceta(req, res) {
        try {
            const { id_producto_elaborado, id_insumo, cantidad_requerida } = req.body;

            if (!id_producto_elaborado || !id_insumo || cantidad_requerida === undefined || Number(cantidad_requerida) <= 0) {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'Debes enviar "id_producto_elaborado", "id_insumo" y una "cantidad_requerida" mayor a 0.'
                });
            }

            const resultado = await Inventariorecetas.guardarInsumoreceta({
                id_producto_elaborado: Number(id_producto_elaborado),
                id_insumo: Number(id_insumo),
                cantidad_requerida: Number(cantidad_requerida)
            });

            return res.status(200).json({
                ok: true,
                ...resultado
            });
        } catch (error) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al guardar el ingrediente en la receta.',
                detalle: error.message
            });
        }
    }

    //quita el ingrediente de una receta 
    async eliminarInsumoReceta(req, res) {
        try {
            const idReceta = Number(req.params.idReceta);

            if (!Number.isInteger(idReceta) || idReceta <= 0) {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'El parámetro "idReceta" debe ser un número entero válido.'
                });
            }

            const resultado = await Inventariorecetas.eliminarInsumoReceta(idReceta);

            return res.status(200).json({
                ok: true,
                ...resultado
            });
        } catch (error) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al eliminar el ingrediente de la receta.',
                detalle: error.message
            });
        }
    }
}

module.exports = new InventarioController();