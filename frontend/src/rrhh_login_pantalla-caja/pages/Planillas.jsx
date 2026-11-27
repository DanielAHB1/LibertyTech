import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { generarPlanilla, obtenerPlanillas } from "../services/rrhhApi.js";
import { obtenerSucursales } from "../services/authApi.js";
import { useNotificaciones, MensajeError } from "../components/Notificaciones.jsx";
import { aDinero, aFecha } from "../utils/formato.js";
import { validarPeriodo } from "../utils/validaciones.js";
import EncabezadoPagina from "../components/EncabezadoPagina.jsx";
import Campo from "../components/Campo.jsx";
import { Cargando, ErrorCarga, Vacio } from "../components/Estados.jsx";

const VACIO = { id_sucursal: "", periodo_inicio: "", periodo_fin: "", fecha_pago: "" };

export default function Planillas() {
    const avisar = useNotificaciones();
    const navegar = useNavigate();
    const [planillas, setPlanillas] = useState([]);
    const [sucursales, setSucursales] = useState([]);
    const [filtroSucursal, setFiltroSucursal] = useState("");
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");
    const [mostrarForm, setMostrarForm] = useState(false);
    const [form, setForm] = useState(VACIO);
    const [errores, setErrores] = useState({});
    const [errorServidor, setErrorServidor] = useState("");
    const [generando, setGenerando] = useState(false);

    useEffect(() => {
        obtenerSucursales().then(setSucursales).catch(() => setSucursales([]));
    }, []);

    const cargar = useCallback(async () => {
        setCargando(true);
        setError("");
        try {
            setPlanillas(await obtenerPlanillas({ id_sucursal: filtroSucursal }));
        } catch (e) {
            setError(e.message);
        } finally {
            setCargando(false);
        }
    }, [filtroSucursal]);

    useEffect(() => { cargar(); }, [cargar]);

    const nombreSucursal = (id) => sucursales.find((s) => String(s.id_sucursal) === String(id))?.nombre || `Sucursal ${id}`;
    const cambiar = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    async function generar(e) {
        e.preventDefault();
        const err = validarPeriodo(form);
        setErrores(err);
        setErrorServidor("");
        if (Object.keys(err).length) return;
        setGenerando(true);
        try {
            const r = await generarPlanilla({ ...form, id_sucursal: Number(form.id_sucursal) });
            avisar.exito(r.mensaje || "Planilla generada");
            setMostrarForm(false);
            setForm(VACIO);
            const idNueva = r.planilla?.id_planilla ?? r.id_planilla;
            idNueva ? navegar(`/rrhh/planillas/${idNueva}`) : cargar();
        } catch (e) {
            setErrorServidor(e.message);
        } finally {
            setGenerando(false);
        }
    }

    return (
        <div className="pagina">
            <EncabezadoPagina seccion="Nómina" titulo="Planillas quincenales"
                descripcion="Los descuentos de ISSS (3 %), AFP (7.25 %) e ISR los calcula el servidor según tablas vigentes.">
                <button type="button" className="btn btn--primario" onClick={() => setMostrarForm(!mostrarForm)}>
                    {mostrarForm ? "Cancelar" : "+ Generar planilla"}
                </button>
            </EncabezadoPagina>

            {mostrarForm && (
                <form className="tarjeta tarjeta--destacada form" onSubmit={generar} noValidate>
                    <h2>Nuevo período</h2>
                    <div className="form__grid form__grid--4">
                        <Campo id="p_suc" etiqueta="Sucursal" error={errores.id_sucursal}>
                            <select id="p_suc" name="id_sucursal" value={form.id_sucursal} onChange={cambiar}>
                                <option value="">Selecciona...</option>
                                {sucursales.map((s) => <option key={s.id_sucursal} value={s.id_sucursal}>{s.nombre}</option>)}
                            </select>
                        </Campo>
                        <Campo id="p_ini" etiqueta="Inicio del período" error={errores.periodo_inicio}>
                            <input id="p_ini" type="date" name="periodo_inicio" value={form.periodo_inicio} onChange={cambiar} />
                        </Campo>
                        <Campo id="p_fin" etiqueta="Fin del período" error={errores.periodo_fin}>
                            <input id="p_fin" type="date" name="periodo_fin" value={form.periodo_fin} onChange={cambiar} />
                        </Campo>
                        <Campo id="p_pago" etiqueta="Fecha de pago" error={errores.fecha_pago}>
                            <input id="p_pago" type="date" name="fecha_pago" value={form.fecha_pago} onChange={cambiar} />
                        </Campo>
                    </div>
                    <MensajeError texto={errorServidor} />
                    <div className="fila-acciones">
                        <button className="btn btn--primario" disabled={generando}>{generando ? "Generando..." : "Generar planilla"}</button>
                    </div>
                </form>
            )}

            <div className="filtros">
                <select value={filtroSucursal} onChange={(e) => setFiltroSucursal(e.target.value)}>
                    <option value="">Todas las sucursales</option>
                    {sucursales.map((s) => <option key={s.id_sucursal} value={s.id_sucursal}>{s.nombre}</option>)}
                </select>
            </div>

            {cargando ? <Cargando texto="Cargando planillas..." /> :
                error ? <ErrorCarga texto={error} onReintentar={cargar} /> :
                    planillas.length === 0 ? (
                        <Vacio titulo="Aún no hay planillas" texto="Genera el primer período quincenal para ver los pagos." />
                    ) : (
                        <div className="tarjeta tarjeta--tabla">
                            <table className="tabla">
                                <thead><tr><th>N.º</th><th>Sucursal</th><th>Período</th><th>Fecha de pago</th><th className="num">Total</th><th /></tr></thead>
                                <tbody>
                                    {planillas.map((p) => (
                                        <tr key={p.id_planilla}>
                                            <td data-label="N.º">#{p.id_planilla}</td>
                                            <td data-label="Sucursal">{p.sucursal || nombreSucursal(p.id_sucursal)}</td>
                                            <td data-label="Período">{aFecha(p.periodo_inicio)} – {aFecha(p.periodo_fin)}</td>
                                            <td data-label="Pago">{aFecha(p.fecha_pago)}</td>
                                            <td data-label="Total" className="num"><strong>{aDinero(p.total)}</strong></td>
                                            <td className="tabla__acciones">
                                                <Link to={`/rrhh/planillas/${p.id_planilla}`} className="btn btn--fantasma">Ver pagos</Link>
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