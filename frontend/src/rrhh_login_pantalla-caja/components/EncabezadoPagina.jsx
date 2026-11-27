export default function EncabezadoPagina({ seccion, titulo, descripcion, children }) {
  return (
    <header className="pagina__encabezado">
      <div>
        {seccion && <span className="eyebrow">{seccion}</span>}
        <h1>{titulo}</h1>
        {descripcion && <p>{descripcion}</p>}
      </div>
      {children && <div className="pagina__acciones">{children}</div>}
    </header>
  );
}