import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSesion } from "../context/SesionContext.jsx";
import { useNotificaciones, Aviso } from "../components/Notificaciones.jsx";
import { cerrarCaja, obtenerCajaActiva } from "../services/cajaApi.js";
import { aDinero, aFechaHora, DENOMINACIONES, sumarConteo } from "../utils/formato.js";
import { validarMonto } from "../utils/validaciones.js";
import EncabezadoPagina from "../components/EncabezadoPagina.jsx";
import Campo from "../components/Campo.jsx";
import { Cargando, ErrorCarga, Vacio } from "../components/Estados.jsx";

const METODOS = [
    { clave: "efectivo", titulo: "Efectivo" },
    { clave: "tarjeta", titulo: "Tarjeta" },
    { clave: "bitcoin_chivo", titulo: "Bitcoin / Chivo" },
];

function claseDiferencia(n) {
    if (Number(n) === 0) return "dif--cero";
    return Number(n) > 0 ? "dif--sobra" : "dif--falta";
}

export default function CierreCaja() {
    const { usuario } = useSesion();
    const avisar = useNotificaciones();
    const [caja, setCaja] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [errorCarga, setErrorCarga] = useState("");
    const [conteo, setConteo] = useState({});
    const [usarConteo, setUsarConteo] = useState(true);
    const [form, setForm] = useState({ efectivo: "", tarjeta: "", bitcoin: "" });
    const [errores, setErrores] = useState({});
    const [enviando, setEnviando] = useState(false);
    const [confirmar, setConfirmar] = useState(false);
    const [resultado, setResultado] = useState(null);

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

    const efectivo = usarConteo ? String(sumarConteo(conteo)) : form.efectivo;

    function revisar(e) {
        e.preventDefault();
        const err = {};
        const ef = validarMonto(efectivo); if (ef) err.efectivo = ef;
        const ta = validarMonto(form.tarjeta); if (ta) err.tarjeta = ta;
        const bi = validarMonto(form.bitcoin); if (bi) err.bitcoin = bi;
        setErrores(err);
        if (!Object.keys(err).length) setConfirmar(true);
    }

    async function enviar() {
        setEnviando(true);
        try {
            const r = await cerrarCaja(caja.id_caja, {
                efectivo_fisico: Number(efectivo),
                tarjeta_voucher: Number(form.tarjeta),
                bitcoin_confirmado: Number(form.bitcoin),
            });
            setResultado(r);
            setConfirmar(false);
            Number(r.caja?.diferencia) === 0 ? avisar.exito(r.mensaje) : avisar.alerta(r.mensaje);
        } catch (e) {
            avisar.error(e.message);
            setConfirmar(false);
        } finally {
            setEnviando(false);
        }
    }

    if (resultado) {
        const d = resultado.desglose_cuadre || {};
        const c = resultado.caja || {};
        return (
            <div className="pagina">
                <EncabezadoPagina seccion="Caja" titulo={`Cierre de caja #${c.id_caja ?? ""}`} descripcion={resultado.mensaje} />
                <section className="tarjeta">
                    <table className="tabla">
                        <thead><tr><th>Método</th><th className="num">Esperado</th><th className="num">Reportado</th><th className="num">Diferencia</th></tr></thead>
                        <tbody>
                            {METODOS.map((m) => (
                                <tr key={m.clave}>
                                    <td>{m.titulo}</td>
                                    <td className="num">{aDinero(d[m.clave]?.esperado)}</td>
                                    <td className="num">{aDinero(d[m.clave]?.reportado)}</td>
                                    <td className={`num ${claseDiferencia(d[m.clave]?.diferencia)}`}>{aDinero(d[m.clave]?.diferencia)}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr><td>Total del turno</td><td /><td className="num">{aDinero(c.monto_final)}</td>
                                <td className={`num ${claseDiferencia(c.diferencia)}`}>{aDinero(c.diferencia)}</td></tr>
                        </tfoot>
                    </table>
                    <dl className="datos">
                        <div><dt>Apertura</dt><dd>{aFechaHora(c.hora_apertura)}</dd></div>
                        <div><dt>Cierre</dt><dd>{aFechaHora(c.hora_cierre)}</dd></div>
                        <div><dt>Estado</dt><dd>{c.estado}</dd></div>
                    </dl>
                    <div className="fila-acciones">
                        <button type="button" className="btn btn--secundario" onClick={() => window.print()}>Imprimir</button>
                        <Link to="/caja/apertura" className="btn btn--primario">Abrir nuevo turno</Link>
                    </div>
                </section>
            </div>
        );
    }

    return (
        <div className="pagina">
            <EncabezadoPagina seccion="Caja" titulo="Cierre y cuadre de caja"
                descripcion="Ingresa lo contado físicamente por método de pago. El sistema calcula lo esperado y las diferencias." />

            {cargando ? <Cargando texto="Consultando caja abierta..." /> :
                errorCarga ? <ErrorCarga texto={errorCarga} onReintentar={cargar} /> :
                    !caja ? (
                        <Vacio titulo="No hay caja abierta" texto="Primero debes abrir un turno en esta sucursal.">
                            <Link to="/caja/apertura" className="btn btn--primario">Ir a apertura</Link>
                        </Vacio>
                    ) : (
                        <form className="grid-cierre" onSubmit={revisar} noValidate>
                            <section className="tarjeta">
                                <div className="tarjeta__cabecera">
                                    <h2>Efectivo</h2>
                                    <label className="switch">
                                        <input type="checkbox" checked={usarConteo} onChange={(e) => setUsarConteo(e.target.checked)} />
                                        Contar por denominación
                                    </label>
                                </div>
                                {usarConteo ? (
                                    <div className="conteo">
                                        {DENOMINACIONES.map((d) => (
                                            <label key={d} className="conteo__fila">
                                                <span>{d >= 1 ? `$${d}` : `${Math.round(d * 100)}¢`}</span>
                                                <input type="number" min="0" step="1" inputMode="numeric" placeholder="0" value={conteo[d] ?? ""}
                                                    onChange={(e) => setConteo({ ...conteo, [d]: e.target.value.replace(/\D/g, "") })} />
                                                <em>{aDinero(d * (Number(conteo[d]) || 0))}</em>
                                            </label>
                                        ))}
                                        <div className="conteo__total"><span>Total contado</span><strong>{aDinero(efectivo)}</strong></div>
                                        {errores.efectivo && <small className="campo__error">{errores.efectivo}</small>}
                                    </div>
                                ) : (
                                    <Campo id="efectivo" etiqueta="Efectivo contado" error={errores.efectivo}>
                                        <div className="input-prefijo"><span>$</span>
                                            <input id="efectivo" inputMode="decimal" placeholder="0.00" value={form.efectivo}
                                                onChange={(e) => setForm({ ...form, efectivo: e.target.value.replace(",", ".") })} /></div>
                                    </Campo>
                                )}
                            </section>

                            <section className="tarjeta">
                                <h2>Otros medios de pago</h2>
                                <Campo id="tarjeta" etiqueta="Tarjeta (suma de vouchers)" error={errores.tarjeta}>
                                    <div className="input-prefijo"><span>$</span>
                                        <input id="tarjeta" inputMode="decimal" placeholder="0.00" value={form.tarjeta}
                                            onChange={(e) => setForm({ ...form, tarjeta: e.target.value.replace(",", ".") })} /></div>
                                </Campo>
                                <Campo id="bitcoin" etiqueta="Bitcoin / Chivo Wallet (confirmado)" error={errores.bitcoin}>
                                    <div className="input-prefijo"><span>$</span>
                                        <input id="bitcoin" inputMode="decimal" placeholder="0.00" value={form.bitcoin}
                                            onChange={(e) => setForm({ ...form, bitcoin: e.target.value.replace(",", ".") })} /></div>
                                </Campo>
                                <dl className="datos datos--compacto">
                                    <div><dt>Caja</dt><dd>#{caja.id_caja}</dd></div>
                                    <div><dt>Fondo inicial</dt><dd>{aDinero(caja.monto_inicial)}</dd></div>
                                    <div><dt>Abierta desde</dt><dd>{aFechaHora(caja.hora_apertura)}</dd></div>
                                </dl>
                                <button className="btn btn--primario btn--bloque">Revisar y cerrar caja</button>
                            </section>
                        </form>
                    )}

            {confirmar && (
                <div className="modal" role="dialog" aria-modal="true">
                    <div className="modal__caja">
                        <h3>¿Confirmar cierre de caja #{caja.id_caja}?</h3>
                        <p className="texto-suave">Esta acción no se puede deshacer. Se enviarán estos montos:</p>
                        <dl className="datos">
                            <div><dt>Efectivo</dt><dd>{aDinero(efectivo)}</dd></div>
                            <div><dt>Tarjeta</dt><dd>{aDinero(form.tarjeta)}</dd></div>
                            <div><dt>Bitcoin / Chivo</dt><dd>{aDinero(form.bitcoin)}</dd></div>
                        </dl>
                        <Aviso tipo="alerta">Verifica el conteo antes de confirmar.</Aviso>
                        <div className="fila-acciones">
                            <button type="button" className="btn btn--secundario" onClick={() => setConfirmar(false)} disabled={enviando}>Volver</button>
                            <button type="button" className="btn btn--primario" onClick={enviar} disabled={enviando}>
                                {enviando ? "Cerrando..." : "Confirmar cierre"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
