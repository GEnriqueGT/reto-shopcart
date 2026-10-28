import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { traducirErrorSql } from './traducir-error-sql.js';

describe('traducir error sql', () => {
  it('convierte una sesión inválida en 401', () => {
    const error = traducirErrorSql({ number: 50401, message: 'SESION_INVALIDA|La sesión no es válida.' });
    assert.equal(error?.estado, 401);
    assert.equal(error?.codigo, 'SESION_INVALIDA');
  });
});
