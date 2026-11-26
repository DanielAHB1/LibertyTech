
import { useEffect, useState } from 'react';
import { inventarioService } from '../services/inventarioService';
import './POSPage.css';

function POSPage() {
  // Guarda los productos y el estado de la consulta.
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  // Obtiene los productos elaborados al abrir el POS.
  useEffect(() => {
    let activo = true;

    async function cargarProductos() {
      try {
        const datos = await inventarioService.obtenerProductosElaborados();

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
        <h2>Menú elaborado</h2>

        {cargando && <p>Cargando productos...</p>}

        {error && (
          <p role="alert">
            No se pudieron cargar los productos: {error}
          </p>
        )}

        {!cargando && !error && productos.length === 0 && (
          <p>No hay productos elaborados disponibles.</p>
        )}

        {!cargando && !error && (
          <div className="pos-productos">
            {productos.map((producto) => (
              <article
                className="pos-producto"
                key={producto.id_producto}
              >
                <h3>{producto.nombre}</h3>
                <p>${Number(producto.precio).toFixed(2)}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default POSPage;
