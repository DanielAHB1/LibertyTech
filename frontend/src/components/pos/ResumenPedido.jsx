import { useState } from "react";
import "./ResumenPedido.css";

function ResumenPedido({ pedido, onEliminar, onCambiarCantidad, onVaciar }) {
  // Controla si el cajero debe confirmar antes de vaciar el pedido.
  const [confirmarVaciado, setConfirmarVaciado] = useState(false);

  // Calcula el importe acumulado de los productos del pedido.
  const subtotal = pedido.reduce(
    (total, item) => total + Number(item.precio) * item.cantidad,
    0,
  );

  return (
    <aside className="pos-pedido" aria-label="Resumen del pedido">
      <h2>Pedido actual</h2>

      {pedido.length === 0 ? (
        <p>Tu pedido está vacío.</p>
      ) : (
        <ul className="pos-pedido__lista">
          {/* Muestra cada producto con su cantidad e importe. */}
          {pedido.map((item) => (
            <li className="pos-pedido__item" key={item.id_producto}>
              <div>
                <strong>{item.nombre}</strong>
                <p>
                  {item.cantidad} × ${Number(item.precio).toFixed(2)}
                </p>

                {/* Modifica las unidades sin eliminar el producto. */}
                <div className="pos-pedido__cantidad">
                  <button
                    type="button"
                    aria-label={`Disminuir cantidad de ${item.nombre}`}
                    disabled={item.cantidad === 1}
                    onClick={() => onCambiarCantidad(item.id_producto, -1)}
                  >
                    −
                  </button>

                  <span>{item.cantidad}</span>

                  <button
                    type="button"
                    aria-label={`Aumentar cantidad de ${item.nombre}`}
                    onClick={() => onCambiarCantidad(item.id_producto, 1)}
                  >
                    +
                  </button>
                </div>
              </div>

              <strong>
                ${(Number(item.precio) * item.cantidad).toFixed(2)}
              </strong>

              {/* Permite quitar un producto completo del pedido. */}
              <button
                type="button"
                className="pos-pedido__eliminar"
                onClick={() => onEliminar(item.id_producto)}
                aria-label={`Eliminar ${item.nombre} del pedido`}
              >
                Quitar
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="pos-pedido__total">
        <span>Subtotal de productos</span>
        <strong>${subtotal.toFixed(2)}</strong>
      </div>

      {/* Solicita confirmación antes de eliminar todo el pedido. */}
      {pedido.length > 0 && (
        <div className="pos-pedido__vaciar">
          {confirmarVaciado ? (
            <div className="pos-pedido__confirmacion">
              <p>¿Estás seguro de vaciar todo el pedido?</p>

              <button
                type="button"
                onClick={() => {
                  onVaciar();
                  setConfirmarVaciado(false);
                }}
              >
                Sí, vaciar
              </button>

              <button type="button" onClick={() => setConfirmarVaciado(false)}>
                Cancelar
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => setConfirmarVaciado(true)}>
              Vaciar pedido
            </button>
          )}
        </div>
      )}
    </aside>
  );
}

export default ResumenPedido;
