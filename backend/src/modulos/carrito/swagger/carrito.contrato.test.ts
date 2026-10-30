import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { documentoOpenApi } from '../../../compartido/contrato/registro.js';
import './carrito.contrato.js';

describe('contrato de carrito', () => {
  it('permite consultar sin bearer y exige sesión para fusionar', () => {
    const documento = documentoOpenApi();
    const consultar = documento.paths?.['/carrito']?.get;
    const fusionar = documento.paths?.['/carrito/fusionar']?.post;
    assert.equal(consultar?.security, undefined);
    assert.equal(fusionar?.security?.[0]?.acceso !== undefined, true);
  });
});
