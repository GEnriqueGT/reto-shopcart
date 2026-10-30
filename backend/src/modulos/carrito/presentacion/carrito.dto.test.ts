import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { dtoAplicarCupon, dtoFusionarCarrito, dtoLineaCarrito } from './carrito.dto.js';

describe('dto de carrito', () => {
  it('acepta una línea y rechaza un campo de más', () => {
    const linea = dtoLineaCarrito.parse({ idVariante: 4, cantidad: 2 });
    assert.equal(linea.cantidad, 2);
    assert.throws(() => dtoLineaCarrito.parse({ idVariante: 4, cantidad: 0 }));
    assert.throws(() => dtoLineaCarrito.parse({ idVariante: 4, cantidad: 1, usuario: 9 }));
  });

  it('recorta el código y exige un token de invitado', () => {
    const cupon = dtoAplicarCupon.parse({ codigo: ' BIENVENIDA ' });
    assert.equal(cupon.codigo, 'BIENVENIDA');
    assert.throws(() => dtoFusionarCarrito.parse({ token: 'corto' }));
  });
});
