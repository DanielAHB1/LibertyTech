const { getPool, sql } = require('../config/db');

//historial de los turnos de las cajas
const listarcajas = async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request().query(`select c.*, s.nombre as sucursal
            concat(e.nombre, ' ', e.apellido9) as cajero
            fromm caja c
            inner join sucursal s on c.id_sucursal = s.id_sucursal
            inner join empleado e on c.id_empleado = e.id_empleado
            order by c.id_caja desc`);

            res.json({ ok: true, cajas: result.recordset});            
    } catch (error) {
        res.status(500).json({ ok: false, mensaje: 'Error listando las cajas', error : error.message });
    }
};

//ver cajas abiertas
const cajaActiva = async (req, res) => {
    try { 
        const { id_sucursal } = req.params;
        const pool = await getPool();

        const result = await pool
        .request()
        .input('id_sucursal', sql.Int, id_sucursal)
        .query(`select top 1 c.*, concat(e.nombre, ' ', e.apellido) as cajero
            from caja c
            inner join empleado e on c.id_empleado = e.id_empleado
            where c.id_sucursal = @id_sucursal and c.estado = 'ABIERTA'
            order by c.id_caja desc`);

            if (result.recordset.length === 0) 
            {
                return res.status(404).json({
                    ok: false, mensaje: 'No hay caja abierta para la sucursal',
                });
            }

            res.json({ ok: true, caja: result.recordset[0] });
    } catch (error) {
        res.status(500).json({ ok: false, mensaje: 'Error consultando la caja', error: error.message });
    }
};

//para abrir la caja
const abrirCaja = async (req, res) => {
    try {
        const { id_sucursal, id_empleado, monto_inicial } = req.body

        if(!id_sucursal || !id_empleado || monto_inicial === undefined || Number(monto_inicial) < 0)
        {
            return res.status(400).json({
                ok: false, mensaje: 'Datos invalidos'
            });
        }

        const pool = await getPool();

        //para revisar que no haya caja abierta en la sucurusal 
        const cajaAbierta = await pool
            .request()
            .input('id_sucursal', sql.Int, id_sucursal)
            .query("select id_caja from Caja where id_sucursal = @id_sucursal and estado = 'ABIERTA'");

        if (cajaAbierta.recordset.length > 0) {
            return res.status(400).json({
                ok: false, mensaje: "Ya hay una caja abierta en la sucursal "
            });
        }

        const result = await pool
            .request()
            .input('id_sucursal', sql.Int, id_sucursal)
            .input('id_empleado', sql.Int, id_empleado)
            .input('monto_inicial', sql.Decimal(10, 2), Number(monto_inicial))
            .query(`insert into Caja (id_sucursal, id_empleado, monto_inicial, estado)
                    output inserted.*
                    values (@id_sucursal, @id_empleado, @monto_inicial, 'ABIERTA')`);

        res.status(201).json({
            ok: true, mensaje: 'Caja abierta exitosmente', caja: result.recordset[0],
        });
    } catch (error) {
        res.status(500).json({ ok: false, mensaje: 'Error abriendo la caja', error: error.message});
    }
};

//cerrar y cuadrar caja 
const cerrarCaja = async (req, res) => {
    try{
        const { id_caja } = req.params;
        const { efectivo_fisico, tarjeta_voucher, bitcoin_confirmado } = req.body;

        if(
            efectivo_fisico === undefined || tarjeta_voucher === undefined || bitcoin_confirmado === undefined) 
            {
                return res.status(400).json ({
                    ok: false, mensaje: 'Debes enviar efectivo, tarjeta y bitcoin para cuadrar',
                });
            }
        
        const pool = await getPool();

        //revisa que la caja este abierta
        const cajaResultado = await pool
        .request()
        .input('id_caja', sql.Int, id_caja)
        .query('select * from Caja where id_caja = @id_caja');

        if (cajaResultado.recordset.length === 0) {
            return res.status(404).json({ ok: false, mensaje: 'Turno de caja no encontrado'});
        }

        const caja = cajaResultado.recordset[0];
        if (caja.estado === 'CERRADA') {
            return res.status(400).json({ ok: false, mensaje: 'Esta caja ya fue cerrada' });
        }

        //calcular totales
        const ventasResultado = await pool
            .request()
            .input('id_caja', sql.Int, id_caja)
            .query(`
                    SELECT
                    ISNULL(SUM(CASE WHEN metodo_pago = 'EFECTIVO' THEN total ELSE 0 END), 0) AS ventas_efectivo,
                    ISNULL(SUM(CASE WHEN metodo_pago = 'TARJETA' THEN total ELSE 0 END), 0) AS ventas_tarjeta,
                    ISNULL(SUM(CASE WHEN metodo_pago = 'BITCOIN' THEN total ELSE 0 END), 0) AS ventas_bitcoin
                    FROM Venta
                    WHERE id_caja = @id_caja`);

        const { ventas_efectivo, ventas_tarjeta, ventas_bitcoin } = ventasResultado.recordset[0];

        const montoInicial = Number(caja.monto_inicial);
        const sysEfectivo = Number(ventas_efectivo);
        const sysTarjeta = Number(ventas_tarjeta);
        const sysBitcoin = Number(ventas_bitcoin);

        const repEfectivo = Number(efectivo_fisico);
        const repTarjeta = Number(tarjeta_voucher);
        const repBitcoin = Number(bitcoin_confirmado);

        const totalEsperadoSistema = Number((montoInicial + sysEfectivo + sysTarjeta + sysBitcoin).toFixed(2));
        const montoFinalReportado = Number((repEfectivo + repTarjeta + repBitcoin).toFixed(2));
        const diferencia = Number((montoFinalReportado - totalEsperadoSistema).toFixed(2));

        const updateResult = await pool
            .request()
            .input('id_caja', sql.Int, id_caja)
            .input('total_efectivo', sql.Decimal(10, 2), sysEfectivo)
            .input('total_tarjeta', sql.Decimal(10, 2), sysTarjeta)
            .input('total_bitcoin', sql.Decimal(10, 2), sysBitcoin)
            .input('monto_final', sql.Decimal(10, 2), montoFinalReportado)
            .input('diferencia', sql.Decimal(10, 2), diferencia)
            .query(` update Caja 
                set 
                    total_efectivo = @total_efectivo,
                    total_tarjeta = @total_tarjeta,
                    total_bitcoin = @total_bitcoin,
                    monto_final = @monto_final,
                    diferencia = @diferencia,
                    hora_cierre = SYSDATETIME(),
                    estado = 'CERRADA' 
                output inserted.*
                where id_caja = @id_caja`);

        res.json({
        ok: true,
        mensaje: diferencia === 0 ? 'Caja cerrada y cuadrada exactamente' : 'Caja cerrada con diferencia en el cuadre',
        caja: updateResult.recordset[0],
        desglose_cuadre: {
        efectivo: {
          esperado: Number((montoInicial + sysEfectivo).toFixed(2)),
          reportado: repEfectivo,
          diferencia: Number((repEfectivo - (montoInicial + sysEfectivo)).toFixed(2)),
        },
        tarjeta: {
          esperado: sysTarjeta,
          reportado: repTarjeta,
          diferencia: Number((repTarjeta - sysTarjeta).toFixed(2)),
        },
        bitcoin_chivo: {
          esperado: sysBitcoin,
          reportado: repBitcoin,
          diferencia: Number((repBitcoin - sysBitcoin).toFixed(2)),
        },
      },
    });
    } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error al cerrar la caja', error: error.message });
  }
};

module.exports = {
  listarcajas,
  cajaActiva,
  abrirCaja,
  cerrarCaja,
};

