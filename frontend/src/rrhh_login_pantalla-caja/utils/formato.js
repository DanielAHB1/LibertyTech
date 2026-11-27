// Formatos (solo presentación, no calcula importes) =====
const dinero = new Intl.NumberFormat("es-SV", { style: "currency", currency: "USD" });
export const aDinero = (n) => (n === null || n === undefined || n === "" ? "—" : dinero.format(Number(n)));
export const aFecha = (f) => (f ? new Date(f).toLocaleDateString("es-SV", { timeZone: "UTC" }) : "—");
export const aFechaHora = (f) => (f ? new Date(f).toLocaleString("es-SV") : "—");
export const CARGOS = ["GERENTE", "BARISTA", "CAJERO"];
export const DENOMINACIONES = [100, 50, 20, 10, 5, 1, 0.25, 0.1, 0.05, 0.01];
// Suma del conteo físico de billetes/monedas (ayuda al cajero; el cuadre lo hace el backend)
export const sumarConteo = (conteo) =>
  Math.round(DENOMINACIONES.reduce((s, d) => s + d * (Number(conteo[d]) || 0), 0) * 100) / 100;
