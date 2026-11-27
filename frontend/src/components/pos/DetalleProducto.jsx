import { useState } from "react";
import "./DetalleProducto.css";

function DetalleProducto({ producto, onCerrar, onAgregar }) {
  // Guarda la cantidad de unidades que desea vender el cajero.
  const [cantidad, setCantidad] = useState(1);

  if (!producto) return null;

  // Prepara la información del producto seleccionado.
  const precio = Number(producto.precio).toFixed(2);
  const categoria = producto.tipo === "REVENTA" ? "Reventa" : "Elaborado";

  return (
    <div className="pos-detalle__fondo">
      <section
        className="pos-detalle"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pos-detalle-titulo"
      >
        <button
          type="button"
          className="pos-detalle__cerrar"
          aria-label="Cerrar detalles"
          onClick={onCerrar}
        >
          ×
        </button>

        {/* Espacio reservado para la fotografía del producto. */}
        <div className="pos-detalle__imagen">
          <span>ORÍGENES SV</span>
        </div>

        {/* Muestra la información real recibida del backend. */}
        <div className="pos-detalle__contenido">
          <p className="pos-detalle__categoria">{categoria}</p>

          <h2 id="pos-detalle-titulo">{producto.nombre}</h2>

          <p className="pos-detalle__precio">${precio}</p>

          {/* Permite aumentar o disminuir la cantidad del producto. */}
          <div className="pos-detalle__cantidad">
            <span className="pos-detalle__cantidad-titulo">Cantidad</span>

            <div className="pos-detalle__cantidad-controles">
              <button
                type="button"
                aria-label="Disminuir cantidad"
                disabled={cantidad === 1}
                onClick={() => setCantidad((actual) => Math.max(1, actual - 1))}
              >
                −
              </button>

              <span aria-live="polite">{cantidad}</span>

              <button
                type="button"
                aria-label="Aumentar cantidad"
                onClick={() => setCantidad((actual) => actual + 1)}
              >
                +
              </button>
            </div>
          </div>

          {/* Envía el producto y la cantidad al pedido actual. */}
          <button
            type="button"
            className="pos-detalle__agregar"
            onClick={() => onAgregar(producto, cantidad)}
          >
            Agregar al pedido
          </button>
        </div>
      </section>
    </div>
  );
}

export default DetalleProducto;
