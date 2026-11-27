import "./ProductoCard.css";

function ProductoCard({ producto, imagen, onSeleccionar }) {
  // Identifica la categoría y formatea el precio.
  const esReventa = producto.tipo === "REVENTA";
  const precio = Number(producto.precio).toFixed(2);

  // Separa las medidas: 12oz → 12 oz, 340g → 340 g.
  const nombreVisible = producto.nombre.replace(
    /(\d+)\s*(oz|ml|g)\b/gi,
    (_, cantidad, unidad) => `${cantidad}\u00A0${unidad}`,
  );

  return (
    <article
      className="pos-card"
      role="button"
      tabIndex={0}
      onClick={onSeleccionar}
      onKeyDown={(evento) => {
        if (evento.key === "Enter" || evento.key === " ") {
          evento.preventDefault();
          onSeleccionar();
        }
      }}
    >
      <div className="pos-card__media">
        {/* Muestra la fotografía o un fondo temporal. */}
        {imagen ? (
          <img
            className="pos-card__photo"
            src={imagen}
            alt={nombreVisible}
            loading="lazy"
          />
        ) : (
          <div className="pos-card__placeholder" aria-hidden="true">
            <span>ORÍGENES SV</span>
          </div>
        )}

        <span className="pos-card__media-name">{nombreVisible}</span>
      </div>

      <div className="pos-card__info">
        <span className="pos-card__category">
          {esReventa ? "Reventa" : "Elaborado"}
        </span>

        <h3 className="pos-card__name">{nombreVisible}</h3>

        <p className="pos-card__price">${precio}</p>
      </div>
    </article>
  );
}

export default ProductoCard;
