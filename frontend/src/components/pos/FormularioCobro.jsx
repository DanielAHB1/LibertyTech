
import { useState } from "react";

function FormularioCobro() {
  // Guarda las opciones seleccionadas para realizar el cobro.
  const [metodoPago, setMetodoPago] = useState("EFECTIVO");
  const [tipoComprobante, setTipoComprobante] = useState("FCF");

  // Guarda los datos del cliente cuando solicita CCF.
  const [nombreCliente, setNombreCliente] = useState("");
  const [nit, setNit] = useState("");
  const [nrc, setNrc] = useState("");

  return (
    <section className="pos-cobro" aria-labelledby="pos-cobro-titulo">
      <h2 id="pos-cobro-titulo">Cobrar pedido</h2>

      {/* Permite elegir cómo pagará el cliente. */}
      <label htmlFor="pos-metodo-pago">Método de pago</label>
      <select
        id="pos-metodo-pago"
        value={metodoPago}
        onChange={(evento) => setMetodoPago(evento.target.value)}
      >
        <option value="EFECTIVO">Efectivo</option>
        <option value="TARJETA">Tarjeta</option>
        <option value="BITCOIN">Bitcoin / Chivo</option>
      </select>

      {/* Selecciona el tipo de comprobante de la venta. */}
      <label htmlFor="pos-tipo-comprobante">Tipo de comprobante</label>
      <select
        id="pos-tipo-comprobante"
        value={tipoComprobante}
        onChange={(evento) => setTipoComprobante(evento.target.value)}
      >
        <option value="FCF">Factura de Consumidor Final</option>
        <option value="CCF">Comprobante de Crédito Fiscal</option>
      </select>

      {/* Solicita los datos fiscales únicamente cuando se elige CCF. */}
      {tipoComprobante === "CCF" && (
        <div className="pos-cobro__cliente">
          <label htmlFor="pos-nombre-cliente">Nombre del cliente</label>
          <input
            id="pos-nombre-cliente"
            type="text"
            value={nombreCliente}
            onChange={(evento) => setNombreCliente(evento.target.value)}
            required
          />

          <label htmlFor="pos-nit">NIT</label>
          <input
            id="pos-nit"
            type="text"
            value={nit}
            onChange={(evento) => setNit(evento.target.value)}
            required
          />

          <label htmlFor="pos-nrc">NRC</label>
          <input
            id="pos-nrc"
            type="text"
            value={nrc}
            onChange={(evento) => setNrc(evento.target.value)}
            required
          />
        </div>
      )}
    </section>
  );
}

export default FormularioCobro;
