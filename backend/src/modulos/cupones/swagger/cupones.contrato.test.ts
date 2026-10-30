import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { documentoOpenApi } from '../../../compartido/contrato/registro.js';
import './cupones.contrato.js';

describe('contrato de cupones', () => {
  it('exige bearer para crear y para evaluar', () => {
    const documento = documentoOpenApi();
    const crear = documento.paths?.['/cupones']?.post;
    const evaluar = documento.paths?.['/cupones/evaluar']?.post;
    assert.equal(crear?.security?.[0]?.acceso !== undefined, true);
    assert.equal(evaluar?.security?.[0]?.acceso !== undefined, true);
  });
});
