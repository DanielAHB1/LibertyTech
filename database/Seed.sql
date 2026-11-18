USE LibertyTech;
GO

-- 1. SUCURSALES
INSERT INTO Sucursal (nombre, direccion, telefono, correlativo_fcf, correlativo_ccf) VALUES
(N'Sucursal Escalón', N'Paseo General Escalón, San Salvador', N'2263-1001', 2, 1),
(N'Sucursal Santa Elena', N'Blvd. Santa Elena, Antiguo Cuscatlán', N'2245-2002', 0, 0);
GO

-- 2. EMPLEADOS (RRHH, empleados)
INSERT INTO Empleado (id_sucursal, nombre, apellido, cargo, dui, salario_mensual) VALUES
(1, N'Carlos Andrés', N'Méndez Rivera', N'GERENTE', N'04589123-4', 1200.00),
(1, N'Valeria Sofía', N'López Castro', N'CAJERO', N'05123456-7', 550.00),
(1, N'Diego Alejandro', N'Gómez Pérez', N'BARISTA', N'05897412-1', 500.00),
(2, N'Andrea María', N'Hernández Cruz', N'CAJERO', N'06123987-0', 550.00);
GO

-- 3. PROVEEDORES
INSERT INTO Proveedores (empresa, telefono, nrc, nit, dias_credito) VALUES
(N'Beneficio Café de Altura S.A. de C.V.', N'2288-9900', N'198452-0', N'0614-050410-105-1', 30),
(N'Lácteos y Derivados del Sur S.A. de C.V.', N'2277-4411', N'205412-8', N'0614-180912-102-3', 15),
(N'Empaques Ecológicos SV S.A. de C.V.', N'2255-8833', N'219874-5', N'0614-290315-104-7', 15);
GO

-- 4. COMPRAS Y RELACIÓN PROVEEDOR_COMPRAS
INSERT INTO Compras (numero_factura, fecha_compra, fecha_vencimiento, estado_pago, total) VALUES
(N'FAC-PROV-001', '2026-11-01', '2026-12-01', N'PENDIENTE', 125.00),
(N'FAC-PROV-002', '2026-11-05', '2026-11-20', N'PAGADA', 30.00);
GO

INSERT INTO Proveedor_Compras (id_proveedor, id_compra) VALUES
(1, 1),
(2, 2);
GO

-- 5. PRODUCTOS (Insumos [ID 1-13], Elaborados [ID 14-25], Reventa [ID 26-28])
-- salsa de caramelo y galleta empacada tienen stock menor al minimo para probar en fe
INSERT INTO Productos (id_sucursal, id_compra, nombre, tipo, precio, unidad, costo_unitario, stock_actual, stock_minimo) VALUES
(1, 1,    N'Café de especialidad en grano', N'INSUMO', 0.00, N'g',      0.0250,  5000.000, 1000.000), 
(1, 2,    N'Leche entera',                  N'INSUMO', 0.00, N'ml',     0.0015, 20000.000, 4000.000), 
(1, NULL, N'Vaso térmico 16oz',             N'INSUMO', 0.00, N'unidad', 0.1200,   300.000,   50.000), 
(1, NULL, N'Tapadera 16oz',                 N'INSUMO', 0.00, N'unidad', 0.0500,   300.000,   50.000), 
(1, NULL, N'Viñeta marca Orígenes',         N'INSUMO', 0.00, N'unidad', 0.0300,   500.000,  100.000), 
(1, NULL, N'Vaso térmico 12oz',             N'INSUMO', 0.00, N'unidad', 0.1000,   300.000,   50.000), 
(1, NULL, N'Tapadera 12oz',                 N'INSUMO', 0.00, N'unidad', 0.0450,   300.000,   50.000), 
(1, NULL, N'Jarabe de vainilla',            N'INSUMO', 0.00, N'ml',     0.0150,  2000.000,  400.000), 
(1, NULL, N'Chocolate en polvo',            N'INSUMO', 0.00, N'g',      0.0180,  2000.000,  400.000), 
(1, NULL, N'Hielo en cubos',                N'INSUMO', 0.00, N'g',      0.0005, 10000.000, 2000.000), 
(1, NULL, N'Masa de hojaldre',              N'INSUMO', 0.00, N'g',      0.0120,  5000.000, 1000.000), 
(1, NULL, N'Mezcla muffin arándanos',       N'INSUMO', 0.00, N'g',      0.0140,  5000.000, 1000.000), 
(1, NULL, N'Salsa de caramelo',             N'INSUMO', 0.00, N'ml',     0.0160,   350.000,  400.000), 

-- 12 Productos elaborados
(1, NULL, N'Latte Grande',                  N'ELABORADO', 3.75, N'unidad', 0.8500, 0.000, 0.000), 
(1, NULL, N'Latte Mediano',                 N'ELABORADO', 3.25, N'unidad', 0.7000, 0.000, 0.000), 
(1, NULL, N'Cappuccino Grande',             N'ELABORADO', 3.75, N'unidad', 0.8000, 0.000, 0.000), 
(1, NULL, N'Americano 12oz',                N'ELABORADO', 2.50, N'unidad', 0.5000, 0.000, 0.000), 
(1, NULL, N'Espresso Doble',                N'ELABORADO', 2.25, N'unidad', 0.5500, 0.000, 0.000), 
(1, NULL, N'Mocha Grande',                  N'ELABORADO', 4.25, N'unidad', 1.1000, 0.000, 0.000), 
(1, NULL, N'Caramel Macchiato',             N'ELABORADO', 4.50, N'unidad', 1.1500, 0.000, 0.000), 
(1, NULL, N'Iced Latte 16oz',               N'ELABORADO', 4.00, N'unidad', 0.9000, 0.000, 0.000), 
(1, NULL, N'Frappé de Café 16oz',           N'ELABORADO', 4.50, N'unidad', 1.0500, 0.000, 0.000), 
(1, NULL, N'Chocolate Caliente 12oz',       N'ELABORADO', 3.50, N'unidad', 0.9500, 0.000, 0.000), 
(1, NULL, N'Croissant de Mantequilla',      N'ELABORADO', 2.75, N'unidad', 1.3200, 0.000, 0.000), 
(1, NULL, N'Muffin de Arándanos',           N'ELABORADO', 2.50, N'unidad', 1.6800, 0.000, 0.000), 

-- Productos de reventa 
(1, NULL, N'Bolsa Café Molido 340g',        N'REVENTA', 9.50, N'unidad', 5.5000, 40.000, 10.000), 
(1, NULL, N'Botella de Agua 600ml',         N'REVENTA', 1.25, N'unidad', 0.4500, 60.000, 15.000), 
(1, NULL, N'Galleta de Chispas Empacada',   N'REVENTA', 1.75, N'unidad', 0.7500,  8.000, 10.000); 

-- 6. RECETAS 
INSERT INTO Recetas (id_producto_elaborado, id_insumo, cantidad_requerida) VALUES
-- Latte Grande  18g café, 250ml leche, 1 vaso 16oz, 1 tapadera 16oz, 1 viñeta
(14, 1, 18.000), (14, 2, 250.000), (14, 3, 1.000), (14, 4, 1.000), (14, 5, 1.000),
-- Latte Mediano 
(15, 1, 14.000), (15, 2, 180.000), (15, 6, 1.000), (15, 7, 1.000), (15, 5, 1.000),
-- Cappuccino Grande 
(16, 1, 18.000), (16, 2, 200.000), (16, 3, 1.000), (16, 4, 1.000), (16, 5, 1.000),
-- Americano 12oz
(17, 1, 14.000), (17, 6, 1.000), (17, 7, 1.000), (17, 5, 1.000),
-- Espresso Doble
(18, 1, 18.000), (18, 6, 1.000), (18, 5, 1.000),
-- Mocha Grande 
(19, 1, 18.000), (19, 2, 220.000), (19, 9, 25.000), (19, 3, 1.000), (19, 4, 1.000), (19, 5, 1.000),
-- Caramel Macchiato 
(20, 1, 18.000), (20, 2, 220.000), (20, 13, 20.000), (20, 3, 1.000), (20, 4, 1.000), (20, 5, 1.000),
-- Iced Latte 16oz
(21, 1, 18.000), (21, 2, 200.000), (21, 10, 120.000), (21, 3, 1.000), (21, 4, 1.000), (21, 5, 1.000),
-- Frappé de Café 16oz 
(22, 1, 18.000), (22, 2, 150.000), (22, 10, 180.000), (22, 8, 20.000), (22, 3, 1.000), (22, 4, 1.000), (22, 5, 1.000),
-- Chocolate Caliente 12oz 
(23, 2, 220.000), (23, 9, 30.000), (23, 6, 1.000), (23, 7, 1.000), (23, 5, 1.000),
-- Croissant de Mantequilla 
(24, 11, 110.000),
-- Muffin de Arándanos 
(25, 12, 120.000);
GO

-- 7. CAJA con turno abierto para probar
INSERT INTO Caja (id_sucursal, id_empleado, monto_inicial, total_efectivo, total_tarjeta, total_bitcoin, estado) VALUES
(1, 2, 100.00, 7.50, 9.50, 4.25, N'ABIERTA');
GO

-- 8. VENTAS DE PRUEBA bitcoin porque rony lo pidio
INSERT INTO Venta (id_sucursal, id_empleado, id_caja, tipo_comprobante, numero_correlativo, nombre_cliente, nit, nrc, metodo_pago, subtotal, iva_13, total, detalle_json) VALUES
(1, 2, 1, N'FCF', 1, N'Consumidor Final', NULL, NULL, N'EFECTIVO', 6.64, 0.86, 7.50, N'[{"id_producto": 14, "nombre": "Latte Grande", "tipo": "ELABORADO", "cantidad": 2, "precio": 3.75, "subtotal": 7.5}]'),
(1, 2, 1, N'CCF', 1, N'Inversiones Tecnológicas S.A. de C.V.', N'0614-120518-104-9', N'284512-3', N'TARJETA', 8.41, 1.09, 9.50, N'[{"id_producto": 26, "nombre": "Bolsa Café Molido 340g", "tipo": "REVENTA", "cantidad": 1, "precio": 9.5, "subtotal": 9.5}]'),
(1, 2, 1, N'FCF', 2, N'Consumidor Final', NULL, NULL, N'BITCOIN', 3.76, 0.49, 4.25, N'[{"id_producto": 19, "nombre": "Mocha Grande", "tipo": "ELABORADO", "cantidad": 1, "precio": 4.25, "subtotal": 4.25}]');
GO

-- 9. PLANILLA QUINCENAL DE REFERENCIA 
INSERT INTO Planilla (id_sucursal, periodo_inicio, periodo_fin, fecha_pago, total, boletas_json) VALUES
(1, '2026-11-01', '2026-11-15', '2026-11-15', 968.37, N'[{"id_empleado": 1, "nombre": "Carlos Andrés Méndez Rivera", "cargo": "GERENTE", "salario_quincenal": 600.0, "isss": 15.0, "afp": 43.5, "isr": 43.13, "total_deducciones": 101.63, "salario_neto": 498.37}, {"id_empleado": 2, "nombre": "Valeria Sofía López Castro", "cargo": "CAJERO", "salario_quincenal": 275.0, "isss": 8.25, "afp": 19.94, "isr": 1.18, "total_deducciones": 29.37, "salario_neto": 245.63}, {"id_empleado": 3, "nombre": "Diego Alejandro Gómez Pérez", "cargo": "BARISTA", "salario_quincenal": 250.0, "isss": 7.5, "afp": 18.13, "isr": 0.0, "total_deducciones": 25.63, "salario_neto": 224.37}]');
GO