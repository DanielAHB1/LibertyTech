import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useSesion } from "../context/SesionContext.jsx";

const MENU = [
  { grupo: "Caja", items: [
    { a: "/caja/apertura", texto: "Apertura de caja" },
    { a: "/caja/cierre", texto: "Cierre y cuadre" },
  ]},
  { grupo: "Recursos humanos", items: [
    { a: "/rrhh/empleados", texto: "Empleados" },
    { a: "/rrhh/planillas", texto: "Planillas y boletas" },
  ]},
];

export default function Layout() {
  const { usuario, salir } = useSesion();
  const navegar = useNavigate();
  const [abierto, setAbierto] = useState(false);
  const iniciales = (usuario?.nombre || "?").split(" ").map((p) => p[0]).slice(0, 2).join("");

  return (
    <div className="app">
      <aside className={`sidebar ${abierto ? "sidebar--abierto" : ""}`}>
        <div className="marca">
          <span className="marca__sello">O</span>
          <div>
            <strong>Orígenes</strong>
            <small>ERP · POS</small>
          </div>
        </div>
        <nav>
          {MENU.map((g) => (
            <div key={g.grupo} className="nav__grupo">
              <span>{g.grupo}</span>
              {g.items.map((i) => (
                <NavLink key={i.a} to={i.a} onClick={() => setAbierto(false)}
                  className={({ isActive }) => `nav__link ${isActive ? "nav__link--activo" : ""}`}>
                  {i.texto}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="usuario">
          <span className="avatar">{iniciales}</span>
          <div>
            <strong>{usuario?.nombre}</strong>
            <small>{usuario?.rol} · {usuario?.sucursal || `Sucursal ${usuario?.id_sucursal ?? ""}`}</small>
          </div>
          <button type="button" className="salir" onClick={() => { salir(); navegar("/login"); }}>Salir</button>
        </div>
      </aside>
      {abierto && <div className="velo" onClick={() => setAbierto(false)} />}
      <main className="contenido">
        <button type="button" className="menu-movil" onClick={() => setAbierto(true)} aria-label="Abrir menú">☰ Menú</button>
        <Outlet />
      </main>
    </div>
  );
}