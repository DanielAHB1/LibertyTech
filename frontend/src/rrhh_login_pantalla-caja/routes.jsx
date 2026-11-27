import { Routes, Route, Navigate } from "react-router-dom";
import "./styles/rrhh_login_pantalla-caja.css";
import { NotificacionesProvider } from "./components/Notificaciones.jsx";
import { SesionProvider } from "./context/SesionContext.jsx";
import RutaProtegida from "./components/RutaProtegida.jsx";
import Layout from "./components/Layout.jsx";
import Login from "./pages/Login.jsx";
import AperturaCaja from "./pages/AperturaCaja.jsx";
import CierreCaja from "./pages/CierreCaja.jsx";
import Empleados from "./pages/Empleados.jsx";
import EmpleadoForm from "./pages/EmpleadoForm.jsx";
import Planillas from "./pages/Planillas.jsx";
import PlanillaDetalle from "./pages/PlanillaDetalle.jsx";
import Boleta from "./pages/Boleta.jsx";

export default function routes() {
    return (
        <NotificacionesProvider>
            <SesionProvider>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route element={<RutaProtegida><Layout /></RutaProtegida>}>
                        <Route path="/caja/apertura" element={<AperturaCaja />} />
                        <Route path="/caja/cierre" element={<CierreCaja />} />
                        <Route path="/rrhh/empleados" element={<Empleados />} />
                        <Route path="/rrhh/empleados/nuevo" element={<EmpleadoForm />} />
                        <Route path="/rrhh/empleados/:id/editar" element={<EmpleadoForm />} />
                        <Route path="/rrhh/planillas" element={<Planillas />} />
                        <Route path="/rrhh/planillas/:id" element={<PlanillaDetalle />} />
                        <Route path="/rrhh/planillas/:id/boleta/:idEmpleado" element={<Boleta />} />
                    </Route>
                    <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
            </SesionProvider>
        </NotificacionesProvider>
    );
}