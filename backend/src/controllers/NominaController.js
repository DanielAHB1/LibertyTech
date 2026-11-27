const NominaService = require('../services/NominaService');

class NominaController {

    // GENERAR PLANILLA

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

                    mensaje:
                        'Debes enviar id_sucursal, periodo_inicio, periodo_fin y fecha_pago.'

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

                mensaje: 'Planilla quincenal generada correctamente.',

                planilla

            });

        } catch (error) {

            console.error('Error al generar planilla:', error);

            const esValidacion =
                /debe ser|no puede ser|no existen|formato|no es una fecha/.test(
                    error.message
                );

            return res.status(esValidacion ? 400 : 500).json({

                ok: false,

                mensaje: error.message ||
                    'Error al generar la planilla.'

            });

        }

    }

    // CONSULTAR PLANILLAS

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

            console.error('Error al consultar planillas:', error);

            return res.status(400).json({

                ok: false,

                mensaje: error.message ||
                    'Error al consultar las planillas.'

            });

        }

    }

}

module.exports = new NominaController();