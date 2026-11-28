
const { getPool, sql } = require('../config/db');

const CARGOS_VALIDOS = ['GERENTE', 'BARISTA', 'CAJERO'];

class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.statusCode = 400;
    }
}

function validarEmpleado(datos) {
    const {
        nombre,
        apellido,
        cargo,
        dui,
        salario_mensual,
        id_sucursal
    } = datos;

    if (typeof nombre !== 'string' || !nombre.trim()) {
        throw new ValidationError('El nombre es obligatorio.');
    }

    if (typeof apellido !== 'string' || !apellido.trim()) {
        throw new ValidationError('El apellido es obligatorio.');
    }

    const cargoNormalizado = String(cargo || '').trim().toUpperCase();

    if (!CARGOS_VALIDOS.includes(cargoNormalizado)) {
        throw new ValidationError(
            'El cargo debe ser GERENTE, BARISTA o CAJERO.'
        );
    }

    const duiNormalizado = String(dui || '').trim();

    if (!/^\d{8}-\d$/.test(duiNormalizado)) {
        throw new ValidationError(
            'El DUI debe tener el formato 00000000-0.'
        );
    }

    const salario = Number(salario_mensual);

    if (!Number.isFinite(salario) || salario <= 0) {
        throw new ValidationError(
            'El salario mensual debe ser un número mayor a cero.'
        );
    }

    const sucursal = Number(id_sucursal);

    if (!Number.isInteger(sucursal) || sucursal <= 0) {
        throw new ValidationError(
            'La sucursal debe ser un identificador válido.'
        );
    }

    return {
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        cargo: cargoNormalizado,
        dui: duiNormalizado,
        salario_mensual: salario,
        id_sucursal: sucursal
    };
}

function responderError(res, error, operacion) {
    if (error instanceof ValidationError) {
        return res.status(400).json({
            ok: false,
            mensaje: error.message
        });
    }

    console.error(`Error en ${operacion}:`, error.message);

    return res.status(500).json({
        ok: false,
        mensaje: 'Ocurrió un error interno al procesar la solicitud.'
    });
}

class EmpleadosController {

    // 1. LISTAR EMPLEADOS

    async listar(req, res) {
        try {
            const pool = await getPool();

            const resultado = await pool.request().query(`
                SELECT
                    e.id_empleado,
                    e.id_sucursal,
                    s.nombre AS nombre_sucursal,
                    e.nombre,
                    e.apellido,
                    e.cargo,
                    e.dui,
                    e.salario_mensual
                FROM Empleado e
                INNER JOIN Sucursal s
                    ON e.id_sucursal = s.id_sucursal
                ORDER BY e.id_empleado
            `);

            return res.status(200).json({
                ok: true,
                cantidad: resultado.recordset.length,
                empleados: resultado.recordset
            });

        } catch (error) {
            return responderError(res, error, 'listar empleados');
        }
    }

    // 2. OBTENER EMPLEADO POR ID

    async obtenerUno(req, res) {
        try {
            const id = Number(req.params.id);

            if (!Number.isInteger(id) || id <= 0) {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'El ID del empleado no es válido.'
                });
            }

            const pool = await getPool();

            const resultado = await pool.request()
                .input('id_empleado', sql.Int, id)
                .query(`
                    SELECT
                        e.id_empleado,
                        e.id_sucursal,
                        s.nombre AS nombre_sucursal,
                        e.nombre,
                        e.apellido,
                        e.cargo,
                        e.dui,
                        e.salario_mensual
                    FROM Empleado e
                    INNER JOIN Sucursal s
                        ON e.id_sucursal = s.id_sucursal
                    WHERE e.id_empleado = @id_empleado
                `);

            if (resultado.recordset.length === 0) {
                return res.status(404).json({
                    ok: false,
                    mensaje: 'El empleado no existe.'
                });
            }

            return res.status(200).json({
                ok: true,
                empleado: resultado.recordset[0]
            });

        } catch (error) {
            return responderError(res, error, 'obtener empleado');
        }
    }

    // 3. CREAR EMPLEADO

    async crear(req, res) {
        try {
            const datos = validarEmpleado(req.body);

            const pool = await getPool();

            const sucursal = await pool.request()
                .input('id_sucursal', sql.Int, datos.id_sucursal)
                .query(`
                    SELECT id_sucursal
                    FROM Sucursal
                    WHERE id_sucursal = @id_sucursal
                `);

            if (sucursal.recordset.length === 0) {
                return res.status(409).json({
                    ok: false,
                    mensaje: 'La sucursal indicada no existe.'
                });
            }

            const duplicado = await pool.request()
                .input('dui', sql.NVarChar(10), datos.dui)
                .query(`
                    SELECT id_empleado
                    FROM Empleado
                    WHERE dui = @dui
                `);

            if (duplicado.recordset.length > 0) {
                return res.status(409).json({
                    ok: false,
                    mensaje: 'Ya existe un empleado registrado con ese DUI.'
                });
            }

            const resultado = await pool.request()
                .input('id_sucursal', sql.Int, datos.id_sucursal)
                .input('nombre', sql.NVarChar(100), datos.nombre)
                .input('apellido', sql.NVarChar(100), datos.apellido)
                .input('cargo', sql.NVarChar(30), datos.cargo)
                .input('dui', sql.NVarChar(10), datos.dui)
                .input(
                    'salario_mensual',
                    sql.Decimal(10, 2),
                    datos.salario_mensual
                )
                .query(`
                    INSERT INTO Empleado (
                        id_sucursal,
                        nombre,
                        apellido,
                        cargo,
                        dui,
                        salario_mensual
                    )
                    OUTPUT INSERTED.id_empleado
                    VALUES (
                        @id_sucursal,
                        @nombre,
                        @apellido,
                        @cargo,
                        @dui,
                        @salario_mensual
                    )
                `);

            return res.status(201).json({
                ok: true,
                mensaje: 'Empleado creado correctamente.',
                id_empleado: resultado.recordset[0].id_empleado
            });

        } catch (error) {
            if (error.number === 2627 || error.number === 2601) {
                return res.status(409).json({
                    ok: false,
                    mensaje: 'Ya existe un empleado registrado con ese DUI.'
                });
            }

            return responderError(res, error, 'crear empleado');
        }
    }

    // 4. ACTUALIZAR EMPLEADO

    async actualizar(req, res) {
        try {
            const id = Number(req.params.id);

            if (!Number.isInteger(id) || id <= 0) {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'El ID del empleado no es válido.'
                });
            }

            const datos = validarEmpleado(req.body);

            const pool = await getPool();

            const empleado = await pool.request()
                .input('id_empleado', sql.Int, id)
                .query(`
                    SELECT id_empleado
                    FROM Empleado
                    WHERE id_empleado = @id_empleado
                `);

            if (empleado.recordset.length === 0) {
                return res.status(404).json({
                    ok: false,
                    mensaje: 'El empleado que deseas actualizar no existe.'
                });
            }

            const sucursal = await pool.request()
                .input('id_sucursal', sql.Int, datos.id_sucursal)
                .query(`
                    SELECT id_sucursal
                    FROM Sucursal
                    WHERE id_sucursal = @id_sucursal
                `);

            if (sucursal.recordset.length === 0) {
                return res.status(409).json({
                    ok: false,
                    mensaje: 'La sucursal indicada no existe.'
                });
            }

            const duplicado = await pool.request()
                .input('dui', sql.NVarChar(10), datos.dui)
                .input('id_empleado', sql.Int, id)
                .query(`
                    SELECT id_empleado
                    FROM Empleado
                    WHERE dui = @dui
                    AND id_empleado <> @id_empleado
                `);

            if (duplicado.recordset.length > 0) {
                return res.status(409).json({
                    ok: false,
                    mensaje: 'El DUI pertenece a otro empleado.'
                });
            }

            await pool.request()
                .input('id_empleado', sql.Int, id)
                .input('id_sucursal', sql.Int, datos.id_sucursal)
                .input('nombre', sql.NVarChar(100), datos.nombre)
                .input('apellido', sql.NVarChar(100), datos.apellido)
                .input('cargo', sql.NVarChar(30), datos.cargo)
                .input('dui', sql.NVarChar(10), datos.dui)
                .input(
                    'salario_mensual',
                    sql.Decimal(10, 2),
                    datos.salario_mensual
                )
                .query(`
                    UPDATE Empleado
                    SET
                        id_sucursal = @id_sucursal,
                        nombre = @nombre,
                        apellido = @apellido,
                        cargo = @cargo,
                        dui = @dui,
                        salario_mensual = @salario_mensual
                    WHERE id_empleado = @id_empleado
                `);

            return res.status(200).json({
                ok: true,
                mensaje: 'Empleado actualizado correctamente.'
            });

        } catch (error) {
            if (error.number === 2627 || error.number === 2601) {
                return res.status(409).json({
                    ok: false,
                    mensaje: 'El DUI pertenece a otro empleado.'
                });
            }

            return responderError(res, error, 'actualizar empleado');
        }
    }

    // 5. ELIMINAR EMPLEADO

    async eliminar(req, res) {
        try {
            const id = Number(req.params.id);

            if (!Number.isInteger(id) || id <= 0) {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'El ID del empleado no es válido.'
                });
            }

            const pool = await getPool();

            const empleado = await pool.request()
                .input('id_empleado', sql.Int, id)
                .query(`
                    SELECT id_empleado
                    FROM Empleado
                    WHERE id_empleado = @id_empleado
                `);

            if (empleado.recordset.length === 0) {
                return res.status(404).json({
                    ok: false,
                    mensaje: 'El empleado no existe.'
                });
            }

            const cajas = await pool.request()
                .input('id_empleado', sql.Int, id)
                .query(`
                    SELECT TOP 1 id_caja
                    FROM Caja
                    WHERE id_empleado = @id_empleado
                `);

            if (cajas.recordset.length > 0) {
                return res.status(409).json({
                    ok: false,
                    mensaje: 'No se puede eliminar el empleado porque tiene cajas registradas.'
                });
            }

            const ventas = await pool.request()
                .input('id_empleado', sql.Int, id)
                .query(`
                    SELECT TOP 1 id_venta
                    FROM Venta
                    WHERE id_empleado = @id_empleado
                `);

            if (ventas.recordset.length > 0) {
                return res.status(409).json({
                    ok: false,
                    mensaje: 'No se puede eliminar el empleado porque tiene ventas registradas.'
                });
            }

            await pool.request()
                .input('id_empleado', sql.Int, id)
                .query(`
                    DELETE FROM Empleado
                    WHERE id_empleado = @id_empleado
                `);

            return res.status(200).json({
                ok: true,
                mensaje: 'Empleado eliminado correctamente.'
            });

        } catch (error) {
            if (error.number === 547) {
                return res.status(409).json({
                    ok: false,
                    mensaje: 'No se puede eliminar el empleado porque tiene registros relacionados.'
                });
            }

            return responderError(res, error, 'eliminar empleado');
        }
    }
}

module.exports = new EmpleadosController();
