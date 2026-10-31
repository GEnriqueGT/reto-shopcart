import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { documentoOpenApi } from '../../../compartido/contrato/registro.js';
import './reportes.contrato.js';

describe('contrato de reportes', () => {
  it('exige bearer para consultar las ventas', () => {
    const documento = documentoOpenApi();
    const ventas = documento.paths?.['/reportes/ventas']?.get;
    assert.equal(ventas?.security?.[0]?.acceso !== undefined, true);
  });
});
