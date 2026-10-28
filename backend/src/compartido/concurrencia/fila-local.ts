const colas = new Map<string, Promise<void>>();

export function enFila<T>(clave: string, trabajo: () => Promise<T>): Promise<T> {
  const anterior = colas.get(clave) ?? Promise.resolve();
  const actual = anterior.then(trabajo, trabajo);
  const hueco = actual.then(
    () => undefined,
    () => undefined,
  );
  colas.set(clave, hueco);
  void hueco.finally(() => {
    if (colas.get(clave) === hueco) {
      colas.delete(clave);
    }
  });
  return actual;
}
