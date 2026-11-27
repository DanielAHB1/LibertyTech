export default function Campo({ etiqueta, error, ayuda, children, id }) {
  return (
    <div className={`campo ${error ? "campo--error" : ""}`}>
      <label htmlFor={id}>{etiqueta}</label>
      {children}
      {error ? <small className="campo__error">{error}</small> : ayuda && <small>{ayuda}</small>}
    </div>
  );
}
