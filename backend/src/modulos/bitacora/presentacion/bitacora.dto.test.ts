import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { esquemaBitacora } from '../dominio/bitacora.js';
import { dtoConsultarBitacora } from './bitacora.dto.js';

describe('dto de bitácora', () => {
  it('rellena la página y rechaza un módulo de más', () => {
    const consulta = dtoConsultarBitacora.parse({ modulo: 'Catalogo', desde: '' });
    assert.equal(consulta.pagina, 1);
    assert.equal(consulta.tamano, 20);
    assert.equal(consulta.modulo, 'Catalogo');
    assert.equal(consulta.desde, undefined);
    assert.throws(() => dtoConsultarBitacora.parse({ modulo: 'Pagos' }));
    assert.throws(() => dtoConsultarBitacora.parse({ pagina: 1, tamano: 20, usuario: 1 }));
  });

  it('lee la fila con el valor anterior vacío', () => {
    const fila = esquemaBitacora.parse({
      IDBitacora: 1,
      IDUsuario: null,
      Modulo: 'Pedidos',
      Entidad: 'Pedido',
      IDEntidad: 8,
      Accion: 'Estado',
      ValorAnterior: 'Pagado',
      ValorNuevo: 'EnPreparacion',
      CreadoEn: '2026-10-30T12:00:00.000Z',
    });
    assert.equal(fila.Accion, 'Estado');
    assert.equal(fila.IDUsuario, null);
  });
});
