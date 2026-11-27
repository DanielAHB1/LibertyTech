import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { iniciarSesion } from "../services/authApi.js";
import { useSesion } from "../context/SesionContext.jsx";
import { useNotificaciones, MensajeError } from "../components/Notificaciones.jsx";
import Campo from "../components/Campo.jsx";

export default function Login() {
    const { usuario, entrar } = useSesion();
    const avisar = useNotificaciones();
    const navegar = useNavigate();
    const desde = useLocation().state?.desde || "/caja/apertura";
    const [form, setForm] = useState({ usuario: "", clave: "" });
    const [errores, setErrores] = useState({});
    const [errorGeneral, setErrorGeneral] = useState("");
    const [enviando, setEnviando] = useState(false);
    const [verClave, setVerClave] = useState(false);

    if (usuario) return <Navigate to={desde} replace />;

    const cambiar = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    async function enviar(e) {
        e.preventDefault();
        const err = {};
        if (!form.usuario.trim()) err.usuario = "Ingresa tu usuario.";
        if (!form.clave) err.clave = "Ingresa tu contraseña.";
        setErrores(err);
        setErrorGeneral("");
        if (Object.keys(err).length) return;

        setEnviando(true);
        try {
            const sesion = await iniciarSesion(form.usuario.trim(), form.clave);
            if (!sesion.usuario) throw new Error("La respuesta del servidor no incluye el usuario.");
            entrar(sesion);
            avisar.exito(`Bienvenido, ${sesion.usuario.nombre}`);
            navegar(desde, { replace: true });
        } catch (error) {
            setErrorGeneral(error.estado === 401 ? "Usuario o contraseña incorrectos." : error.message);
        } finally {
            setEnviando(false);
        }
    }

    return (
        <div className="login">
            <section className="login__marca">
                <span className="eyebrow eyebrow--claro">Restaurante de especialidad</span>
                <h1>Orígenes <em>SV</em></h1>
                <p>Sistema de gestión ERP y punto de venta para todas las sucursales.</p>
                <ul>
                    <li>Ventas y facturación</li>
                    <li>Caja por turno</li>
                    <li>Recursos humanos y nómina</li>
                </ul>
            </section>
            <section className="login__panel">
                <form className="login__form" onSubmit={enviar} noValidate>
                    <h2>Iniciar sesión</h2>
                    <p className="texto-suave">Ingresa con las credenciales asignadas por administración.</p>
                    <Campo id="usuario" etiqueta="Usuario" error={errores.usuario}>
                        <input id="usuario" name="usuario" autoComplete="username" value={form.usuario} onChange={cambiar} autoFocus />
                    </Campo>
                    <Campo id="clave" etiqueta="Contraseña" error={errores.clave}>
                        <div className="input-grupo">
                            <input id="clave" name="clave" type={verClave ? "text" : "password"} autoComplete="current-password" value={form.clave} onChange={cambiar} />
                            <button type="button" onClick={() => setVerClave(!verClave)}>{verClave ? "Ocultar" : "Ver"}</button>
                        </div>
                    </Campo>
                    <MensajeError texto={errorGeneral} />
                    <button className="btn btn--primario o7-btn--bloque" disabled={enviando}>
                        {enviando ? "Verificando..." : "Entrar"}
                    </button>
                </form>
            </section>
        </div>
    );
}
