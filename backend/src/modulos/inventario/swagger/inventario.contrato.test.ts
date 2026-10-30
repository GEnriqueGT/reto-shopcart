import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { documentoOpenApi } from '../../../compartido/contrato/registro.js';
import './inventario.contrato.js';

describe('contrato de inventario', () => {
  it('exige bearer para registrar un movimiento', () => {
    const documento = documentoOpenApi();
    const registrar = documento.paths?.['/inventario/movimientos']?.post;
    const existencia = documento.paths?.['/inventario/variantes/{idVariante}/existencia']?.get;
    assert.equal(registrar?.security?.[0]?.acceso !== undefined, true);
    assert.ok(existencia);
  });
});
