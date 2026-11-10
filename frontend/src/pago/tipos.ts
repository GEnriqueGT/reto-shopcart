export type MetodoEnvio = {
  IDMetodoEnvio: number;
  Nombre: string;
  Costo: string;
  Activo: boolean;
  RequiereDireccion: boolean;
};

export type Direccion = {
  IDDireccion: number;
  IDUsuario: number;
  Destinatario: string;
  Linea: string;
  Ciudad: string;
  Referencia: string | null;
  Activo: boolean;
  CreadoEn: string;
  ActualizadoEn: string;
};

export type DetallePedido = {
  IDDetallePedido: number;
  IDPedido: number;
  IDVariante: number;
  IDCategoria: number;
  Sku: string;
  Nombre: string;
  Cantidad: number;
  Precio: string;
  Importe: string;
  ImagenUrl: string | null;
};

export type Pedido = {
  IDPedido: number;
  IDUsuario: number;
  IDDireccion: number | null;
  Destinatario: string;
  Linea: string;
  Ciudad: string;
  Referencia: string | null;
  IDMetodoEnvio: number;
  NombreEnvio: string;
  CostoEnvio: string;
  Subtotal: string;
  Descuento: string;
  Iva: string;
  Total: string;
  IDCupon: number | null;
  CodigoCupon: string | null;
  Estado: string;
  LlaveIdempotencia: string;
  ExpiraEn: string;
  CreadoEn: string;
  ActualizadoEn: string;
  PagadoEn: string | null;
};

export type ConsultaPedido = {
  pedido: Pedido;
  detalles: DetallePedido[];
};
