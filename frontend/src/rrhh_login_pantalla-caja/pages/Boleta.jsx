import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { obtenerPlanilla } from "../services/rrhhApi.js";
import { aDinero, aFecha } from "../utils/formato.js";
import { Cargando, ErrorCarga, Vacio } from "../components/Estados.jsx";

export default function Boleta() {
  const { id, idEmpleado } = useParams();
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    obtenerPlanilla(id).then(setDatos).catch((e) => setError(e.message));
  }, [id]);

  if (error) return <div className="pagina"><ErrorCarga texto={error} /></div>;
  if (!datos) return <div className="pagina"><Cargando texto="Cargando boleta..." /></div>;

  const { planilla = {}, boletas } = datos;
  const b = boletas.find((x) => String(x.id_empleado) === String(idEmpleado));
  if (!b) return <div className="pagina"><Vacio titulo="Boleta no encontrada" texto="El empleado no pertenece a esta planilla." /></div>;

  const totalDescuentos = b.total_descuentos ?? null;

  return (
    <div className="pagina">
      <div className="no-imprimir fila-acciones fila-acciones--inicio">
        <Link to={`/rrhh/planillas/${id}`} className="volver">← Planilla #{id}</Link>
        <button type="button" className="btn btn--secundario" onClick={() => window.print()}>Imprimir boleta</button>
      </div>
      <article className="boleta">
        <header className="boleta__cabecera">
          <div>
            <span className="eyebrow eyebrow--claro">Boleta de pago</span>
            <h1>Orígenes SV</h1>
            <p>{planilla.sucursal || `Sucursal ${planilla.id_sucursal ?? ""}`}</p>
          </div>
          <dl>
            <div><dt>Planilla</dt><dd>#{planilla.id_planilla ?? id}</dd></div>
            <div><dt>Período</dt><dd>{aFecha(planilla.periodo_inicio)} – {aFecha(planilla.periodo_fin)}</dd></div>
            <div><dt>Fecha de pago</dt><dd>{aFecha(planilla.fecha_pago)}</dd></div>
          </dl>
        </header>
        <section className="boleta__empleado">
          <div><span>Empleado</span><strong>{b.nombre} {b.apellido}</strong></div>
          <div><span>DUI</span><strong>{b.dui || "—"}</strong></div>
          <div><span>Puesto</span><strong>{b.cargo}</strong></div>
        </section>
        <section className="boleta__cuerpo">
          <div>
            <h3>Ingresos</h3>
            <p><span>Salario quincenal</span><strong>{aDinero(b.salario_quincenal)}</strong></p>
          </div>
          <div>
            <h3>Descuentos</h3>
            <p><span>ISSS (3 %)</span><strong>{aDinero(b.isss)}</strong></p>
            <p><span>AFP (7.25 %)</span><strong>{aDinero(b.afp)}</strong></p>
            <p><span>Impuesto sobre la renta</span><strong>{aDinero(b.renta)}</strong></p>
            {totalDescuentos !== null && <p className="boleta__subtotal"><span>Total descuentos</span><strong>{aDinero(totalDescuentos)}</strong></p>}
          </div>
        </section>
        <footer className="boleta__total">
          <span>Líquido a recibir</span>
          <strong>{aDinero(b.liquido)}</strong>
        </footer>
        <div className="boleta__firmas">
          <div>Firma del empleado</div>
          <div>Recursos humanos</div>
        </div>
      </article>
    </div>
  );
}
