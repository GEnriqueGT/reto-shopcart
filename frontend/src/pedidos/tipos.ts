export type EstadoPedido =
  | 'PendientePago'
  | 'Pagado'
  | 'EnPreparacion'
  | 'Despachado'
  | 'Entregado'
  | 'Cancelado';

export type Pedido = {
  IDPedido: number;
  IDUsuario: number;
  IDDireccion: number;
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
  Estado: EstadoPedido;
  LlaveIdempotencia: string;
  ExpiraEn: string;
  CreadoEn: string;
  ActualizadoEn: string;
  PagadoEn: string | null;
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
};

export type TransicionPedido = {
  IDTransicionPedido: number;
  IDPedido: number;
  IDUsuario: number;
  EstadoAnterior: EstadoPedido;
  EstadoNuevo: EstadoPedido;
  CreadoEn: string;
};

export type Devolucion = {
  IDDevolucion: number;
  IDPedido: number;
  IDUsuario: number;
  CreadoEn: string;
};

export type DetalleDevolucion = {
  IDDetalleDevolucion: number;
  IDDevolucion: number;
  IDDetallePedido: number;
  Cantidad: number;
};

export type PaginaPedidos = {
  pedidos: Pedido[];
  total: number;
};

export type ConsultaGestion = {
  pedido: Pedido;
  detalles: DetallePedido[];
  transiciones: TransicionPedido[];
  devoluciones: Devolucion[];
  lineas: DetalleDevolucion[];
};

export type FiltrosPedidos = {
  pagina: number;
  tamano: number;
  estado?: EstadoPedido;
};
