
const NominaService = require('../services/NominaService');

class NominaController {

    async generar(req, res) {
        try {
            const {
                id_sucursal,
                periodo_inicio,
                periodo_fin,
                fecha_pago
            } = req.body;

            if (
                !id_sucursal ||
                !periodo_inicio ||
                !periodo_fin ||
                !fecha_pago
            ) {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'Debes enviar todos los datos de la planilla.'
                });
            }

            const planilla = await NominaService.generarPlanilla({
                id_sucursal,
                periodo_inicio,
                periodo_fin,
                fecha_pago
            });

            return res.status(201).json({
                ok: true,
                mensaje: 'Planilla generada correctamente.',
                planilla
            });

        } catch (error) {
            if (error.statusCode === 409) {
                return res.status(409).json({
                    ok: false,
                    mensaje: error.message
                });
            }

            if (error.statusCode === 400) {
                return res.status(400).json({
                    ok: false,
                    mensaje: error.message
                });
            }

            console.error('Error al generar nómina:', error.message);

            return res.status(500).json({
                ok: false,
                mensaje: 'No fue posible generar la planilla por un error interno.'
            });
        }
    }

    async listar(req, res) {
        try {
            const planillas = await NominaService.obtenerPlanillas(
                req.query.id_sucursal
            );

            return res.status(200).json({
                ok: true,
                cantidad: planillas.length,
                planillas
            });

        } catch (error) {
            if (error.message && error.message.includes('id_sucursal')) {
                return res.status(400).json({
                    ok: false,
                    mensaje: error.message
                });
            }

            console.error('Error al consultar nómina:', error.message);

            return res.status(500).json({
                ok: false,
                mensaje: 'No fue posible consultar las planillas.'
            });
        }
    }
}

module.exports = new NominaController();
