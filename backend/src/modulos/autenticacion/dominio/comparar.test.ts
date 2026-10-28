import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { hashToken, iguales } from './comparar.js';

describe('comparar tokens', () => {
  it('trata como iguales dos hashes idénticos', () => {
    const hash = hashToken('refresh-demo');
    assert.equal(iguales(hash, hash), true);
  });

  it('rechaza un hash distinto', () => {
    assert.equal(iguales(hashToken('uno'), hashToken('dos')), false);
  });
});
