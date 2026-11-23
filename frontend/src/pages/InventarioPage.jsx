import React, { useState, useEffect } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  CardBody,
  Form,
  FormGroup,
  Label,
  Input,
  Button,
  Alert,
  Table,
  Badge,
  Spinner,
  ButtonGroup,
  InputGroup,
  InputGroupText,
} from 'reactstrap';
import { inventarioService } from '../services/inventarioService';

const InventarioPage = () => {
  // Estados principales de datos
  const [insumos, setInsumos] = useState([]);
  const [productosReventa, setProductosReventa] = useState([]);
  const [elaborados, setElaborados] = useState([]);
  const [alertasVisuales, setAlertasVisuales] = useState([]);

  // Estados de interfaz y filtros
  const [sucursalActiva, setSucursalActiva] = useState(1);
  const [filtroTabla, setFiltroTabla] = useState('TODOS');
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(false);
  const [cargandoReceta, setCargandoReceta] = useState(false);
  const [guardandoInsumo, setGuardandoInsumo] = useState(false);
  const [guardandoReceta, setGuardandoReceta] = useState(false);
  const [mensajeError, setMensajeError] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');

  // Formulario de nuevo insumo
  const [nuevoInsumo, setNuevoInsumo] = useState({
    nombre: '',
    unidad: 'g',
    costo_unitario: '',
    stock_actual: '',
    stock_minimo: '',
  });

  // Gestor de recetas
  const [productoSeleccionado, setProductoSeleccionado] = useState('');
  const [recetaActual, setRecetaActual] = useState([]);
  const [ingredienteForm, setIngredienteForm] = useState({
    id_insumo: '',
    cantidad_requerida: '',
  });

  useEffect(() => {
    cargarTodoElInventario();
  }, []);

  // Vigilante reactivo de Stock Mínimo (useEffect)
  useEffect(() => {
    const inventarioCompleto = [
      ...insumos.map((item) => ({ ...item, tipo: 'INSUMO' })),
      ...productosReventa.map((item) => ({ ...item, tipo: 'REVENTA' })),
    ];

    const criticos = inventarioCompleto.filter(
      (item) => Number(item.stock_actual) <= Number(item.stock_minimo)
    );

    setAlertasVisuales(criticos);
  }, [insumos, productosReventa]);

  useEffect(() => {
    if (!productoSeleccionado) {
      setRecetaActual([]);
      return;
    }

    const consultarReceta = async () => {
      setCargandoReceta(true);
      try {
        const lista = await inventarioService.obtenerReceta(productoSeleccionado);
        setRecetaActual(lista);
      } catch (error) {
        setMensajeError(error.message);
      } finally {
        setCargandoReceta(false);
      }
    };

    consultarReceta();
  }, [productoSeleccionado]);

  const cargarTodoElInventario = async () => {
    setCargando(true);
    setMensajeError('');
    try {
      const [estadoData, listaElaborados, alertasBackend] = await Promise.all([
        inventarioService.obtenerEstado(),
        inventarioService.obtenerProductosElaborados(),
        inventarioService.obtenerAlertas(),
      ]);

      setInsumos(estadoData.insumos);
      setProductosReventa(estadoData.productosReventa);
      setElaborados(listaElaborados);

      if (alertasBackend.length > 0 && estadoData.insumos.length === 0) {
        setAlertasVisuales(alertasBackend);
      }
    } catch (error) {
      setMensajeError(error.message);
    } finally {
      setCargando(false);
    }
  };

  // Registrar nuevo insumo base
  const handleCrearInsumo = async (e) => {
    e.preventDefault();
    setMensajeError('');
    setMensajeExito('');

    if (!nuevoInsumo.nombre.trim()) {
      setMensajeError('Escribe el nombre del insumo.');
      return;
    }

    setGuardandoInsumo(true);
    try {
      const payload = {
        id_sucursal: Number(sucursalActiva),
        nombre: nuevoInsumo.nombre.trim(),
        unidad: nuevoInsumo.unidad,
        costo_unitario: Number(nuevoInsumo.costo_unitario || 0),
        stock_actual: Number(nuevoInsumo.stock_actual || 0),
        stock_minimo: Number(nuevoInsumo.stock_minimo || 0),
      };

      await inventarioService.crearInsumo(payload);
      setMensajeExito(`Insumo "${payload.nombre}" guardado en bodega.`);

      setNuevoInsumo({
        nombre: '',
        unidad: 'g',
        costo_unitario: '',
        stock_actual: '',
        stock_minimo: '',
      });

      await cargarTodoElInventario();
    } catch (error) {
      setMensajeError(error.message);
    } finally {
      setGuardandoInsumo(false);
    }
  };

  // Vincular o actualizar ingrediente en la receta
  const handleGuardarIngrediente = async (e) => {
    e.preventDefault();
    setMensajeError('');
    setMensajeExito('');

    if (
      !productoSeleccionado ||
      !ingredienteForm.id_insumo ||
      Number(ingredienteForm.cantidad_requerida) <= 0
    ) {
      setMensajeError('Elige un producto, un insumo y una cantidad mayor a 0.');
      return;
    }

    setGuardandoReceta(true);
    try {
      const payload = {
        id_producto_elaborado: Number(productoSeleccionado),
        id_insumo: Number(ingredienteForm.id_insumo),
        cantidad_requerida: Number(ingredienteForm.cantidad_requerida),
      };

      await inventarioService.guardarInsumoReceta(payload);
      setMensajeExito('Receta actualizada correctamente.');
      setIngredienteForm({ id_insumo: '', cantidad_requerida: '' });

      const recetaActualizada = await inventarioService.obtenerReceta(productoSeleccionado);
      setRecetaActual(recetaActualizada);
    } catch (error) {
      setMensajeError(error.message);
    } finally {
      setGuardandoReceta(false);
    }
  };

  // Eliminar ingrediente de una receta
  const handleEliminarIngrediente = async (idReceta) => {
    setMensajeError('');
    setMensajeExito('');
    try {
      await inventarioService.eliminarInsumoReceta(idReceta);
      setMensajeExito('Ingrediente quitado de la receta.');
      setRecetaActual((prev) => prev.filter((item) => item.id_receta !== idReceta));
    } catch (error) {
      setMensajeError(error.message);
    }
  };

  const elaboradosSucursal = elaborados.filter(
    (elab) => elab.id_sucursal == null || Number(elab.id_sucursal) === Number(sucursalActiva)
  );

  const productoActivoObj = elaboradosSucursal.find(
    (p) => Number(p.id_producto) === Number(productoSeleccionado)
  );

  let listaTablaBodega = [
    ...insumos.map((i) => ({ ...i, tipo: 'INSUMO' })),
    ...productosReventa.map((r) => ({ ...r, tipo: 'REVENTA' })),
  ];

  if (filtroTabla !== 'TODOS') {
    listaTablaBodega = listaTablaBodega.filter((item) => item.tipo === filtroTabla);
  }

  if (busqueda.trim() !== '') {
    const termino = busqueda.toLowerCase();
    listaTablaBodega = listaTablaBodega.filter((item) =>
      item.nombre.toLowerCase().includes(termino)
    );
  }

  const nombreSucursalTexto =
    sucursalActiva === 1
      ? 'Av. Escalón, San Salvador'
      : 'Blvd. Santa Elena, Antiguo Cuscatlán';

  return (
    <div className="kafe-page-bg">
      {/* Trazo curvo decorativo azul cobalto en el lateral derecho */}
      <svg className="kafe-wave-deco" viewBox="0 0 200 800" preserveAspectRatio="none">
        <path
          d="M180,0 C190,140 40,180 50,300 C60,420 190,460 175,600 C160,720 40,760 10,800"
          fill="none"
          stroke="#003893"
          strokeWidth="36"
          strokeLinecap="round"
        />
      </svg>

      <div className="kafe-content-layer">
        {/* ENCABEZADO ESTILO AFICHE CON COLORES DE EL SALVADOR */}
        <Container className="pt-4 pb-3">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-4">
            {/* Izquierda: Sello circular + título e información en filas */}
            <div className="d-flex flex-wrap align-items-center gap-4">
              <div className="kafe-stamp">
                <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>☕</span>
                <div
                  className="font-kafe-display fw-bold mt-1"
                  style={{ fontSize: '0.92rem', color: '#0f172a' }}
                >
                  LIBERTYTECH
                </div>
                <div className="kafe-stamp-divider" />
                <span
                  style={{
                    fontSize: '0.52rem',
                    fontWeight: 700,
                    letterSpacing: '0.8px',
                    color: '#003893',
                  }}
                >
                  CAFETERÍA &amp; RESTAURANTE
                </span>
              </div>

              <div>
                <h1
                  className="font-kafe-display fw-bold mb-2"
                  style={{
                    fontSize: 'clamp(1.75rem, 3.2vw, 2.35rem)',
                    color: '#0f172a',
                    lineHeight: 1.05,
                  }}
                >
                  INVENTARIO Y <span style={{ color: '#003893' }}>RECETARIO</span>
                </h1>

                <div className="d-flex flex-column gap-2">
                  <div className="d-flex align-items-center gap-2 small fw-semibold text-dark">
                    <span className="kafe-icon-badge">📍</span>
                    <span>{nombreSucursalTexto}</span>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <span className="kafe-icon-badge">📋</span>
                    <span className="kafe-pill-banner">
                      Control de bodega, insumos y menú elaborado
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Derecha: Círculo "SUCURSAL 01" + selector y botón actualizar */}
            <div
              className="d-flex align-items-center gap-3 bg-white p-3 rounded-4 border"
              style={{ borderColor: '#cbd5e1' }}
            >
              <div className="kafe-punto-circle">
                <span style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '1px' }}>
                  SUCURSAL
                </span>
                <span
                  className="font-kafe-display fw-bold"
                  style={{ fontSize: '2rem', lineHeight: 1 }}
                >
                  0{sucursalActiva}
                </span>
              </div>

              <div className="d-flex flex-column gap-2">
                <Input
                  id="selectSucursal"
                  type="select"
                  bsSize="sm"
                  className="kafe-input fw-semibold"
                  style={{ width: '175px' }}
                  value={sucursalActiva}
                  onChange={(e) => setSucursalActiva(Number(e.target.value))}
                >
                  <option value={1}>01 - Escalón</option>
                  <option value={2}>02 - Santa Elena</option>
                </Input>

                <Button
                  size="sm"
                  className="btn-kafe-primary"
                  onClick={cargarTodoElInventario}
                  disabled={cargando}
                >
                  {cargando ? <Spinner size="sm" /> : '↻ Actualizar Bodega'}
                </Button>
              </div>
            </div>
          </div>
        </Container>

        <Container className="mt-2">
          {/* TARJETA DE 4 INDICADORES CLAVE */}
          <Card className="kafe-card mb-4">
            <CardBody className="py-3 px-4">
              <Row className="text-center g-3">
                <Col xs={6} md={3} className="border-end" style={{ borderColor: '#e2e8f0' }}>
                  <div className="small fw-bold text-uppercase text-dark">Insumos Base</div>
                  <div className="font-kafe-display fs-2 fw-bold" style={{ color: '#003893' }}>
                    {insumos.length}
                  </div>
                </Col>
                <Col xs={6} md={3} className="border-end" style={{ borderColor: '#e2e8f0' }}>
                  <div className="small fw-bold text-uppercase text-dark">Prod. Reventa</div>
                  <div className="font-kafe-display fs-2 fw-bold" style={{ color: '#003893' }}>
                    {productosReventa.length}
                  </div>
                </Col>
                <Col xs={6} md={3} className="border-end" style={{ borderColor: '#e2e8f0' }}>
                  <div className="small fw-bold text-uppercase text-dark">Menú Elaborado</div>
                  <div className="font-kafe-display fs-2 fw-bold" style={{ color: '#003893' }}>
                    {elaboradosSucursal.length}
                  </div>
                </Col>
                <Col xs={6} md={3}>
                  <div className="small fw-bold text-uppercase text-dark">Stock Crítico</div>
                  <div
                    className="font-kafe-display fs-2 fw-bold"
                    style={{ color: alertasVisuales.length > 0 ? '#dc2626' : '#003893' }}
                  >
                    {alertasVisuales.length}
                  </div>
                </Col>
              </Row>
            </CardBody>
          </Card>

          {/* ALERTA AUTOMÁTICA DE STOCK MÍNIMO */}
          {alertasVisuales.length > 0 && (
            <Alert
              color="danger"
              className="bg-white rounded-4 mb-4 shadow-sm"
              style={{ border: '2px solid #dc2626', color: '#0f172a' }}
            >
              <div className="d-flex flex-wrap justify-content-between align-items-center mb-2">
                <strong className="text-danger">
                  ⚠️ Alerta de Stock Mínimo ({alertasVisuales.length} artículos por agotarse)
                </strong>
                <Badge color="danger" pill>
                  Reabastecer
                </Badge>
              </div>
              <div className="d-flex flex-wrap gap-2">
                {alertasVisuales.map((alerta) => (
                  <div
                    key={alerta.id_producto}
                    className="rounded-3 px-3 py-1 d-inline-flex align-items-center gap-2 small"
                    style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca' }}
                  >
                    <span>
                      <strong>{alerta.nombre}:</strong>{' '}
                      <span className="text-danger fw-bold">
                        {alerta.stock_actual} / {alerta.stock_minimo} {alerta.unidad}
                      </span>
                    </span>
                    {alerta.tipo === 'INSUMO' && (
                      <Button
                        size="sm"
                        className="btn-kafe-primary py-0 px-2"
                        style={{ fontSize: '0.72rem' }}
                        onClick={() => {
                          setNuevoInsumo((prev) => ({
                            ...prev,
                            nombre: alerta.nombre,
                            unidad: alerta.unidad || 'g',
                          }));
                          document
                            .getElementById('form-nuevo-insumo')
                            ?.scrollIntoView({ behavior: 'smooth' });
                        }}
                      >
                        + Registrar lote
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </Alert>
          )}

          {/* NOTIFICACIONES */}
          {mensajeError && (
            <Alert color="danger" className="rounded-3" toggle={() => setMensajeError('')}>
              <strong>Aviso:</strong> {mensajeError}
            </Alert>
          )}
          {mensajeExito && (
            <Alert
              className="bg-white rounded-3 shadow-sm"
              style={{ border: '1.5px solid #003893', color: '#0f172a' }}
              toggle={() => setMensajeExito('')}
            >
              <strong style={{ color: '#003893' }}>✓ Listo:</strong> {mensajeExito}
            </Alert>
          )}

          {/* SECCIÓN DE DOS COLUMNAS: REGISTRO DE INSUMOS Y RECETARIO */}
          <Row className="g-4 mb-4">
            {/* COLUMNA IZQUIERDA: 1. NUEVO INSUMO */}
            <Col lg={5}>
              <Card id="form-nuevo-insumo" className="kafe-card h-100">
                <CardBody className="p-4">
                  <div
                    className="d-flex justify-content-between align-items-center pb-3 mb-3 border-bottom"
                    style={{ borderColor: '#e2e8f0' }}
                  >
                    <div className="d-flex align-items-center gap-2">
                      <span className="kafe-icon-badge">🫘</span>
                      <h4 className="font-kafe-display fw-bold mb-0 text-dark">
                        1. Nuevo Insumo
                      </h4>
                    </div>
                    <span
                      className="kafe-pill-banner"
                      style={{ fontSize: '0.7rem', padding: '3px 10px' }}
                    >
                      Bodega
                    </span>
                  </div>

                  <Form onSubmit={handleCrearInsumo}>
                    <FormGroup>
                      <Label for="nombreInsumo" className="small fw-bold text-dark">
                        Nombre del Insumo
                      </Label>
                      <Input
                        id="nombreInsumo"
                        type="text"
                        className="kafe-input"
                        placeholder="Ej. Café de especialidad, Leche entera..."
                        value={nuevoInsumo.nombre}
                        onChange={(e) =>
                          setNuevoInsumo({ ...nuevoInsumo, nombre: e.target.value })
                        }
                        required
                      />
                    </FormGroup>

                    <Row>
                      <Col sm={6}>
                        <FormGroup>
                          <Label for="unidadInsumo" className="small fw-bold text-dark">
                            Unidad
                          </Label>
                          <Input
                            id="unidadInsumo"
                            type="select"
                            className="kafe-input"
                            value={nuevoInsumo.unidad}
                            onChange={(e) =>
                              setNuevoInsumo({ ...nuevoInsumo, unidad: e.target.value })
                            }
                          >
                            <option value="g">Gramos (g)</option>
                            <option value="ml">Mililitros (ml)</option>
                            <option value="unidad">Unidad</option>
                          </Input>
                        </FormGroup>
                      </Col>

                      <Col sm={6}>
                        <FormGroup>
                          <Label for="costoUnitario" className="small fw-bold text-dark">
                            Costo Unitario
                          </Label>
                          <InputGroup>
                            <InputGroupText
                              className="fw-bold"
                              style={{
                                backgroundColor: '#e6eefc',
                                borderColor: '#cbd5e1',
                                color: '#003893',
                              }}
                            >
                              $
                            </InputGroupText>
                            <Input
                              id="costoUnitario"
                              type="number"
                              step="0.0001"
                              min="0"
                              className="kafe-input"
                              placeholder="0.00"
                              value={nuevoInsumo.costo_unitario}
                              onChange={(e) =>
                                setNuevoInsumo({
                                  ...nuevoInsumo,
                                  costo_unitario: e.target.value,
                                })
                              }
                              required
                            />
                          </InputGroup>
                        </FormGroup>
                      </Col>
                    </Row>

                    <Row>
                      <Col sm={6}>
                        <FormGroup>
                          <Label for="stockActual" className="small fw-bold text-dark">
                            Stock Inicial
                          </Label>
                          <Input
                            id="stockActual"
                            type="number"
                            step="0.001"
                            min="0"
                            className="kafe-input"
                            placeholder="0"
                            value={nuevoInsumo.stock_actual}
                            onChange={(e) =>
                              setNuevoInsumo({
                                ...nuevoInsumo,
                                stock_actual: e.target.value,
                              })
                            }
                            required
                          />
                        </FormGroup>
                      </Col>

                      <Col sm={6}>
                        <FormGroup>
                          <Label for="stockMinimo" className="small fw-bold text-dark">
                            Stock Mínimo
                          </Label>
                          <Input
                            id="stockMinimo"
                            type="number"
                            step="0.001"
                            min="0"
                            className="kafe-input"
                            placeholder="0"
                            value={nuevoInsumo.stock_minimo}
                            onChange={(e) =>
                              setNuevoInsumo({
                                ...nuevoInsumo,
                                stock_minimo: e.target.value,
                              })
                            }
                            required
                          />
                        </FormGroup>
                      </Col>
                    </Row>

                    <Button
                      type="submit"
                      block
                      disabled={guardandoInsumo}
                      className="btn-kafe-primary mt-2 py-2"
                    >
                      {guardandoInsumo ? <Spinner size="sm" /> : '+ Registrar Insumo'}
                    </Button>
                  </Form>
                </CardBody>
              </Card>
            </Col>

            {/* COLUMNA DERECHA: 2. MENÚ Y RECETAS */}
            <Col lg={7}>
              <Card className="kafe-card h-100">
                <CardBody className="p-4">
                  <div
                    className="d-flex flex-wrap justify-content-between align-items-center pb-3 mb-3 border-bottom"
                    style={{ borderColor: '#e2e8f0' }}
                  >
                    <div className="d-flex align-items-center gap-2">
                      <span className="kafe-icon-badge">☕</span>
                      <h4 className="font-kafe-display fw-bold mb-0 text-dark">
                        2. Menú y Recetas
                      </h4>
                    </div>
                    <span className="small fw-semibold text-dark">
                      {elaboradosSucursal.length} productos preparados
                    </span>
                  </div>

                  <Form onSubmit={handleGuardarIngrediente}>
                    <FormGroup>
                      <Label for="selectElaborado" className="small fw-bold text-dark">
                        Elige un producto del menú:
                      </Label>
                      <Input
                        id="selectElaborado"
                        type="select"
                        className="kafe-input fw-semibold"
                        value={productoSeleccionado}
                        onChange={(e) => setProductoSeleccionado(e.target.value)}
                      >
                        <option value="">-- Seleccionar bebida o platillo --</option>
                        {elaboradosSucursal.map((prod) => (
                          <option key={prod.id_producto} value={prod.id_producto}>
                            {prod.nombre} — ${Number(prod.precio || 0).toFixed(2)}
                          </option>
                        ))}
                      </Input>
                    </FormGroup>

                    {productoSeleccionado ? (
                      <>
                        <Row className="g-2 align-items-end mb-3">
                          <Col md={6}>
                            <Label for="selectInsumo" className="small fw-bold text-dark">
                              Ingrediente
                            </Label>
                            <Input
                              id="selectInsumo"
                              type="select"
                              className="kafe-input"
                              value={ingredienteForm.id_insumo}
                              onChange={(e) =>
                                setIngredienteForm({
                                  ...ingredienteForm,
                                  id_insumo: e.target.value,
                                })
                              }
                              required
                            >
                              <option value="">-- Elegir insumo --</option>
                              {insumos.map((ins) => (
                                <option key={ins.id_producto} value={ins.id_producto}>
                                  {ins.nombre} ({ins.unidad})
                                </option>
                              ))}
                            </Input>
                          </Col>

                          <Col md={3}>
                            <Label for="cantReq" className="small fw-bold text-dark">
                              Cantidad
                            </Label>
                            <Input
                              id="cantReq"
                              type="number"
                              step="0.001"
                              min="0.001"
                              className="kafe-input"
                              placeholder="Ej. 18"
                              value={ingredienteForm.cantidad_requerida}
                              onChange={(e) =>
                                setIngredienteForm({
                                  ...ingredienteForm,
                                  cantidad_requerida: e.target.value,
                                })
                              }
                              required
                            />
                          </Col>

                          <Col md={3}>
                            <Button
                              type="submit"
                              block
                              disabled={guardandoReceta}
                              className="btn-kafe-primary"
                            >
                              {guardandoReceta ? <Spinner size="sm" /> : '+ Agregar'}
                            </Button>
                          </Col>
                        </Row>

                        {/* Lista de ingredientes */}
                        <div
                          className="p-3 rounded-3"
                          style={{ backgroundColor: '#f4f7fb', border: '1px solid #cbd5e1' }}
                        >
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <span className="font-kafe-display fw-bold text-dark">
                              Fórmula: {productoActivoObj?.nombre}
                            </span>
                            <span
                              className="kafe-pill-banner"
                              style={{ fontSize: '0.7rem', padding: '2px 10px' }}
                            >
                              {recetaActual.length} ingredientes
                            </span>
                          </div>

                          {cargandoReceta ? (
                            <div className="text-center py-3">
                              <Spinner size="sm" color="primary" />
                            </div>
                          ) : recetaActual.length === 0 ? (
                            <p className="small mb-0 text-center py-2 text-dark">
                              Este producto aún no tiene ingredientes asignados.
                            </p>
                          ) : (
                            <div
                              className="bg-white rounded-3 px-3 py-1 border"
                              style={{ borderColor: '#cbd5e1' }}
                            >
                              {recetaActual.map((item) => {
                                const infoInsumo = insumos.find(
                                  (i) => Number(i.id_producto) === Number(item.id_insumo)
                                );
                                const nombreMostrar =
                                  item.nombre || infoInsumo?.nombre || `Insumo #${item.id_insumo}`;
                                const unidadMostrar = item.unidad || infoInsumo?.unidad || '';

                                return (
                                  <div
                                    key={item.id_receta || item.id_insumo}
                                    className="kafe-recipe-row d-flex justify-content-between align-items-center small"
                                  >
                                    <span className="fw-semibold text-dark">{nombreMostrar}</span>
                                    <div className="d-flex align-items-center gap-3">
                                      <span className="fw-bold" style={{ color: '#003893' }}>
                                        {item.cantidad_requerida} {unidadMostrar}
                                      </span>
                                      {item.id_receta && (
                                        <Button
                                          color="outline-danger"
                                          size="sm"
                                          className="py-0 px-2"
                                          type="button"
                                          onClick={() => handleEliminarIngrediente(item.id_receta)}
                                        >
                                          Quitar
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <div
                        className="text-center py-5 rounded-3 small text-dark"
                        style={{ backgroundColor: '#f4f7fb', border: '1px dashed #cbd5e1' }}
                      >
                        Selecciona un producto arriba (por ejemplo <strong>Latte Grande</strong>)
                        para ver o editar sus ingredientes.
                      </div>
                    )}
                  </Form>
                </CardBody>
              </Card>
            </Col>
          </Row>

          {/* SECCIÓN 3: EXISTENCIAS EN BODEGA */}
          <Card className="kafe-card">
            <CardBody className="p-4">
              <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
                <div className="d-flex align-items-center gap-2">
                  <span className="kafe-icon-badge">📦</span>
                  <div>
                    <h4 className="font-kafe-display fw-bold mb-0 text-dark">
                      3. Existencias en Bodega
                    </h4>
                    <small className="text-dark">
                      {listaTablaBodega.length} artículos registrados
                    </small>
                  </div>
                </div>

                <div className="d-flex flex-wrap align-items-center gap-2">
                  <Input
                    type="search"
                    bsSize="sm"
                    className="kafe-input"
                    placeholder="Buscar por nombre..."
                    style={{ width: '200px' }}
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                  />

                  <ButtonGroup size="sm">
                    <Button
                      className={filtroTabla === 'TODOS' ? 'btn-kafe-primary' : 'btn-kafe-outline'}
                      onClick={() => setFiltroTabla('TODOS')}
                    >
                      Todos
                    </Button>
                    <Button
                      className={filtroTabla === 'INSUMO' ? 'btn-kafe-primary' : 'btn-kafe-outline'}
                      onClick={() => setFiltroTabla('INSUMO')}
                    >
                      Insumos
                    </Button>
                    <Button
                      className={filtroTabla === 'REVENTA' ? 'btn-kafe-primary' : 'btn-kafe-outline'}
                      onClick={() => setFiltroTabla('REVENTA')}
                    >
                      Reventa
                    </Button>
                  </ButtonGroup>
                </div>
              </div>

              {cargando ? (
                <div className="text-center py-4">
                  <Spinner color="primary" />
                </div>
              ) : (
                <Table responsive hover className="mb-0 align-middle">
                  <thead style={{ backgroundColor: '#003893', color: '#ffffff' }}>
                    <tr>
                      <th className="py-3 ps-3">ID</th>
                      <th className="py-3">Producto / Insumo</th>
                      <th className="py-3">Tipo</th>
                      <th className="py-3">Stock Actual</th>
                      <th className="py-3">Stock Mínimo</th>
                      <th className="py-3 pe-3 text-end">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listaTablaBodega.map((item) => {
                      const esCritico =
                        Number(item.stock_actual) <= Number(item.stock_minimo);

                      return (
                        <tr
                          key={item.id_producto}
                          className={esCritico ? 'table-danger' : 'bg-white'}
                        >
                          <td className="ps-3 fw-bold" style={{ color: '#003893' }}>
                            #{item.id_producto}
                          </td>
                          <td className="fw-semibold text-dark">{item.nombre}</td>
                          <td>
                            <Badge
                              style={
                                item.tipo === 'INSUMO'
                                  ? { backgroundColor: '#003893', color: '#ffffff' }
                                  : { backgroundColor: '#e6eefc', color: '#0f172a' }
                              }
                            >
                              {item.tipo}
                            </Badge>
                          </td>
                          <td className="fw-bold text-dark">
                            {item.stock_actual} {item.unidad}
                          </td>
                          <td className="text-dark">
                            {item.stock_minimo} {item.unidad}
                          </td>
                          <td className="pe-3 text-end">
                            <Badge
                              color={esCritico ? 'danger' : 'light'}
                              style={
                                !esCritico
                                  ? {
                                      backgroundColor: '#e6eefc',
                                      color: '#0f172a',
                                      border: '1px solid #cbd5e1',
                                    }
                                  : {}
                              }
                            >
                              {esCritico ? 'Bajo Stock' : 'Disponible'}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              )}
            </CardBody>
          </Card>
        </Container>
      </div>
    </div>
  );
};

export default InventarioPage;