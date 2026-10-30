import { z } from 'zod';

const referencia = z.preprocess(
  (valor) => (typeof valor === 'string' && valor.trim() === '' ? null : valor),
  z.string().trim().min(1).max(200).nullable(),
);

export const dtoCrearDireccion = z
  .object({
    destinatario: z.string().trim().min(1).max(120),
    linea: z.string().trim().min(1).max(200),
    ciudad: z.string().trim().min(1).max(80),
    referencia,
  })
  .strict();

export const dtoIdDireccion = z
  .object({
    idDireccion: z.coerce.number().int().positive(),
  })
  .strict();

export const dtoIniciarPago = z
  .object({
    idDireccion: z.number().int().positive(),
    idMetodoEnvio: z.number().int().positive(),
    llave: z.string().trim().min(8).max(64),
  })
  .strict();

export const dtoCobrar = z
  .object({
    llave: z.string().trim().min(8).max(64),
    aprobado: z.boolean(),
  })
  .strict();

export const dtoIdPedido = z
  .object({
    idPedido: z.coerce.number().int().positive(),
  })
  .strict();

export type CrearDireccion = z.output<typeof dtoCrearDireccion>;
export type IniciarPago = z.output<typeof dtoIniciarPago>;
export type Cobrar = z.output<typeof dtoCobrar>;
