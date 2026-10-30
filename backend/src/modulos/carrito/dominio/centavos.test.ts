import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { centavos } from './centavos.js';

describe('centavos del carrito', () => {
  it('redondea el medio hacia arriba y deja dos decimales', () => {
    assert.equal(centavos('1.005'), '1.01');
    assert.equal(centavos('1.004'), '1.00');
    assert.equal(centavos('19.99'), '19.99');
  });
});
