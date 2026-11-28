
const { getPool, sql } = require('../config/db');

// CONSTANTES LEGALES

const TASAS = Object.freeze({
    ISSS_TRABAJADOR: 0.03,
    AFP_TRABAJADOR: 0.0725,
    ISSS_TECHO_MENSUAL: 1000,
    ISSS_TECHO_QUINCENAL: 500
});

const TABLA_ISR_QUINCENAL = Object.freeze([
    { hasta: 275.00, tasa: 0, exceso: 0, cuotaFija: 0 },
    { hasta: 447.62, tasa: 0.10, exceso: 275.00, cuotaFija: 8.83 },
    { hasta: 1019.05, tasa: 0.20, exceso: 447.62, cuotaFija: 30.00 },
    { hasta: Infinity, tasa: 0.30, exceso: 1019.05, cuotaFija: 144.28 }
]);

// FUNCIONES AUXILIARES

function dinero(valor) {
    return Math.round(
        (Number(valor) + Number.EPSILON) * 100
    ) / 100;
}

function validarNumeroPositivo(valor, nombre) {
    const numero = Number(valor);

    if (!Number.isFinite(numero) || numero < 0) {
        throw new Error(
            `${nombre} debe ser un número mayor o igual a cero.`
        );
    }

    return numero;
}

// CÁLCULO ISSS

function calcularISSS(salarioBruto) {
    const base = Math.min(
        salarioBruto,
        TASAS.ISSS_TECHO_QUINCENAL
    );

    return dinero(base * TASAS.ISSS_TRABAJADOR);
}

// CÁLCULO AFP

function calcularAFP(salarioBruto) {
    return dinero(
        salarioBruto * TASAS.AFP_TRABAJADOR
    );
}

// CÁLCULO ISR

function calcularISRQuincenal(rentaGravada) {
    const base = dinero(
        Math.max(0, Number(rentaGravada) || 0)
    );

    const tramo = TABLA_ISR_QUINCENAL.find(
        item => base <= item.hasta
    );

    if (!tramo || tramo.tasa === 0) {
        return 0;
    }

    return dinero(
        (base - tramo.exceso) * tramo.tasa +
        tramo.cuotaFija
    );
}

// GENERAR BOLETA INDIVIDUAL

function calcularBoleta(empleado) {
    const salarioMensual = validarNumeroPositivo(
        empleado.salario_mensual,
        'salario_mensual'
    );

    const salarioBruto = dinero(salarioMensual / 2);

    const isss = calcularISSS(salarioBruto);

    const afp = calcularAFP(salarioBruto);

    const rentaGravada = dinero(
        Math.max(0, salarioBruto - isss - afp)
    );

    const isr = calcularISRQuincenal(rentaGravada);

    const totalDeducciones = dinero(
        isss + afp + isr
    );

    const salarioNeto = dinero(
        salarioBruto - totalDeducciones
    );

    return {
        id_empleado: empleado.id_empleado,

        nombre: `${empleado.nombre || ''} ${empleado.apellido || ''}`.trim(),

        cargo: empleado.cargo,

        dui: empleado.dui,

        salario_mensual: dinero(salarioMensual),

        salario_bruto: salarioBruto,

        renta_gravada: rentaGravada,

        deducciones: {
            isss,
            afp,
            isr,
            total: totalDeducciones
        },

        salario_neto: salarioNeto
    };
}

// VALIDAR PERÍODO

function validarFecha(fecha, campo) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(fecha))) {
        throw new Error(
            `${campo} debe tener formato YYYY-MM-DD.`
        );
    }

    const [anio, mes, dia] = fecha.split('-').map(Number);

    const fechaUTC = new Date(
        Date.UTC(anio, mes - 1, dia)
    );

    if (
        fechaUTC.getUTCFullYear() !== anio ||
        fechaUTC.getUTCMonth() !== mes - 1 ||
        fechaUTC.getUTCDate() !== dia
    ) {
        throw new Error(`${campo} no es una fecha válida.`);
    }
}

function validarPeriodo(datos) {
    const idSucursal = Number(datos.id_sucursal);

    if (!Number.isInteger(idSucursal) || idSucursal <= 0) {
        throw new Error(
            'id_sucursal debe ser un entero positivo.'
        );
    }

    validarFecha(datos.periodo_inicio, 'periodo_inicio');
    validarFecha(datos.periodo_fin, 'periodo_fin');
    validarFecha(datos.fecha_pago, 'fecha_pago');

    if (datos.periodo_inicio > datos.periodo_fin) {
        throw new Error(
            'La fecha inicial no puede ser posterior a la fecha final.'
        );
    }

    return idSucursal;
}

// GENERAR PLANILLA

async function generarPlanilla(datos) {
    const idSucursal = validarPeriodo(datos);

    const pool = await getPool();

    const transaction = new sql.Transaction(pool);

    await transaction.begin(
        sql.ISOLATION_LEVEL.SERIALIZABLE
    );

    try {
        const request = new sql.Request(transaction);

        // Evitar que se genere dos veces el mismo período.
        // SERIALIZABLE ayuda a proteger la comprobación
        // frente a solicitudes simultáneas.

        const existente = await request
            .input('id_sucursal', sql.Int, idSucursal)
            .input('periodo_inicio', sql.Date, datos.periodo_inicio)
            .input('periodo_fin', sql.Date, datos.periodo_fin)
            .query(`
                SELECT id_planilla
                FROM Planilla WITH (UPDLOCK, HOLDLOCK)
                WHERE id_sucursal = @id_sucursal
                  AND periodo_inicio = @periodo_inicio
                  AND periodo_fin = @periodo_fin
            `);

        if (existente.recordset.length > 0) {
            const error = new Error(
                'Ya se ha generado una planilla para esta sucursal y período.'
            );

            error.statusCode = 409;
            throw error;
        }

        // Consultar empleados incluyendo cargo y DUI.

        const empleadosResult = await new sql.Request(transaction)
            .input('id_sucursal', sql.Int, idSucursal)
            .query(`
                SELECT
                    id_empleado,
                    nombre,
                    apellido,
                    cargo,
                    dui,
                    salario_mensual
                FROM Empleado
                WHERE id_sucursal = @id_sucursal
                ORDER BY id_empleado
            `);

        const empleados = empleadosResult.recordset;

        if (empleados.length === 0) {
            const error = new Error(
                'No existen empleados registrados para esta sucursal.'
            );

            error.statusCode = 400;
            throw error;
        }

        // Calcular las boletas.

        const boletas = empleados.map(calcularBoleta);

        // Total neto: representa el dinero que reciben
        // los empleados después de las deducciones.

        const totalNeto = dinero(
            boletas.reduce(
                (suma, boleta) => suma + boleta.salario_neto,
                0
            )
        );

        // Total bruto: suma de salarios antes de deducciones.

        const totalBruto = dinero(
            boletas.reduce(
                (suma, boleta) => suma + boleta.salario_bruto,
                0
            )
        );

        // Promedio neto por empleado.

        const promedioNeto = dinero(
            totalNeto / boletas.length
        );

        // Insertar planilla.

        const resultado = await new sql.Request(transaction)

            .input('id_sucursal', sql.Int, idSucursal)

            .input('periodo_inicio', sql.Date, datos.periodo_inicio)

            .input('periodo_fin', sql.Date, datos.periodo_fin)

            .input('fecha_pago', sql.Date, datos.fecha_pago)

            .input('total', sql.Decimal(10, 2), totalNeto)

            .input(
                'boletas_json',
                sql.NVarChar(sql.MAX),
                JSON.stringify(boletas)
            )

            .query(`
                INSERT INTO Planilla (
                    id_sucursal,
                    periodo_inicio,
                    periodo_fin,
                    fecha_pago,
                    total,
                    boletas_json
                )

                OUTPUT INSERTED.id_planilla

                VALUES (
                    @id_sucursal,
                    @periodo_inicio,
                    @periodo_fin,
                    @fecha_pago,
                    @total,
                    @boletas_json
                )
            `);

        await transaction.commit();

        return {
            id_planilla: resultado.recordset[0].id_planilla,

            id_sucursal: idSucursal,

            periodo_inicio: datos.periodo_inicio,

            periodo_fin: datos.periodo_fin,

            fecha_pago: datos.fecha_pago,

            significado_total: 'Total neto a pagar a los empleados',

            total_neto_a_pagar: totalNeto,

            total_salarios_brutos: totalBruto,

            promedio_neto_por_empleado: promedioNeto,

            cantidad_empleados: boletas.length,

            boletas
        };

    } catch (error) {
        await transaction.rollback();

        if (error.statusCode) {
            throw error;
        }

        // Error por índice único o duplicado.
        if (error.number === 2601 || error.number === 2627) {
            const duplicado = new Error(
                'Ya se ha generado una planilla para esta sucursal y período.'
            );

            duplicado.statusCode = 409;
            throw duplicado;
        }

        throw error;
    }
}

// CONSULTAR PLANILLAS

async function obtenerPlanillas(idSucursal) {
    const pool = await getPool();

    const request = pool.request();

    let consulta = `
        SELECT
            id_planilla,
            id_sucursal,
            periodo_inicio,
            periodo_fin,
            fecha_pago,
            total,
            boletas_json
        FROM Planilla
    `;

    if (idSucursal !== undefined) {
        const id = Number(idSucursal);

        if (!Number.isInteger(id) || id <= 0) {
            throw new Error(
                'id_sucursal debe ser un entero positivo.'
            );
        }

        request.input('id_sucursal', sql.Int, id);

        consulta += `
            WHERE id_sucursal = @id_sucursal
        `;
    }

    consulta += `
        ORDER BY fecha_pago DESC, id_planilla DESC
    `;

    const resultado = await request.query(consulta);

    return resultado.recordset.map(fila => ({
        ...fila,

        boletas: fila.boletas_json
            ? JSON.parse(fila.boletas_json)
            : []
    }));
}

// EXPORTAR FUNCIONES

module.exports = {
    TASAS,
    TABLA_ISR_QUINCENAL,
    calcularISSS,
    calcularAFP,
    calcularISRQuincenal,
    calcularBoleta,
    generarPlanilla,
    obtenerPlanillas
};
