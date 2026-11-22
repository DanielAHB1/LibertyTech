//para conexion al server sql
const {getPool, sql} = require('../config/db');

class Inventariorecetas {

    async descontarporventa(productosVendidos) {
        const pool = await getPool();

        const transaction = new sql.Transaction(pool);
        try {
            await transaction.begin();

            //funcion para revisa los productos del pedido y cuenta el total que se requiere de cada producto
            //luego verificara que este la cantidad disponible de lo que necesite cada producto
            const descuentosProductos = new Map();
            const descuentosReventa = []; //arreglo que guardara los productos de reventa y se descontaran del stock

            const resumenDescuentos = [];
            //arreglo que guardara el total de los productos que se utilizaron para el pedido y de los que se realizo reventa.
            //(quedan registrados cada uno de los items procesados en la misma venta)

            for (const producto of productosVendidos) {

                const productoId = Number(producto.productoId);

                const cantidadVendida = Number(producto.cantidad);

                //verificara que el id del producto sea un numero entero y que la cantidad vendida sea mayor a cero
                if (!Number.isInteger(productoId) || productoId <= 0 || Number.isNaN(cantidadVendida) || cantidadVendida <= 0) {

                    throw new Error(`Producto de venta invalido: productoId=${producto.productoId}, cantidad=${producto.cantidad}`);
                    //mostrara el error si el id o la cantidad del item en el pedido no son validos
                }

                const reqProducto = new sql.Request(transaction);
                reqProducto.input('productoId', sql.Int, productoId);

                const prodResult = await reqProducto.query(`
                    SELECT id_producto, nombre, tipo, unidad, costo_unitario, stock_actual, stock_minimo
                    FROM Productos
                    WHERE id_producto = @productoId
                `);

                //confirmara si no se encuentra ningun producto con ese id
                if (prodResult.recordset.length === 0) {
                    //mostrara error si el producto no existe en la tabla de productos
                    throw new Error(`El producto con Id ${productoId} no existe en Productos`);
                }

                const prodBD = prodResult.recordset[0];
                const tipoProducto = String(prodBD.tipo || '').toUpperCase();

                if (tipoProducto === 'ELABORADO') {
                    const reqReceta = new sql.Request(transaction);
                    reqReceta.input('idProductoElaborado', sql.Int, prodBD.id_producto);

                    //une la tabla de recetas con la de productos
                    const recetaResult = await reqReceta.query(`
                        SELECT r.id_insumo, r.cantidad_requerida, i.nombre AS insumo_nombre, i.unidad
                        FROM Recetas r
                        INNER JOIN Productos i ON i.id_producto = r.id_insumo
                        WHERE r.id_producto_elaborado = @idProductoElaborado
                    `);

                    //verifica que el producto elaborado tenga al menos un ingrediente en su receta
                    if (recetaResult.recordset.length === 0) {

                        throw new Error(`El producto elaborado "${prodBD.nombre}" no tiene una receta registrada`);
                        //muestra error si el producto no tiene receta, debe de tener receta para poder descontar productos del stock
                    }

                    const ingredientesAplicados = []; //guardara el total de los ingredientes aplicados en el producto elaborado

                    //recorre cada ingrediente de la receta del producto
                    for (const ing of recetaResult.recordset) {

                        //calcula la cantidad total segun las unidades que se vendieron
                        const totalCantvendida = Number(ing.cantidad_requerida) * cantidadVendida;
                        const acumuladoActual = descuentosProductos.get(ing.id_insumo) || 0;

                        //suma lo acumulado en la funcion map que acumula varios productos que utilizan el mismo insumo
                        descuentosProductos.set(ing.id_insumo, acumuladoActual + totalCantvendida);

                        //agrega ingredientes al arreglo de ingredientes aplicados:
                        ingredientesAplicados.push({
                            insumoId: ing.id_insumo,
                            insumo: ing.insumo_nombre,
                            descontado: totalCantvendida,
                            unidad: ing.unidad
                        });

                    }

                    //agrega el resumen del producto elaborado al arreglo
                    resumenDescuentos.push({
                        productoId: prodBD.id_producto,
                        producto: prodBD.nombre,
                        tipo: 'ELABORADO',
                        cantidadVendida,
                        ingredientesDescontados: ingredientesAplicados
                    });

                } else if (tipoProducto === 'REVENTA') {

                    //si es reventa, lo guardara para descontarlo directamente de su propio stock
                    descuentosReventa.push({
                        productoId: prodBD.id_producto,
                        nombre: prodBD.nombre,
                        cantidadVendida,
                        unidad: prodBD.unidad || 'unidad'
                    });

                    resumenDescuentos.push({
                        //agregara el producto de reventa al resumen general de la venta
                        productoId: prodBD.id_producto,
                        producto: prodBD.nombre,
                        tipo: 'REVENTA',
                        cantidadVendida,
                        descontadoDirecto: cantidadVendida
                    });

                } else {

                    throw new Error(`Tipo de producto no valido ("${prodBD.tipo}") en "${prodBD.nombre}"`);
                    //mostrara un error si no es del tipo elaborado o no es de reventa
                }
            }

            for (const [insumoId, cantidadADescontar] of descuentosProductos.entries()) {

                const reqLeerInsumo = new sql.Request(transaction);
                reqLeerInsumo.input('insumoId', sql.Int, insumoId);

                const insumoActuales = await reqLeerInsumo.query(`
                    SELECT id_producto, nombre, stock_actual, stock_minimo, unidad
                    FROM Productos WITH (UPDLOCK, ROWLOCK)
                    WHERE id_producto = @insumoId
                `);

                const insumo = insumoActuales.recordset[0];
                const nuevoStock = Number(insumo.stock_actual) - cantidadADescontar;

                //Si el nuevo stock queda "negativo", no alcanza la cantidad disponible para realizar el pedido
                if (nuevoStock < 0) {
                    throw new Error(`Stock insuficiente para el pedido "${insumo.nombre}". Disponible: ${insumo.stock_actual} ${insumo.unidad}, requerido: ${cantidadADescontar} ${insumo.unidad}`);
                }

                const reqUpdateInsumo = new sql.Request(transaction);
                reqUpdateInsumo.input('nuevoStock', sql.Decimal(12, 3), nuevoStock);
                reqUpdateInsumo.input('insumoId', sql.Int, insumoId);

                await reqUpdateInsumo.query(`
                    UPDATE Productos
                    SET stock_actual = @nuevoStock
                    WHERE id_producto = @insumoId
                `);
            }

            for (const rev of descuentosReventa) {
                //crea una request dentro de la transaccion para consultar el producto de reventa
                const reqLeerRev = new sql.Request(transaction);
                reqLeerRev.input('productoId', sql.Int, rev.productoId);

                const revActualres = await reqLeerRev.query(`
                    SELECT id_producto, nombre, stock_actual, stock_minimo, unidad
                    FROM Productos WITH (UPDLOCK, ROWLOCK)
                    WHERE id_producto = @productoId
                `);

                //tomara el registro actual del producto de reventa:
                const prodRev = revActualres.recordset[0];
                const nuevoStock = Number(prodRev.stock_actual) - rev.cantidadVendida;

                //si el nuevo stock es menor que cero, mostrara error por falta de stock disponible:
                if (nuevoStock < 0) {
                    throw new Error(`Stock insuficiente para el producto de reventa: "${prodRev.nombre}" Disponible: ${prodRev.stock_actual}, requerido: ${rev.cantidadVendida}`);
                }

                const reqUpdaterev = new sql.Request(transaction);
                reqUpdaterev.input('nuevoStock', sql.Decimal(12, 3), nuevoStock);
                reqUpdaterev.input('productoId', sql.Int, rev.productoId);

                await reqUpdaterev.query(`
                    UPDATE Productos
                    SET stock_actual = @nuevoStock
                    WHERE id_producto = @productoId
                `);
            }

            //consulta que productos quedaron con bajo stock minimo
            const alertas = await this.obtenerAlertasStockMinimo(transaction);
            await transaction.commit();

            //muestra mensaje de inventario actualizado, resumen de descuentos de los productos y alerta de stock minimo
            return {
                mensaje: 'Inventario actualizado correctamente',
                resumenDescuentos,
                alertaStockMinimo: alertas
            };

        } catch (error) {
            //si la transaccion no fue abortada todavia, revertira todos los cambios hechos
            if (transaction._aborted === false) {
                await transaction.rollback();
            }

            throw error;
        }
    }

    async obtenerEstadoInventario(executor = null) {
        const pool = executor ? null : await getPool();
        const reqInsumos = executor ? new sql.Request(executor) : new sql.Request(pool);

        //consulta los insumos y marca si estan en alerta de stock minimo
        const insumoRes = await reqInsumos.query(`
            SELECT
                id_producto,
                nombre,
                stock_actual,
                stock_minimo,
                unidad,
                CASE WHEN stock_actual <= stock_minimo THEN CAST(1 AS BIT) ELSE CAST(0 AS BIT) END AS alerta_stock_minimo
            FROM Productos
            WHERE tipo = N'INSUMO'
            ORDER BY nombre ASC
        `);

        const reqReventa = executor ? new sql.Request(executor) : new sql.Request(pool);
        const reventaRes = await reqReventa.query(`
            SELECT
                id_producto,
                nombre,
                stock_actual,
                stock_minimo,
                unidad,
                CASE WHEN stock_actual <= stock_minimo THEN CAST(1 AS BIT) ELSE CAST(0 AS BIT) END AS alerta_stock_minimo
            FROM Productos
            WHERE tipo = N'REVENTA'
            ORDER BY nombre ASC
        `);

        return {
            insumos: insumoRes.recordset,
            productosReventa: reventaRes.recordset
        };
    }

    async obtenerAlertasStockMinimo(executor = null) {
        const pool = executor ? null : await getPool();
        const reqInsumosAlerta = executor ? new sql.Request(executor) : new sql.Request(pool);
        const insumoAlerta = await reqInsumosAlerta.query(`
            SELECT
                id_producto,
                nombre,
                N'INSUMO' AS categoria,
                stock_actual,
                stock_minimo,
                unidad
            FROM Productos
            WHERE tipo = N'INSUMO' AND stock_actual <= stock_minimo
        `);

        const reqReventaAlerta = executor ? new sql.Request(executor) : new sql.Request(pool); //funcion que genera la alertas segun el stock
        const revenaAlerta = await reqReventaAlerta.query(`
            SELECT
                id_producto,
                nombre,
                N'REVENTA' AS categoria,
                stock_actual,
                stock_minimo,
                ISNULL(unidad, N'unidad') AS unidad
            FROM Productos
            WHERE tipo = N'REVENTA' AND stock_actual <= stock_minimo
        `);

        return [...insumoAlerta.recordset, ...revenaAlerta.recordset];
    }

    //funcion que registra los insumos nuevos
    async crearInsumo(datos){
        const {id_sucursal, nombre, unidad, costo_unitario, stock_actual, stock_minimo} = datos;
        const pool = await getPool();

        const result = await pool.request()
        .input('id_sucursal', sql.Int, id_sucursal || 1)
        .input('nombre', sql.NVarChar(150), nombre)
        .input('unidad', sql.NVarChar(50), unidad)
        .input('costo_unitario', sql.Decimal(12, 2), costo_unitario || 0)
        .input('stock_actual', sql.Decimal(12, 3), stock_actual || 0)
        .input('stock_minimo', sql.Decimal(12, 3), stock_minimo || 0)
        .query(`
            INSERT INTO Productos (id_sucursal, nombre, tipo, precio, unidad, costo_unitario, stock_actual, stock_minimo)
            OUTPUT INSERTED.*
            VALUES (@id_sucursal, @nombre, 'INSUMO', 0.00, @unidad, @costo_unitario, @stock_actual, @stock_minimo)`);
            return result.recordset[0];
    }

    //funcion para listar los productos elaborados del menu:
    async obtenerProductosElaborados(){
        const pool = await getPool();
        const result = await pool.request().query(`
            SELECT id_producto, id_sucursal, nombre, precio, costo_unitario
            FROM Productos
            WHERE tipo = 'ELABORADO'
            ORDER BY id_producto ASC`);

            return result.recordset;
    }

    //para consultar los ingredientes de una receta por id de los productos elaborados:

    async obtenerReceta(idProducto){
        const pool = await getPool();
        const result = await pool.request()
        .input('id_producto', sql.Int, idProducto)
        .query(`SELECT r.id_receta, r.id_producto_elaborado, r.id_insumo, r.cantidad_requerida, p.nombre, p.unidad
            FROM Recetas r
            INNER JOIN Productos p ON r.id_insumo = p.id_producto
            WHERE r.id_producto_elaborado = @id_producto`);

            return result.recordset;
    }

    //asociar o actualizar un insumo dentro de una receta:

    async guardarInsumoreceta(datos){
        const { id_producto_elaborado, id_insumo, cantidad_requerida } = datos;
        const pool = await getPool();

        await pool.request()
            .input('id_producto_elaborado', sql.Int, id_producto_elaborado)
            .input('id_insumo', sql.Int, id_insumo)
            .input('cantidad_requerida', sql.Decimal(12, 3), cantidad_requerida)
            .query(`
                IF EXISTS (
                    SELECT 1 FROM Recetas
                    WHERE id_producto_elaborado = @id_producto_elaborado AND id_insumo = @id_insumo
                )
                    UPDATE Recetas
                    SET cantidad_requerida = @cantidad_requerida
                    WHERE id_producto_elaborado = @id_producto_elaborado AND id_insumo = @id_insumo
                ELSE
                    INSERT INTO Recetas (id_producto_elaborado, id_insumo, cantidad_requerida)
                    VALUES (@id_producto_elaborado, @id_insumo, @cantidad_requerida)
            `);

        return { ok: true };
        
        }
        
        //para eliminar un ingrediente de una receta:
        async eliminarInsumoReceta(idReceta) {
        const pool = await getPool();
        await pool.request()
            .input('id_receta', sql.Int, idReceta)
            .query('DELETE FROM Recetas WHERE id_receta = @id_receta');

        return { ok: true };

        }

    }


module.exports = new Inventariorecetas(); //instancia de inventario para usarla en otros archivos