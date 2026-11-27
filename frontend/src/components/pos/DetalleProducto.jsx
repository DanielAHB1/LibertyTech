import "./DetalleProducto.css";

function DetalleProducto({ producto, onCerrar }) {
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
        </div>
      </section>
    </div>
  );
}

export default DetalleProducto;
