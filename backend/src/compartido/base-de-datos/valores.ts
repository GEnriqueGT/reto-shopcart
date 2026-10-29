import { z } from 'zod';

export const bit = z.union([z.boolean(), z.number()]).transform((valor) => valor === true || valor === 1);

export const dinero = z.union([z.string(), z.number()]).transform((valor) => {
  const texto = String(valor);
  const punto = texto.indexOf('.');
  if (punto < 0) {
    return `${texto}.00`;
  }
  return `${texto.slice(0, punto)}.${(texto.slice(punto + 1) + '00').slice(0, 2)}`;
});
