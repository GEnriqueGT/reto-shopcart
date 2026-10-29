import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { documentoOpenApi } from '../../../compartido/contrato/registro.js';
import './catalogo.contrato.js';

describe('contrato de catálogo', () => {
  it('publica la búsqueda y exige bearer para crear una categoría', () => {
    const documento = documentoOpenApi();
    const buscar = documento.paths?.['/catalogo/productos']?.get;
    const crear = documento.paths?.['/catalogo/categorias']?.post;
    assert.ok(buscar);
    assert.equal(buscar?.security, undefined);
    assert.equal(crear?.security?.[0]?.acceso !== undefined, true);
  });
});
