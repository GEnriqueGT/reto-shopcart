import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { documentoOpenApi } from '../../../compartido/contrato/registro.js';
import './pago.contrato.js';

describe('contrato de pago', () => {
  it('publica los envíos y exige bearer para iniciar el pago', () => {
    const documento = documentoOpenApi();
    const envios = documento.paths?.['/pago/envios']?.get;
    const iniciar = documento.paths?.['/pago/iniciar']?.post;
    assert.equal(envios?.security, undefined);
    assert.equal(iniciar?.security?.[0]?.acceso !== undefined, true);
  });
});
