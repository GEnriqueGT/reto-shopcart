import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { documentoOpenApi } from '../../../compartido/contrato/registro.js';
import './autenticacion.contrato.js';

describe('contrato de autenticación', () => {
  it('publica el acceso y exige bearer para cerrar sesión', () => {
    const documento = documentoOpenApi();
    const entrar = documento.paths?.['/autenticacion/entrar']?.post;
    const salir = documento.paths?.['/autenticacion/salir']?.post;
    assert.ok(entrar);
    assert.equal(salir?.security?.[0]?.acceso !== undefined, true);
  });
});
