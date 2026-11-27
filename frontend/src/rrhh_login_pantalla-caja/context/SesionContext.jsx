import { createContext, useContext, useState } from "react";
import { CLAVE_TOKEN } from "../services/http.js";

const CLAVE_USUARIO = "origenes_usuario";
const Ctx = createContext(null);

function leerUsuario() {
  try {
    return JSON.parse(sessionStorage.getItem(CLAVE_USUARIO)) || null;
  } catch {
    return null;
  }
}

export function SesionProvider({ children }) {
  const [usuario, setUsuario] = useState(leerUsuario);

  const entrar = ({ token, usuario: u }) => {
    if (token) sessionStorage.setItem(CLAVE_TOKEN, token);
    sessionStorage.setItem(CLAVE_USUARIO, JSON.stringify(u));
    setUsuario(u);
  };
  const salir = () => {
    sessionStorage.removeItem(CLAVE_TOKEN);
    sessionStorage.removeItem(CLAVE_USUARIO);
    setUsuario(null);
  };

  return <Ctx.Provider value={{ usuario, entrar, salir }}>{children}</Ctx.Provider>;
}

export const useSesion = () => useContext(Ctx);