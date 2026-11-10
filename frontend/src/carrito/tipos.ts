export type Carrito = {
  IDCarrito: number;
  IDUsuario: number | null;
  Token: string | null;
  IDCupon: number | null;
  Codigo: string | null;
  Subtotal: string;
  Descuento: string;
  Total: string;
  CreadoEn: string;
  ActualizadoEn: string;
};

export type ItemCarrito = {
  IDItemCarrito: number;
  IDCarrito: number;
  IDVariante: number;
  Cantidad: number;
  Sku: string;
  Nombre: string;
  IDCategoria: number;
  Precio: string;
  Importe: string;
  Disponible: number;
  ImagenUrl: string | null;
};

export type ConsultaCarrito = {
  carrito: Carrito | null;
  items: ItemCarrito[];
};
