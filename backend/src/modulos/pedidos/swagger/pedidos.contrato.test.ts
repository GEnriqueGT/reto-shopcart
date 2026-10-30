import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { documentoOpenApi } from '../../../compartido/contrato/registro.js';
import './pedidos.contrato.js';

describe('contrato de pedidos', () => {
  it('exige bearer para cambiar el estado y publica el tablero', () => {
    const documento = documentoOpenApi();
    const transicionar = documento.paths?.['/pedidos/{idPedido}/transicionar']?.post;
    const colas = documento.paths?.['/pedidos/colas']?.get;
    assert.equal(transicionar?.security?.[0]?.acceso !== undefined, true);
    assert.equal(colas?.security?.[0]?.acceso !== undefined, true);
  });
});
