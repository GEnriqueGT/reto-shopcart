import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { z } from 'zod';
import { leer } from './leer.js';

describe('leer la fila', () => {
  it('acepta los nombres de la columna', () => {
    const esquema = z.object({ IDVariante: z.number(), Precio: z.string() }).strict();
    const fila = leer(esquema, [{ IDVariante: 4, Precio: '19.99' }], 'NO', 'no');
    assert.deepEqual(fila, { IDVariante: 4, Precio: '19.99' });
  });
});
