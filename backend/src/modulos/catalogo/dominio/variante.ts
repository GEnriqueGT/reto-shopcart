export type Variante = {
  idVariante: number;
  idProducto: number;
  sku: string;
  precio: string;
  existencia: number;
  activo: boolean;
};

export type AtributoVariante = {
  idAtributoVariante: number;
  idVariante: number;
  nombre: string;
  valor: string;
};
