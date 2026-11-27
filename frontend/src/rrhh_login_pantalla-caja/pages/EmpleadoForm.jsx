import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { actualizarEmpleado, crearEmpleado, obtenerEmpleado } from "../services/rrhhApi.js";
import { obtenerSucursales } from "../services/authApi.js";
import { useNotificaciones, MensajeError } from "../components/Notificaciones.jsx";
import { CARGOS } from "../utils/formato.js";
import { validarEmpleado } from "../utils/validaciones.js";
import EncabezadoPagina from "../components/EncabezadoPagina.jsx";
import Campo from "../components/Campo.jsx";
import { Cargando, ErrorCarga } from "../components/Estados.jsx";

const VACIO = { nombre: "", apellido: "", dui: "", cargo: "", id_sucursal: "", salario_mensual: "" };

export default function EmpleadoForm() {
    const { id } = useParams();
    const editando = Boolean(id);
    const navegar = useNavigate();
    const avisar = useNotificaciones();
    const [form, setForm] = useState(VACIO);
    const [sucursales, setSucursales] = useState([]);
    const [errores, setErrores] = useState({});
    const [errorServidor, setErrorServidor] = useState("");
    const [cargando, setCargando] = useState(editando);
    const [errorCarga, setErrorCarga] = useState("");
    const [guardando, setGuardando] = useState(false);

    useEffect(() => {
        obtenerSucursales().then(setSucursales).catch(() => setSucursales([]));
    }, []);

    useEffect(() => {
        if (!editando) return;
        (async () => {
            try {
                const e = await obtenerEmpleado(id);
                setForm({ ...VACIO, ...e, id_sucursal: String(e.id_sucursal ?? ""), salario_mensual: String(e.salario_mensual ?? "") });
            } catch (e) {
                setErrorCarga(e.message);
            } finally {
                setCargando(false);
            }
        })();
    }, [id, editando]);

    const cambiar = (e) => {
        let v = e.target.value;
        if (e.target.name === "dui") {
            v = v.replace(/\D/g, "").slice(0, 9);
            if (v.length > 8) v = `${v.slice(0, 8)}-${v.slice(8)}`;
        }
        setForm({ ...form, [e.target.name]: v });
    };

    async function guardar(e) {
        e.preventDefault();
        const err = validarEmpleado(form);
        setErrores(err);
        setErrorServidor("");
        if (Object.keys(err).length) return;
        const cuerpo = {
            id_sucursal: Number(form.id_sucursal),
            nombre: form.nombre.trim(),
            apellido: form.apellido.trim(),
            cargo: form.cargo,
            dui: form.dui,
            salario_mensual: Number(form.salario_mensual),
        };
        setGuardando(true);
        try {
            editando ? await actualizarEmpleado(id, cuerpo) : await crearEmpleado(cuerpo);
            avisar.exito(editando ? "Empleado actualizado" : "Empleado registrado");
            navegar("/rrhh/empleados");
        } catch (e) {
            setErrorServidor(e.message);
        } finally {
            setGuardando(false);
        }
    }

    if (cargando) return <div className="pagina"><Cargando texto="Cargando empleado..." /></div>;
    if (errorCarga) return <div className="pagina"><ErrorCarga texto={errorCarga} /></div>;

    return (
        <div className="pagina">
            <EncabezadoPagina seccion="Recursos humanos" titulo={editando ? "Editar empleado" : "Nuevo empleado"}
                descripcion="Todos los campos son obligatorios." />
            <form className="tarjeta form" onSubmit={guardar} noValidate>
                <div className="form__grid">
                    <Campo id="nombre" etiqueta="Nombres" error={errores.nombre}>
                        <input id="nombre" name="nombre" value={form.nombre} onChange={cambiar} maxLength={100} />
                    </Campo>
                    <Campo id="apellido" etiqueta="Apellidos" error={errores.apellido}>
                        <input id="apellido" name="apellido" value={form.apellido} onChange={cambiar} maxLength={100} />
                    </Campo>
                    <Campo id="dui" etiqueta="DUI" error={errores.dui} ayuda="00000000-0">
                        <input id="dui" name="dui" inputMode="numeric" value={form.dui} onChange={cambiar} placeholder="00000000-0" />
                    </Campo>
                    <Campo id="cargo" etiqueta="Puesto" error={errores.cargo}>
                        <select id="cargo" name="cargo" value={form.cargo} onChange={cambiar}>
                            <option value="">Selecciona...</option>
                            {CARGOS.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </Campo>
                    <Campo id="id_sucursal" etiqueta="Sucursal" error={errores.id_sucursal}>
                        <select id="id_sucursal" name="id_sucursal" value={form.id_sucursal} onChange={cambiar}>
                            <option value="">Selecciona...</option>
                            {sucursales.map((s) => <option key={s.id_sucursal} value={s.id_sucursal}>{s.nombre}</option>)}
                        </select>
                    </Campo>
                    <Campo id="salario_mensual" etiqueta="Salario mensual (USD)" error={errores.salario_mensual}>
                        <div className="input-prefijo"><span>$</span>
                            <input id="salario_mensual" name="salario_mensual" inputMode="decimal" value={form.salario_mensual}
                                onChange={cambiar} placeholder="0.00" /></div>
                    </Campo>
                </div>
                <MensajeError texto={errorServidor} />
                <div className="fila-acciones">
                    <Link to="/rrhh/empleados" className="btn btn--secundario">Cancelar</Link>
                    <button className="btn btn--primario" disabled={guardando}>{guardando ? "Guardando..." : "Guardar"}</button>
                </div>
            </form>
        </div>
    );
}