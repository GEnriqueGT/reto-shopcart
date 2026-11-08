export type TipoMovimiento = 'Entrada' | 'Salida' | 'Ajuste' | 'Devolucion';

export type MovimientoInventario = {
  IDMovimientoInventario: number;
  IDVariante: number;
  IDUsuario: number;
  Tipo: TipoMovimiento;
  Cantidad: number;
  Motivo: string;
  CreadoEn: string;
};

export type Existencia = {
  IDVariante: number;
  ExistenciaFisica: number;
  Disponible: number;
};

export type Kardex = {
  movimientos: MovimientoInventario[];
  total: number;
};

export type DatosMovimiento = {
  idVariante: number;
  tipo: TipoMovimiento;
  cantidad: number;
  motivo: string;
};
