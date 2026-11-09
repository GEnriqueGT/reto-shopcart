export type CategoriaAdmin = {
  IDCategoria: number;
  Nombre: string;
  Activo: boolean;
};

export type VarianteAdmin = {
  IDVariante: number;
  IDProducto: number;
  Sku: string;
  Precio: string;
  Existencia: number;
  Activo: boolean;
};

export type AtributoAdmin = {
  IDAtributoVariante: number;
  IDVariante: number;
  Nombre: string;
  Valor: string;
};

export type ImagenAdmin = {
  IDImagenProducto: number;
  IDProducto: number;
  Url: string;
  Orden: number;
};

export type ProductoAdmin = {
  IDProducto: number;
  IDCategoria: number;
  Categoria: string;
  Nombre: string;
  Descripcion: string | null;
  Activo: boolean;
  variantes: VarianteAdmin[];
  atributos: AtributoAdmin[];
  imagenes: ImagenAdmin[];
};

export type CuponAdmin = {
  IDCupon: number;
  Codigo: string;
  Tipo: 'Porcentaje' | 'Monto';
  Porcentaje: string | null;
  Monto: string | null;
  Minimo: string;
  Limite: number;
  Usos: number;
  LimitePorCliente: number;
  Alcance: 'Carrito' | 'Categoria';
  IDCategoria: number | null;
  VigenteDesde: string;
  VigenteHasta: string;
  Activo: boolean;
  CreadoEn: string;
  ActualizadoEn: string;
};

export type PaginaCupones = {
  cupones: CuponAdmin[];
  total: number;
};

export type UsuarioAdmin = {
  IDUsuario: number;
  IDRol: number;
  Correo: string;
  Rol: string;
  Activo: boolean;
};

export type PaginaUsuarios = {
  usuarios: UsuarioAdmin[];
  total: number;
};

export type DatosCategoria = { nombre: string };

export type DatosProducto = {
  idCategoria: number;
  nombre: string;
  descripcion: string | null;
};

export type DatosVariante = {
  sku: string;
  precio: string;
  existencia: number;
};

export type DatosAtributo = {
  nombre: string;
  valor: string;
};

export type DatosImagen = {
  url: string;
  orden: number;
};

export type DatosCupon = {
  codigo: string;
  tipo: 'Porcentaje' | 'Monto';
  porcentaje: string | null;
  monto: string | null;
  minimo: string;
  limite: number;
  limitePorCliente: number;
  alcance: 'Carrito' | 'Categoria';
  idCategoria: number | null;
  vigenteDesde: string;
  vigenteHasta: string;
};
