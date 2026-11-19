const { getPool, sql } = require('../config/db');

//mostrar todas las ventas que han sido registradas
const MostrarVentas = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      select v.*, s.nombre AS sucursal, CONCAT(e.nombre, ' ', e.apellido) AS cajero
      from Venta v
      inner join Sucursal s on v.id_sucursal = s.id_sucursal
      inner join Empleado e on v.id_empleado = e.id_empleado
      order by v.id_venta desc`);

    const ventas = result.recordset.map((v) => ({...v, detalle: JSON.parse(v.detalle_json),
    })); //...v sirve para llamar todos los datos sin escribir cada atributo

    res.json({ ok: true, ventas });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error al mostrar las ventas', error: error.message });
  }
};

//mostrar ventas por id
const VentaId = async (req, res) => {
  try {
    const { id_venta } = req.params;
    const pool = await getPool();

    const result = await pool
      .request()
      .input('id_venta', sql.Int, id_venta)
      .query(`
        select v.*, s.nombre AS sucursal, s.direccion AS direccion_sucursal, CONCAT(e.nombre, ' ', e.apellido) AS cajero
        from Venta v
        inner join Sucursal s on v.id_sucursal = s.id_sucursal
        inner join Empleado e on v.id_empleado = e.id_empleado
        where v.id_venta = @id_venta`);

    if (result.recordset.length === 0) {
      return res.status(404).json({ ok: false, mensaje: 'Venta no encontrada' });
    }

    const venta = result.recordset[0];
    res.json({
      ok: true,
      venta: {...venta, detalle: JSON.parse(venta.detalle_json), //lo mismo con ...venta
      },
    });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error al obtener la venta', error: error.message });
  }
};

//registrar una venta
const registrarVenta = async (req, res) => {
  const {
    id_sucursal, id_empleado, tipo_comprobante, nombre_cliente,
    nit, nrc, metodo_pago, items} = req.body;

  if (!id_sucursal || !id_empleado || !tipo_comprobante || !metodo_pago) {
    return res.status(400).json({
      ok: false,
      mensaje: "Faltan campos por llenar",
    });
  }

  if (!['FCF', 'CCF'].includes(tipo_comprobante)) {
    return res.status(400).json({
      ok: false,
      mensaje: "tipo_comprobante debe ser 'FCF' o 'CCF'",
    });
  }

  if (!['EFECTIVO', 'TARJETA', 'BITCOIN'].includes(metodo_pago)) {
    return res.status(400).json({
      ok: false,
      mensaje: "metodo_pago debe ser 'EFECTIVO', 'TARJETA' o 'BITCOIN'",
    });
  }

  if (tipo_comprobante === 'CCF' && (!nombre_cliente || !nit || !nrc)) {
    return res.status(400).json({
      ok: false,
      mensaje: 'Para emitir Comprobante de Crédito Fiscal (CCF) son obligatorios: nombre_cliente, nit y nrc',
    });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      ok: false,
      mensaje: 'El carrito no puede estar vacio',
    });
  }

  let transaction;

  try {
    const pool = await getPool();
    transaction = new sql.Transaction(pool);
    await transaction.begin();

    //revisar si hay una caja abierta pra la sucursal
    const cajaRes = await new sql.Request(transaction)
      .input('id_sucursal', sql.Int, id_sucursal)
      .query(`
        select top 1 id_caja 
        from Caja 
        where id_sucursal = @id_sucursal and estado = 'ABIERTA'
        order by id_caja DESC
      `);

    if (cajaRes.recordset.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        ok: false,
        mensaje: "No hay ninguna caja abierta",
      });
    }
    const id_caja = cajaRes.recordset[0].id_caja;

    let totalVenta = 0;
    const detalleProcesado = [];

    for (const item of items) {
      if (!item.id_producto || !item.cantidad || Number(item.cantidad) <= 0) {
        await transaction.rollback();
        return res.status(400).json({
          ok: false,
          mensaje: 'Cada objeto del carrito debe tener id_producto y cantidad mayor a 0',
        });
      }

      const prodRes = await new sql.Request(transaction)
        .input('id_producto', sql.Int, item.id_producto)
        .input('id_sucursal', sql.Int, id_sucursal)
        .query(`
          select id_producto, nombre, tipo, precio 
          from Productos 
          where id_producto = @id_producto and id_sucursal = @id_sucursal
        `);

      if (prodRes.recordset.length === 0) {
        await transaction.rollback();
        return res.status(404).json({
          ok: false,
          mensaje: "Uno de los productos no existe",
        });
      }

      const producto = prodRes.recordset[0];
      if (producto.tipo === 'INSUMO') {
        await transaction.rollback();
        return res.status(400).json({
          ok: false,
          mensaje: `Uno de los objetos a vender es un insumo de la bodega y no se puede vender`,
        });
      }

      const cantidad = Number(item.cantidad);
      const precio = Number(producto.precio);
      const subtotalLinea = Number((precio * cantidad).toFixed(2));
      totalVenta = Number((totalVenta + subtotalLinea).toFixed(2));

      detalleProcesado.push({
        id_producto: producto.id_producto,
        nombre: producto.nombre,
        tipo: producto.tipo,
        cantidad,
        precio,
        subtotal: subtotalLinea,
      });
    }

    //para el iva
    const subtotalSinIva = Number((totalVenta / 1.13).toFixed(2));
    const iva13 = Number((totalVenta - subtotalSinIva).toFixed(2));

    const sucRes = await new sql.Request(transaction)
      .input('id_sucursal', sql.Int, id_sucursal)
      .query(`
        select correlativo_fcf, correlativo_ccf 
        from Sucursal with (UPDLOCK, HOLDLOCK)
        where id_sucursal = @id_sucursal
      `);

    const sucursal = sucRes.recordset[0];
    const nuevoCorrelativo =
      tipo_comprobante === 'FCF'
        ? Number(sucursal.correlativo_fcf) + 1
        : Number(sucursal.correlativo_ccf) + 1;

    const columnaCorrelativo = tipo_comprobante === 'FCF' ? 'correlativo_fcf' : 'correlativo_ccf';

    await new sql.Request(transaction)
      .input('id_sucursal', sql.Int, id_sucursal)
      .input('nuevoCorrelativo', sql.Int, nuevoCorrelativo)
      .query(`
        UPDATE Sucursal 
        SET ${columnaCorrelativo} = @nuevoCorrelativo 
        WHERE id_sucursal = @id_sucursal
      `);

    //guardar la venta dentro de libertytech
    const clienteFinal =
      tipo_comprobante === 'FCF'
        ? nombre_cliente?.trim() || 'Consumidor Final'
        : nombre_cliente.trim();

    const ventaRes = await new sql.Request(transaction)
      .input('id_sucursal', sql.Int, id_sucursal)
      .input('id_empleado', sql.Int, id_empleado)
      .input('id_caja', sql.Int, id_caja)
      .input('tipo_comprobante', sql.NVarChar(10), tipo_comprobante)
      .input('numero_correlativo', sql.Int, nuevoCorrelativo)
      .input('nombre_cliente', sql.NVarChar(150), clienteFinal)
      .input('nit', sql.NVarChar(17), nit || null)
      .input('nrc', sql.NVarChar(20), nrc || null)
      .input('metodo_pago', sql.NVarChar(20), metodo_pago)
      .input('subtotal', sql.Decimal(10, 2), subtotalSinIva)
      .input('iva_13', sql.Decimal(10, 2), iva13)
      .input('total', sql.Decimal(10, 2), totalVenta)
      .input('detalle_json', sql.NVarChar(sql.MAX), JSON.stringify(detalleProcesado))
      .query(`
        INSERT INTO Venta (
          id_sucursal, id_empleado, id_caja, tipo_comprobante, numero_correlativo,
          nombre_cliente, nit, nrc, metodo_pago, subtotal, iva_13, total, detalle_json
        )
        OUTPUT INSERTED.*
        VALUES (
          @id_sucursal, @id_empleado, @id_caja, @tipo_comprobante, @numero_correlativo,
          @nombre_cliente, @nit, @nrc, @metodo_pago, @subtotal, @iva_13, @total, @detalle_json
        )
      `);

    const columnaPagoCaja =
      metodo_pago === 'EFECTIVO'
        ? 'total_efectivo'
        : metodo_pago === 'TARJETA'
          ? 'total_tarjeta'
          : 'total_bitcoin';

    await new sql.Request(transaction)
      .input('id_caja', sql.Int, id_caja)
      .input('monto', sql.Decimal(10, 2), totalVenta)
      .query(`
        UPDATE Caja 
        SET ${columnaPagoCaja} = ${columnaPagoCaja} + @monto 
        WHERE id_caja = @id_caja
      `);


    //aqui va lo de descontarinventario
    await transaction.commit();

    const ventaCreada = ventaRes.recordset[0];
    res.status(201).json({
      ok: true,
      mensaje: `${tipo_comprobante} #${nuevoCorrelativo} generada correctamente`,
      venta: {...ventaCreada, detalle: detalleProcesado,
      },
    });
  } catch (error) {
    if (transaction) {
      try {
        await transaction.rollback();
      } catch (_) {
        //por si se revierte la transacción
      }
    }
    res.status(500).json({ ok: false, mensaje: 'Error al procesar la venta', error: error.message });
  }
};

module.exports = {
  MostrarVentas,
  VentaId,
  registrarVenta,
};