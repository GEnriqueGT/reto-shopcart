import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { documentoOpenApi } from '../../../compartido/contrato/registro.js';
import './bitacora.contrato.js';

describe('contrato de bitácora', () => {
  it('exige bearer para consultar la bitácora', () => {
    const documento = documentoOpenApi();
    const consulta = documento.paths?.['/bitacora']?.get;
    assert.equal(consulta?.security?.[0]?.acceso !== undefined, true);
  });
});
