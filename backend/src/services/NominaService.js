const { getPool, sql } = require('../config/db');

// 1. CONSTANTES Y PORCENTAJES LEGALES

const TASAS = Object.freeze({
    ISSS_TRABAJADOR: 0.03,
    AFP_TRABAJADOR: 0.0725,
    ISSS_TECHO_MENSUAL: 1000,
    ISSS_TECHO_QUINCENAL: 500
});

// Tabla de retención quincenal de ISR.
// Decreto Ejecutivo No. 10 de El Salvador (2025).

const TABLA_ISR_QUINCENAL = Object.freeze([
    {
        desde: 0,
        hasta: 275.00,
        tasa: 0,
        exceso: 0,
        cuotaFija: 0
    },
    {
        desde: 275.01,
        hasta: 447.62,
        tasa: 0.10,
        exceso: 275.00,
        cuotaFija: 8.83
    },
    {
        desde: 447.63,
        hasta: 1019.05,
        tasa: 0.20,
        exceso: 447.62,
        cuotaFija: 30.00
    },
    {
        desde: 1019.06,
        hasta: Infinity,
        tasa: 0.30,
        exceso: 1019.05,
        cuotaFija: 144.28
    }
]);

// 2. FUNCIONES AUXILIARES

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

// 3. CALCULAR ISSS

function calcularISSS(salarioBruto) {

    const baseCotizacion = Math.min(
        salarioBruto,
        TASAS.ISSS_TECHO_QUINCENAL
    );

    return dinero(
        baseCotizacion * TASAS.ISSS_TRABAJADOR
    );
}

// 4. CALCULAR AFP

function calcularAFP(salarioBruto) {

    return dinero(
        salarioBruto * TASAS.AFP_TRABAJADOR
    );
}

// 5. CALCULAR IMPUESTO SOBRE LA RENTA

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

    const exceso = base - tramo.exceso;

    const impuesto = (
        exceso * tramo.tasa
    ) + tramo.cuotaFija;

    return dinero(impuesto);
}

// 6. GENERAR BOLETA DE PAGO

function calcularBoleta(empleado) {

    const salarioMensual = validarNumeroPositivo(
        empleado.salario_mensual,
        'salario_mensual'
    );

    // El salario mensual se divide entre dos
    // para obtener el salario bruto quincenal.

    const salarioBruto = dinero(
        salarioMensual / 2
    );

    // Deducciones de ley.

    const isss = calcularISSS(salarioBruto);

    const afp = calcularAFP(salarioBruto);

    // Base gravada después de ISSS y AFP.

    const rentaGravada = dinero(
        Math.max(0, salarioBruto - isss - afp)
    );

    const isr = calcularISRQuincenal(rentaGravada);

    // Total de deducciones.

    const totalDeducciones = dinero(
        isss + afp + isr
    );

    // Salario neto a recibir.

    const salarioNeto = dinero(
        salarioBruto - totalDeducciones
    );

    return {
        id_empleado: empleado.id_empleado,

        nombre: `${empleado.nombre || ''} ${empleado.apellido || ''}`.trim(),

        salario_mensual: dinero(salarioMensual),

        salario_bruto: salarioBruto,

        base_isss: Math.min(
            salarioBruto,
            TASAS.ISSS_TECHO_QUINCENAL
        ),

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

// 7. VALIDAR INFORMACIÓN DE LA PLANILLA

function validarFecha(fecha, nombre) {

    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(fecha))) {
        throw new Error(
            `${nombre} debe tener formato YYYY-MM-DD.`
        );
    }

    const [anio, mes, dia] = fecha.split('-').map(Number);

    const fechaValida = new Date(
        Date.UTC(anio, mes - 1, dia)
    );

    if (
        fechaValida.getUTCFullYear() !== anio ||
        fechaValida.getUTCMonth() !== mes - 1 ||
        fechaValida.getUTCDate() !== dia
    ) {
        throw new Error(`${nombre} no es una fecha válida.`);
    }
}

function validarPeriodo(datos) {

    const idSucursal = Number(datos.id_sucursal);

    if (
        !Number.isInteger(idSucursal) ||
        idSucursal <= 0
    ) {
        throw new Error(
            'id_sucursal debe ser un entero positivo.'
        );
    }

    validarFecha(datos.periodo_inicio, 'periodo_inicio');

    validarFecha(datos.periodo_fin, 'periodo_fin');

    validarFecha(datos.fecha_pago, 'fecha_pago');

    if (datos.periodo_inicio > datos.periodo_fin) {
        throw new Error(
            'La fecha de inicio no puede ser posterior a la fecha final.'
        );
    }

    return idSucursal;
}

// 8. GENERAR PLANILLA QUINCENAL

async function generarPlanilla(datos) {

    const idSucursal = validarPeriodo(datos);

    const pool = await getPool();

    // Consultar empleados de la sucursal.

    const empleadosResult = await pool.request()
        .input('id_sucursal', sql.Int, idSucursal)
        .query(`
            SELECT
                id_empleado,
                nombre,
                apellido,
                salario_mensual
            FROM Empleado
            WHERE id_sucursal = @id_sucursal
            ORDER BY id_empleado
        `);

    const empleados = empleadosResult.recordset;

    if (empleados.length === 0) {
        throw new Error(
            'No existen empleados registrados para esta sucursal.'
        );
    }

    // Calcular las boletas individuales.

    const boletas = empleados.map(calcularBoleta);

    // Sumar los salarios brutos.

    const total = dinero(
        boletas.reduce(
            (suma, boleta) => suma + boleta.salario_bruto,
            0
        )
    );

    // Guardar la planilla utilizando una transacción.

    const transaction = new sql.Transaction(pool);

    await transaction.begin();

    try {

        const resultado = await new sql.Request(transaction)

            .input('id_sucursal', sql.Int, idSucursal)

            .input(
                'periodo_inicio',
                sql.Date,
                datos.periodo_inicio
            )

            .input(
                'periodo_fin',
                sql.Date,
                datos.periodo_fin
            )

            .input(
                'fecha_pago',
                sql.Date,
                datos.fecha_pago
            )

            .input(
                'total',
                sql.Decimal(10, 2),
                total
            )

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

            total_salarios_brutos: total,

            cantidad_empleados: boletas.length,

            boletas

        };

    } catch (error) {

        await transaction.rollback();

        throw error;

    }
}

// 9. CONSULTAR PLANILLAS GENERADAS

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

// 10. EXPORTAR FUNCIONES

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