import { Navigate, useLocation } from "react-router-dom";
import { useSesion } from "../context/SesionContext.jsx";

export default function RutaProtegida({ children, roles }) {
  const { usuario } = useSesion();
  const ubicacion = useLocation();
  if (!usuario) return <Navigate to="/login" replace state={{ desde: ubicacion.pathname }} />;
  if (roles && !roles.includes(String(usuario.rol).toUpperCase())) {
    return (
      <div className="sin-permiso">
        <h2>Acceso restringido</h2>
        <p>Tu rol no tiene permiso para ver esta sección.</p>
      </div>
    );
  }
  return children;
}