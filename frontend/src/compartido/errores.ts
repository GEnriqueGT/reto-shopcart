export type ErrorApi = {
  estado: number;
  codigo?: string;
  mensaje: string;
};

export function esErrorApi(error: unknown): error is ErrorApi {
  return (
    typeof error === 'object' &&
    error !== null &&
    'mensaje' in error &&
    typeof (error as ErrorApi).mensaje === 'string'
  );
}

export function mensajeDeError(error: unknown): string {
  if (esErrorApi(error)) return error.mensaje;
  if (error instanceof Error) return error.message;
  return 'Ocurrió un error inesperado.';
}
