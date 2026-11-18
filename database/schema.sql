
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'LibertyTech')
BEGIN
    CREATE DATABASE LibertyTech;
END
GO

USE LibertyTech;
GO

CREATE TABLE Sucursal (
    id_sucursal INT IDENTITY(1,1) PRIMARY KEY,
    nombre NVARCHAR(100) NOT NULL,
    direccion NVARCHAR(255) NOT NULL,
    telefono NVARCHAR(20) NULL,
    correlativo_fcf INT NOT NULL DEFAULT 0,
    correlativo_ccf INT NOT NULL DEFAULT 0
);
GO

CREATE TABLE Empleado (
    id_empleado INT IDENTITY(1,1) PRIMARY KEY,
    id_sucursal INT NOT NULL,
    nombre NVARCHAR(100) NOT NULL,
    apellido NVARCHAR(100) NOT NULL,
    cargo NVARCHAR(30) NOT NULL CHECK (cargo IN ('GERENTE', 'BARISTA', 'CAJERO')),
    dui NVARCHAR(10) NOT NULL UNIQUE,
    salario_mensual DECIMAL(10, 2) NOT NULL CHECK (salario_mensual >= 0),
    CONSTRAINT FK_Empleado_Sucursal FOREIGN KEY (id_sucursal) REFERENCES Sucursal(id_sucursal)
);
GO

CREATE TABLE Caja (
    id_caja INT IDENTITY(1,1) PRIMARY KEY,
    id_sucursal INT NOT NULL,
    id_empleado INT NOT NULL,
    monto_inicial DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    monto_final DECIMAL(10, 2) NULL,
    hora_apertura DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    hora_cierre DATETIME2 NULL,
    total_efectivo DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    total_tarjeta DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    total_bitcoin DECIMAL(10, 2) NOT NULL DEFAULT 0.00, 
    diferencia DECIMAL(10, 2) NULL,
    estado NVARCHAR(15) NOT NULL DEFAULT 'ABIERTA' CHECK (estado IN ('ABIERTA', 'CERRADA')),
    CONSTRAINT FK_Caja_Sucursal FOREIGN KEY (id_sucursal) REFERENCES Sucursal(id_sucursal),
    CONSTRAINT FK_Caja_Empleado FOREIGN KEY (id_empleado) REFERENCES Empleado(id_empleado)
);
GO

CREATE TABLE Venta (
    id_venta INT IDENTITY(1,1) PRIMARY KEY,
    id_sucursal INT NOT NULL,
    id_empleado INT NOT NULL,
    id_caja INT NOT NULL,
    fecha DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    tipo_comprobante NVARCHAR(10) NOT NULL CHECK (tipo_comprobante IN ('FCF', 'CCF')),
    numero_correlativo INT NOT NULL,
    nombre_cliente NVARCHAR(150) NOT NULL DEFAULT 'Consumidor Final',
    nit NVARCHAR(17) NULL,
    nrc NVARCHAR(20) NULL,
    metodo_pago NVARCHAR(20) NOT NULL CHECK (metodo_pago IN ('EFECTIVO', 'TARJETA', 'BITCOIN')),
    subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0.00, 
    iva_13 DECIMAL(10, 2) NOT NULL DEFAULT 0.00, 
    total DECIMAL(10, 2) NOT NULL,
    detalle_json NVARCHAR(MAX) NOT NULL CHECK (ISJSON(detalle_json) = 1),
    CONSTRAINT UQ_Venta_Correlativo UNIQUE (id_sucursal, tipo_comprobante, numero_correlativo),
    CONSTRAINT FK_Venta_Sucursal FOREIGN KEY (id_sucursal) REFERENCES Sucursal(id_sucursal),
    CONSTRAINT FK_Venta_Empleado FOREIGN KEY (id_empleado) REFERENCES Empleado(id_empleado),
    CONSTRAINT FK_Venta_Caja FOREIGN KEY (id_caja) REFERENCES Caja(id_caja)
);
GO

CREATE TABLE Planilla (
    id_planilla INT IDENTITY(1,1) PRIMARY KEY,
    id_sucursal INT NOT NULL,
    periodo_inicio DATE NOT NULL,
    periodo_fin DATE NOT NULL,
    fecha_pago DATE NOT NULL,
    total DECIMAL(10, 2) NOT NULL,
    boletas_json NVARCHAR(MAX) NULL CHECK (boletas_json IS NULL OR ISJSON(boletas_json) = 1),
    CONSTRAINT FK_Planilla_Sucursal FOREIGN KEY (id_sucursal) REFERENCES Sucursal(id_sucursal)
);
GO

CREATE TABLE Proveedores (
    id_proveedor INT IDENTITY(1,1) PRIMARY KEY,
    empresa NVARCHAR(150) NOT NULL,
    telefono NVARCHAR(20) NULL,
    nrc NVARCHAR(20) NULL,
    nit NVARCHAR(17) NOT NULL UNIQUE,
    dias_credito INT NOT NULL DEFAULT 0
);
GO

CREATE TABLE Compras (
    id_compra INT IDENTITY(1,1) PRIMARY KEY,
    numero_factura NVARCHAR(50) NOT NULL,
    fecha_compra DATE NOT NULL DEFAULT CAST(GETDATE() AS DATE),
    fecha_vencimiento DATE NOT NULL,
    estado_pago NVARCHAR(15) NOT NULL DEFAULT 'PENDIENTE' CHECK (estado_pago IN ('PENDIENTE', 'PAGADA')),
    total DECIMAL(10, 2) NOT NULL
);
GO

CREATE TABLE Proveedor_Compras (
    id_proveedor_compra INT IDENTITY(1,1) PRIMARY KEY,
    id_proveedor INT NOT NULL,
    id_compra INT NOT NULL,
    CONSTRAINT UQ_Proveedor_Compra UNIQUE (id_proveedor, id_compra),
    CONSTRAINT FK_ProvComp_Proveedor FOREIGN KEY (id_proveedor) REFERENCES Proveedores(id_proveedor),
    CONSTRAINT FK_ProvComp_Compra FOREIGN KEY (id_compra) REFERENCES Compras(id_compra)
);
GO

CREATE TABLE Productos (
    id_producto INT IDENTITY(1,1) PRIMARY KEY,
    id_sucursal INT NOT NULL,
    id_compra INT NULL,
    nombre NVARCHAR(120) NOT NULL,
    tipo NVARCHAR(15) NOT NULL CHECK (tipo IN ('INSUMO', 'ELABORADO', 'REVENTA')),
    precio DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    unidad NVARCHAR(15) NOT NULL DEFAULT 'unidad',
    costo_unitario DECIMAL(10, 4) NOT NULL DEFAULT 0.0000,
    stock_actual DECIMAL(12, 3) NOT NULL DEFAULT 0.000,
    stock_minimo DECIMAL(12, 3) NOT NULL DEFAULT 0.000,
    CONSTRAINT FK_Productos_Sucursal FOREIGN KEY (id_sucursal) REFERENCES Sucursal(id_sucursal),
    CONSTRAINT FK_Productos_Compras FOREIGN KEY (id_compra) REFERENCES Compras(id_compra)
);
GO

CREATE TABLE Recetas (
    id_receta INT IDENTITY(1,1) PRIMARY KEY,
    id_producto_elaborado INT NOT NULL,
    id_insumo INT NOT NULL,
    cantidad_requerida DECIMAL(10, 3) NOT NULL CHECK (cantidad_requerida > 0),
    CONSTRAINT UQ_Receta_Producto_Insumo UNIQUE (id_producto_elaborado, id_insumo),
    CONSTRAINT FK_Recetas_ProductoElaborado FOREIGN KEY (id_producto_elaborado) REFERENCES Productos(id_producto),
    CONSTRAINT FK_Recetas_Insumo FOREIGN KEY (id_insumo) REFERENCES Productos(id_producto)
);
GO