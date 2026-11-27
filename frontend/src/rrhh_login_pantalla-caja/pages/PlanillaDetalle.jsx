import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { obtenerPlanilla } from "../services/rrhhApi.js";
import { aDinero, aFecha } from "../utils/formato.js";
import EncabezadoPagina from "../components/EncabezadoPagina.jsx";
import { Cargando, ErrorCarga, Vacio } from "../components/Estados.jsx";

export default function PlanillaDetalle() {
    const { id } = useParams();
    const [datos, setDatos] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");

    const cargar = useCallback(async () => {
        setCargando(true);
        setError("");
        try {
            setDatos(await obtenerPlanilla(id));
        } catch (e) {
            setError(e.message);
        } finally {
            setCargando(false);
        }
    }, [id]);

    useEffect(() => { cargar(); }, [cargar]);

    if (cargando) return <div className="pagina"><Cargando texto="Cargando planilla..." /></div>;
    if (error) return <div className="pagina"><ErrorCarga texto={error} onReintentar={cargar} /></div>;

    const { planilla = {}, boletas } = datos;

    return (
        <div className="pagina">
            <Link to="/rrhh/planillas" className="volver">← Planillas</Link>
            <EncabezadoPagina seccion="Nómina" titulo={`Planilla #${planilla.id_planilla ?? id}`}
                descripcion={`Período ${aFecha(planilla.periodo_inicio)} – ${aFecha(planilla.periodo_fin)} · Pago ${aFecha(planilla.fecha_pago)}`}>
                <div className="kpi"><span>Total a pagar</span><strong>{aDinero(planilla.total)}</strong></div>
            </EncabezadoPagina>

            {boletas.length === 0 ? (
                <Vacio titulo="Sin pagos registrados" texto="Esta planilla no tiene boletas asociadas." />
            ) : (
                <div className="tarjeta tarjeta--tabla">
                    <table className="tabla">
                        <thead><tr>
                            <th>Empleado</th><th>Puesto</th><th className="num">Salario quincenal</th><th className="num">ISSS</th>
                            <th className="num">AFP</th><th className="num">Renta</th><th className="num">Líquido</th><th />
                        </tr></thead>
                        <tbody>
                            {boletas.map((b) => (
                                <tr key={b.id_empleado}>
                                    <td data-label="Empleado"><strong>{b.nombre} {b.apellido}</strong></td>
                                    <td data-label="Puesto">{b.cargo}</td>
                                    <td data-label="Salario" className="num">{aDinero(b.salario_quincenal)}</td>
                                    <td data-label="ISSS" className="num">{aDinero(b.isss)}</td>
                                    <td data-label="AFP" className="num">{aDinero(b.afp)}</td>
                                    <td data-label="Renta" className="num">{aDinero(b.renta)}</td>
                                    <td data-label="Líquido" className="num"><strong>{aDinero(b.liquido)}</strong></td>
                                    <td className="o7-tabla__acciones">
                                        <Link to={`/rrhh/planillas/${id}/boleta/${b.id_empleado}`} className="btn btn--fantasma">Boleta</Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}