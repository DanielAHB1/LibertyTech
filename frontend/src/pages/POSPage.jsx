
import { useEffect, useState } from "react";
import { posService } from "../services/posService";
import ProductoCard from "../components/pos/ProductoCard";
import ResumenPedido from "../components/pos/ResumenPedido";
import DetalleProducto from "../components/pos/DetalleProducto";
import "./POSPage.css";

function POSPage() {
  // Guarda los productos y el estado de la consulta.
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  // Guarda el producto que selecciona el cajero.
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);

  // Guarda los productos y cantidades del pedido actual.
  const [pedido, setPedido] = useState([]);

  // Guarda el resultado de la consulta de caja.
  const [estadoCaja, setEstadoCaja] = useState({
    caja: null,
    cargando: true,
    error: "",
  });

  // Carga los productos de la sucursal cuando se abre el POS.
  useEffect(() => {
    let activo = true;

    async function cargarProductos() {
      try {
        const datos = await posService.obtenerProductos(1);

        if (activo) {
          setProductos(datos);
        }
      } catch (err) {
        if (activo) {
          setError(err.message);
        }
      } finally {
        if (activo) {
          setCargando(false);
        }
      }
    }

    cargarProductos();

    return () => {
      activo = false;
    };
  }, []);

  // Consulta la caja abierta de la sucursal al iniciar el POS.
  useEffect(() => {
    let activo = true;

    async function cargarCaja() {
      try {
        const caja = await posService.obtenerCajaActiva(1);

        if (activo) {
          setEstadoCaja({ caja, cargando: false, error: "" });
        }
      } catch (err) {
        if (activo) {
          setEstadoCaja({
            caja: null,
            cargando: false,
            error: err.message,
          });
        }
      }
    }

    cargarCaja();

    return () => {
      activo = false;
    };
  }, []);

  // Agrega un producto o aumenta su cantidad si ya existe.
  function agregarAlPedido(producto, cantidad) {
    setPedido((actual) => {
      const existente = actual.find(
        (item) => item.id_producto === producto.id_producto,
      );

      if (existente) {
        return actual.map((item) =>
          item.id_producto === producto.id_producto
            ? { ...item, cantidad: item.cantidad + cantidad }
            : item,
        );
      }

      return [...actual, { ...producto, cantidad }];
    });

    setProductoSeleccionado(null);
  }

  // Elimina un producto del pedido sin modificar los demás.
  function eliminarDelPedido(idProducto) {
    setPedido((actual) =>
      actual.filter((item) => item.id_producto !== idProducto),
    );
  }

  // Aumenta o disminuye unidades sin permitir cantidades menores que uno.
  function cambiarCantidadPedido(idProducto, cambio) {
    setPedido((actual) =>
      actual.map((item) =>
        item.id_producto === idProducto
          ? { ...item, cantidad: Math.max(1, item.cantidad + cambio) }
          : item,
      ),
    );
  }

  // Limpia todos los productos del pedido actual.
  function vaciarPedido() {
    setPedido([]);
  }

  return (
    <main className="pos-page">
      <header className="pos-page__header">
        <p className="pos-page__eyebrow">Orígenes SV</p>
        <h1 className="pos-page__title">Punto de venta</h1>

        <p className="pos-page__description">
          Selecciona los productos para comenzar una venta.
        </p>

        {/* Muestra el estado de la caja consultado desde el backend. */}
        {estadoCaja.cargando && (
          <p className="pos-page__caja">
            Consultando estado de caja...
          </p>
        )}

        {estadoCaja.error && (
          <p
            className="pos-page__caja pos-page__caja--error"
            role="alert"
          >
            Error al consultar caja: {estadoCaja.error}
          </p>
        )}

        {!estadoCaja.cargando && !estadoCaja.error && (
          <p
            className={`pos-page__caja ${
              estadoCaja.caja
                ? "pos-page__caja--abierta"
                : "pos-page__caja--cerrada"
            }`}
          >
            {estadoCaja.caja
              ? `Caja #${estadoCaja.caja.id_caja} abierta — ${estadoCaja.caja.cajero}`
              : "No hay una caja abierta para esta sucursal."}
          </p>
        )}
      </header>

      <section className="pos-catalogo">
        <h2>Productos disponibles</h2>

        {/* Muestra las unidades agregadas al pedido. */}
        <p>
          Unidades en el pedido:{" "}
          {pedido.reduce((total, item) => total + item.cantidad, 0)}
        </p>

        {cargando && <p>Cargando productos...</p>}

        {error && (
          <p role="alert">
            No se pudieron cargar los productos: {error}
          </p>
        )}

        {!cargando && !error && productos.length === 0 && (
          <p>No hay productos disponibles para esta sucursal.</p>
        )}

        {!cargando && !error && (
          <>
            <div className="pos-productos">
              {/* Crea una tarjeta por cada producto recibido del backend. */}
              {productos.map((producto) => (
                <ProductoCard
                  key={producto.id_producto}
                  producto={producto}
                  onSeleccionar={() => setProductoSeleccionado(producto)}
                />
              ))}
            </div>

            {/* Abre los detalles del producto seleccionado. */}
            {productoSeleccionado && (
              <DetalleProducto
                producto={productoSeleccionado}
                onCerrar={() => setProductoSeleccionado(null)}
                onAgregar={agregarAlPedido}
              />
            )}
          </>
        )}
      </section>

      {/* Muestra los productos agregados y el subtotal del pedido. */}
      <ResumenPedido
        pedido={pedido}
        onEliminar={eliminarDelPedido}
        onCambiarCantidad={cambiarCantidadPedido}
        onVaciar={vaciarPedido}
      />
    </main>
  );
}

export default POSPage;
