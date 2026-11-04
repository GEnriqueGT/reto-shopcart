type Props = {
  cargando?: boolean;
  vacio?: boolean;
  error?: string | null;
  vacioTexto?: string;
  children: React.ReactNode;
};

export function Estado({ cargando, vacio, error, vacioTexto = 'No hay datos.', children }: Props) {
  if (cargando) {
    return <p className="sc-muted py-8 text-center">Cargando…</p>;
  }
  if (error) {
    return (
      <div className="sc-glass rounded-2xl px-4 py-6 text-center text-red-600 dark:text-red-300">
        {error}
      </div>
    );
  }
  if (vacio) {
    return <p className="sc-muted py-8 text-center">{vacioTexto}</p>;
  }
  return <>{children}</>;
}
