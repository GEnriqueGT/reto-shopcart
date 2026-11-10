function paginasVisibles(actual: number, total: number, maxVisible = 5): number[] {
  if (total <= maxVisible) return Array.from({ length: total }, (_, i) => i + 1);
  let inicio = Math.max(1, actual - Math.floor(maxVisible / 2));
  let fin = inicio + maxVisible - 1;
  if (fin > total) {
    fin = total;
    inicio = Math.max(1, fin - maxVisible + 1);
  }
  return Array.from({ length: fin - inicio + 1 }, (_, i) => inicio + i);
}

export function PaginacionPedidos({
  pagina,
  total,
  tamano,
  onCambiar,
}: {
  pagina: number;
  total: number;
  tamano: number;
  onCambiar: (pagina: number) => void;
}) {
  const totalPaginas = Math.max(1, Math.ceil(total / tamano));
  if (total <= tamano) return null;
  return (
    <div className="sc-paginacion">
      <nav className="sc-paginas" aria-label="Paginación">
        {paginasVisibles(pagina, totalPaginas).map((n) => {
          const activa = n === pagina;
          return (
            <button
              key={n}
              type="button"
              aria-label={`Página ${n}`}
              aria-current={activa ? 'page' : undefined}
              disabled={activa}
              onClick={() => onCambiar(n)}
              className={`sc-pagina ${activa ? 'sc-pagina-activa' : ''}`}
            >
              {n}
            </button>
          );
        })}
        <button
          type="button"
          aria-label="Página siguiente"
          disabled={pagina >= totalPaginas}
          onClick={() => onCambiar(Math.min(totalPaginas, pagina + 1))}
          className="sc-pagina sc-pagina-flecha"
        >
          ›
        </button>
      </nav>
      <p className="sc-muted text-sm">
        {total} · página {pagina} de {totalPaginas}
      </p>
    </div>
  );
}
