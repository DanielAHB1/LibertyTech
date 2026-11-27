export function Cargando({ texto = "Cargando..." }) {
  return (
    <div className="estado">
      <span className="spinner" aria-hidden="true" />
      <p>{texto}</p>
    </div>
  );
}

export function Vacio({ titulo, texto, children }) {
  return (
    <div className="estado estado--vacio">
      <span className="estado__marca">✦</span>
      <h3>{titulo}</h3>
      {texto && <p>{texto}</p>}
      {children}
    </div>
  );
}

export function ErrorCarga({ texto, onReintentar }) {
  return (
    <div className="estado estado--error">
      <h3>No se pudo cargar la información</h3>
      <p>{texto}</p>
      {onReintentar && (
        <button type="button" className="btn btn--secundario" onClick={onReintentar}>Reintentar</button>
      )}
    </div>
  );
}