import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { obtenerEmpleados, eliminarEmpleado } from "../services/rrhhApi.js";
import { obtenerSucursales } from "../services/authApi.js";
import { useNotificaciones } from "../components/Notificaciones.jsx";
import { aDinero, CARGOS } from "../utils/formato.js";
import EncabezadoPagina from "../components/EncabezadoPagina.jsx";
import { Cargando, ErrorCarga, Vacio } from "../components/Estados.jsx";

export default function Empleados() {
    const avisar = useNotificaciones();
    const [empleados, setEmpleados] = useState([]);
    const [sucursales, setSucursales] = useState([]);
    const [filtros, setFiltros] = useState({ id_sucursal: "", cargo: "" });
    const [busqueda, setBusqueda] = useState("");
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");
    const [porEliminar, setPorEliminar] = useState(null);

    useEffect(() => {
        obtenerSucursales().then(setSucursales).catch(() => setSucursales([]));
    }, []);

    const cargar = useCallback(async () => {
        setCargando(true);
        setError("");
        try {
            setEmpleados(await obtenerEmpleados(filtros));
        } catch (e) {
            setError(e.message);
        } finally {
            setCargando(false);
        }
    }, [filtros]);

    useEffect(() => { cargar(); }, [cargar]);

    const visibles = useMemo(() => {
        const q = busqueda.trim().toLowerCase();
        if (!q) return empleados;
        return empleados.filter((e) => `${e.nombre} ${e.apellido} ${e.dui}`.toLowerCase().includes(q));
    }, [empleados, busqueda]);

    const nombreSucursal = (id) => sucursales.find((s) => String(s.id_sucursal) === String(id))?.nombre || `Sucursal ${id}`;

    async function confirmarEliminar() {
        try {
            await eliminarEmpleado(porEliminar.id_empleado);
            avisar.exito("Empleado eliminado");
            setPorEliminar(null);
            cargar();
        } catch (e) {
            avisar.error(e.message);
        }
    }

    return (
        <div className="pagina">
            <EncabezadoPagina seccion="Recursos humanos" titulo="Empleados" descripcion="Personal registrado por sucursal y puesto.">
                <Link to="/rrhh/empleados/nuevo" className="btn btn--primario">+ Nuevo empleado</Link>
            </EncabezadoPagina>

            <div className="filtros">
                <input type="search" placeholder="Buscar por nombre o DUI" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
                <select value={filtros.id_sucursal} onChange={(e) => setFiltros({ ...filtros, id_sucursal: e.target.value })}>
                    <option value="">Todas las sucursales</option>
                    {sucursales.map((s) => <option key={s.id_sucursal} value={s.id_sucursal}>{s.nombre}</option>)}
                </select>
                <select value={filtros.cargo} onChange={(e) => setFiltros({ ...filtros, cargo: e.target.value })}>
                    <option value="">Todos los puestos</option>
                    {CARGOS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
            </div>

            {cargando ? <Cargando texto="Cargando empleados..." /> :
                error ? <ErrorCarga texto={error} onReintentar={cargar} /> :
                    visibles.length === 0 ? (
                        <Vacio titulo="Sin empleados para mostrar" texto="No hay registros con los filtros seleccionados." />
                    ) : (
                        <div className="tarjeta tarjeta--tabla">
                            <table className="tabla">
                                <thead><tr><th>Empleado</th><th>DUI</th><th>Puesto</th><th>Sucursal</th><th className="num">Salario mensual</th><th /></tr></thead>
                                <tbody>
                                    {visibles.map((e) => (
                                        <tr key={e.id_empleado}>
                                            <td data-label="Empleado"><strong>{e.nombre} {e.apellido}</strong></td>
                                            <td data-label="DUI">{e.dui}</td>
                                            <td data-label="Puesto"><span className="chip">{e.cargo}</span></td>
                                            <td data-label="Sucursal">{e.sucursal || nombreSucursal(e.id_sucursal)}</td>
                                            <td data-label="Salario" className="num">{aDinero(e.salario_mensual)}</td>
                                            <td className="tabla__acciones">
                                                <Link to={`/rrhh/empleados/${e.id_empleado}/editar`} className="btn btn--fantasma">Editar</Link>
                                                <button type="button" className="btn btn--peligro-suave" onClick={() => setPorEliminar(e)}>Eliminar</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

            {porEliminar && (
                <div className="modal" role="dialog" aria-modal="true">
                    <div className="modal__caja">
                        <h3>¿Eliminar a {porEliminar.nombre} {porEliminar.apellido}?</h3>
                        <p className="texto-suave">El registro dejará de aparecer en las planillas futuras.</p>
                        <div className="fila-acciones">
                            <button type="button" className="btn btn--secundario" onClick={() => setPorEliminar(null)}>Cancelar</button>
                            <button type="button" className="btn btn--peligro" onClick={confirmarEliminar}>Eliminar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}