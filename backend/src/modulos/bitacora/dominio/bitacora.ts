import { z } from 'zod';

const modulo = z.enum(['Catalogo', 'Inventario', 'Cupones', 'Pedidos']);

export const esquemaBitacora = z
  .object({
    IDBitacora: z.number().int().positive(),
    IDUsuario: z.number().int().positive().nullable(),
    Modulo: modulo,
    Entidad: z.string().min(1).max(40),
    IDEntidad: z.number().int().positive(),
    Accion: z.string().min(1).max(40),
    ValorAnterior: z.string().min(1).max(500).nullable(),
    ValorNuevo: z.string().min(1).max(500).nullable(),
    CreadoEn: z.coerce.date(),
    Referencia: z.string().min(1).max(200).nullable(),
    IDProducto: z.number().int().positive().nullable(),
    IDCategoria: z.number().int().positive().nullable(),
    IDVariante: z.number().int().positive().nullable(),
    IDCupon: z.number().int().positive().nullable(),
    IDPedido: z.number().int().positive().nullable(),
    NombreProducto: z.string().min(1).max(160).nullable(),
    Descripcion: z.string().max(2000).nullable(),
    ImagenUrl: z.string().min(1).max(500).nullable(),
    Sku: z.string().min(1).max(40).nullable(),
    Precio: z.string().min(1).max(30).nullable(),
    Cantidad: z.number().int().nullable(),
    Motivo: z.string().min(1).max(200).nullable(),
  })
  .strict();

export type Bitacora = z.output<typeof esquemaBitacora>;

export const esquemaPaginaBitacora = z
  .object({
    entradas: z.array(esquemaBitacora),
    total: z.number().int().nonnegative(),
  })
  .strict();

export type PaginaBitacora = z.output<typeof esquemaPaginaBitacora>;
