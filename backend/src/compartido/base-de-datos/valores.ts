import { z } from 'zod';

export const bit = z.union([z.boolean(), z.number()]).transform((valor) => valor === true || valor === 1);

export const dinero = z.string().regex(/^\d+(\.\d+)?$/);
