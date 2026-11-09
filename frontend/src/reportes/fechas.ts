function pad(n: number) {
  return String(n).padStart(2, '0');
}

/** Valor para input datetime-local. */
export function aLocal(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function aIso(local: string): string | undefined {
  if (!local.trim()) return undefined;
  const d = new Date(local);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

export function formatearCorto(valor: string): string {
  return new Date(valor).toLocaleString('es-GT', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

export function etiquetaPeriodo(valor: string): string {
  return new Date(valor).toLocaleDateString('es-GT', {
    day: '2-digit',
    month: 'short',
    year: '2-digit',
  });
}
