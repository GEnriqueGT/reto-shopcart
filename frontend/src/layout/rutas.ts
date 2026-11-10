export function esPersonal(rol: string | null | undefined) {
  return rol === 'Operador' || rol === 'Administrador';
}

export function rutaInicio(rol: string | null | undefined) {
  return esPersonal(rol) ? '/inventario' : '/tienda';
}
