import { createContext, useCallback, useContext, useMemo, useState } from "react";

const Ctx = createContext(null);
const ICONOS = { exito: "✓", error: "!", alerta: "▲", info: "i" };

export function NotificacionesProvider({ children }) {
  const [lista, setLista] = useState([]);

  const quitar = useCallback((id) => setLista((l) => l.filter((n) => n.id !== id)), []);
  const agregar = useCallback(
    (tipo, texto, ms = 4500) => {
      const id = Date.now() + Math.random();
      setLista((l) => [...l, { id, tipo, texto }]);
      if (ms) setTimeout(() => quitar(id), ms);
    },
    [quitar]
  );

  const api = useMemo(
    () => ({
      exito: (t) => agregar("exito", t),
      error: (t) => agregar("error", t, 7000),
      alerta: (t) => agregar("alerta", t, 6000),
      info: (t) => agregar("info", t),
    }),
    [agregar]
  );

  return (
    <Ctx.Provider value={api}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {lista.map((n) => (
          <div key={n.id} className={`toast toast--${n.tipo}`}>
            <span className="toast__icono">{ICONOS[n.tipo]}</span>
            <p>{n.texto}</p>
            <button type="button" aria-label="Cerrar" onClick={() => quitar(n.id)}>×</button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useNotificaciones() {
  const c = useContext(Ctx);
  if (!c) throw new Error("Notificaciones debe usarse dentro de <NotificacionesProvider>");
  return c;
}

export function MensajeError({ texto }) {
  if (!texto) return null;
  return <p className="error-linea" role="alert">{texto}</p>;
}

export function Aviso({ tipo = "info", titulo, children }) {
  return (
    <div className={`aviso aviso--${tipo}`}>
      {titulo && <strong>{titulo}</strong>}
      <div>{children}</div>
    </div>
  );
}
