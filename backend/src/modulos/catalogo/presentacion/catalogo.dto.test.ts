import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { dtoBuscarCatalogo } from './catalogo.dto.js';

describe('dto de búsqueda del catálogo', () => {
  it('rellena la página y rechaza un campo de más', () => {
    const consulta = dtoBuscarCatalogo.parse({ texto: 'mesa' });
    assert.equal(consulta.pagina, 1);
    assert.equal(consulta.tamano, 20);
    assert.equal(consulta.orden, 'nombre');
    assert.equal(consulta.soloDisponibles, false);
    assert.equal(dtoBuscarCatalogo.parse({ soloDisponibles: '1' }).soloDisponibles, true);
    assert.throws(() => dtoBuscarCatalogo.parse({ texto: 'mesa', contrasena: 'no' }));
  });
});
