import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSesion } from "../context/SesionContext.jsx";
import { useNotificaciones, MensajeError, Aviso } from "../components/Notificaciones.jsx";
import { abrirCaja, obtenerCajaActiva } from "../services/cajaApi.js";
import { aDinero, aFechaHora } from "../utils/formato.js";
import { validarMonto } from "../utils/validaciones.js";
import EncabezadoPagina from "../components/EncabezadoPagina.jsx";
import Campo from "../components/Campo.jsx";
import { Cargando, ErrorCarga } from "../components/Estados.jsx";

export default function AperturaCaja() {
    const { usuario } = useSesion();
    const avisar = useNotificaciones();
    const [caja, setCaja] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [errorCarga, setErrorCarga] = useState("");
    const [monto, setMonto] = useState("");
    const [error, setError] = useState("");
    const [errorServidor, setErrorServidor] = useState("");
    const [enviando, setEnviando] = useState(false);

    const cargar = useCallback(async () => {
        setCargando(true);
        setErrorCarga("");
        try {
            setCaja(await obtenerCajaActiva(usuario.id_sucursal));
        } catch (e) {
            setErrorCarga(e.message);
        } finally {
            setCargando(false);
        }
    }, [usuario.id_sucursal]);

    useEffect(() => { cargar(); }, [cargar]);

    async function enviar(e) {
        e.preventDefault();
        const err = validarMonto(monto);
        setError(err || "");
        setErrorServidor("");
        if (err) return;
        setEnviando(true);
        try {
            const r = await abrirCaja({
                id_sucursal: usuario.id_sucursal,
                id_empleado: usuario.id_empleado,
                monto_inicial: Number(monto),
            });
            setCaja(r.caja);
            setMonto("");
            avisar.exito(r.mensaje || "Caja abierta correctamente");
        } catch (e) {
            setErrorServidor(e.message);
            avisar.error(e.message);
        } finally {
            setEnviando(false);
        }
    }

    return (
        <div className="pagina">
            <EncabezadoPagina seccion="Caja" titulo="Apertura de caja"
                descripcion={`Registra el fondo inicial del turno para ${usuario.sucursal || "tu sucursal"}.`} />

            {cargando ? <Cargando texto="Consultando estado de la caja..." /> :
                errorCarga ? <ErrorCarga texto={errorCarga} onReintentar={cargar} /> :
                    caja ? (
                        <section className="tarjeta tarjeta--destacada">
                            <div className="tarjeta__cabecera">
                                <h2>Caja #{caja.id_caja}</h2>
                                <span className="chip chip--exito">{caja.estado || "ABIERTA"}</span>
                            </div>
                            <dl className="datos">
                                <div><dt>Fondo inicial</dt><dd>{aDinero(caja.monto_inicial)}</dd></div>
                                <div><dt>Hora de apertura</dt><dd>{aFechaHora(caja.hora_apertura)}</dd></div>
                                <div><dt>Responsable</dt><dd>{caja.cajero || usuario.nombre}</dd></div>
                            </dl>
                            <Aviso tipo="info">Ya hay un turno abierto en esta sucursal. Al terminar el turno realiza el cierre.</Aviso>
                            <Link to="/caja/cierre" className="btn btn--primario">Ir al cierre de caja</Link>
                        </section>
                    ) : (
                        <form className="tarjeta form-angosto" onSubmit={enviar} noValidate>
                            <h2>Nuevo turno</h2>
                            <p className="texto-suave">No hay caja abierta. Cuenta el efectivo del fondo antes de iniciar.</p>
                            <Campo id="monto" etiqueta="Monto inicial (USD)" error={error}>
                                <div className="input-prefijo">
                                    <span>$</span>
                                    <input id="monto" inputMode="decimal" placeholder="0.00" value={monto}
                                        onChange={(e) => setMonto(e.target.value.replace(",", "."))} />
                                </div>
                            </Campo>
                            <MensajeError texto={errorServidor} />
                            <button className="btn btn--primario btn--bloque" disabled={enviando}>
                                {enviando ? "Abriendo..." : "Abrir caja"}
                            </button>
                        </form>
                    )}
        </div>
    );
}