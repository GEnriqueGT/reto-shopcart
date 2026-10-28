export type Producto = {
  idProducto: number;
  idCategoria: number;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
};

export type ImagenProducto = {
  idImagenProducto: number;
  idProducto: number;
  url: string;
  orden: number;
};

export type ProductoListado = {
  idProducto: number;
  nombre: string;
  idCategoria: number;
  categoria: string;
  precioDesde: string;
  disponible: boolean;
};
