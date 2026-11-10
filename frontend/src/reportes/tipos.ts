export type PeriodoVentas = 'Dia' | 'Semana' | 'Mes';

export type VentaPeriodo = {
  Periodo: string;
  Pedidos: number;
  Monto: string;
};

export type VentaCategoria = {
  IDCategoria: number;
  Categoria: string;
  Cantidad: number;
  Monto: string;
};

export type MasVendido = {
  IDProducto: number;
  Producto: string;
  Cantidad: number;
  Monto: string;
};

export type PedidoReporte = {
  IDPedido: number;
  IDUsuario: number;
  Estado: 'Pagado' | 'EnPreparacion' | 'Despachado' | 'Entregado';
  PagadoEn: string;
  Subtotal: string;
  Descuento: string;
  CostoEnvio: string;
  ImporteDevuelto: string;
  Monto: string;
};

export type PaginaPedidosReporte = {
  pedidos: PedidoReporte[];
  total: number;
};

export type CarritoAbandonado = {
  IDCarrito: number;
  IDUsuario: number | null;
  Invitado: boolean;
  Subtotal: string;
  Descuento: string;
  Total: string;
  ActualizadoEn: string;
  Items: number;
};

export type PaginaCarritos = {
  carritos: CarritoAbandonado[];
  total: number;
};

export type ModuloBitacora = 'Catalogo' | 'Inventario' | 'Cupones' | 'Pedidos';

export type EntradaBitacora = {
  IDBitacora: number;
  IDUsuario: number | null;
  Modulo: ModuloBitacora;
  Entidad: string;
  IDEntidad: number;
  Accion: string;
  ValorAnterior: string | null;
  ValorNuevo: string | null;
  CreadoEn: string;
  Referencia: string | null;
  IDProducto: number | null;
  IDCategoria: number | null;
  IDVariante: number | null;
  IDCupon: number | null;
  IDPedido: number | null;
  NombreProducto: string | null;
  Descripcion: string | null;
  ImagenUrl: string | null;
  Sku: string | null;
  Precio: string | null;
  Cantidad: number | null;
  Motivo: string | null;
};

export type PaginaBitacora = {
  entradas: EntradaBitacora[];
  total: number;
};

export type RangoFechas = {
  desde?: string;
  hasta?: string;
};
