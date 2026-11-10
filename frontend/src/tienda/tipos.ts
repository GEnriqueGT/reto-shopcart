export type CategoriaActiva = {
  IDCategoria: number;
  Nombre: string;
  Activo: boolean;
};

export type ProductoResumen = {
  IDProducto: number;
  Nombre: string;
  IDCategoria: number;
  Categoria: string;
  PrecioDesde: string;
  Disponible: boolean;
  Variantes: number;
  ImagenUrl: string | null;
};
export type BusquedaCatalogo = {
  productos: ProductoResumen[];
  total: number;
};

export type AtributoPublico = {
  Nombre: string;
  Valor: string;
};

export type VariantePublica = {
  IDVariante: number;
  Sku: string;
  Precio: string;
  Existencia: number;
  atributos: AtributoPublico[];
};

export type ImagenPublica = {
  IDImagenProducto: number;
  Url: string;
  Orden: number;
};

export type ProductoPublico = {
  IDProducto: number;
  IDCategoria: number;
  Categoria: string;
  Nombre: string;
  Descripcion: string | null;
  variantes: VariantePublica[];
  imagenes: ImagenPublica[];
};

export type OrdenCatalogo = 'nombre' | 'precio_asc' | 'precio_desc' | 'reciente';

export type FiltrosCatalogo = {
  pagina: number;
  tamano: number;
  texto?: string;
  idCategoria?: number;
  precioMin?: string;
  precioMax?: string;
  soloDisponibles?: boolean;
  orden: OrdenCatalogo;
};
