import { useEffect, useState } from "react";
import { posService } from "../services/posService";
import ProductoCard from "../components/pos/ProductoCard";
import "./POSPage.css";

function POSPage() {
  // Guarda los productos y el estado de la consulta.
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  // Guarda el producto que selecciona el cajero.
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);

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

  return (
    <main className="pos-page">
      <header className="pos-page__header">
        <p className="pos-page__eyebrow">Orígenes SV</p>
        <h1 className="pos-page__title">Punto de venta</h1>
        <p className="pos-page__description">
          Selecciona los productos para comenzar una venta.
        </p>
      </header>

      <section className="pos-catalogo">
        <h2>Productos disponibles</h2>

        {cargando && <p>Cargando productos...</p>}

        {error && (
          <p role="alert">No se pudieron cargar los productos: {error}</p>
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

            {/* Confirma qué producto fue seleccionado. */}
            {productoSeleccionado && (
              <p>Producto seleccionado: {productoSeleccionado.nombre}</p>
            )}
          </>
        )}
      </section>
    </main>
  );
}

export default POSPage;
