import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { dtoConsultarKardex, dtoRegistrarMovimiento } from './inventario.dto.js';

describe('dto de inventario', () => {
  it('pide motivo y rechaza un ajuste en cero', () => {
    const entrada = dtoRegistrarMovimiento.parse({
      idVariante: 1,
      tipo: 'Entrada',
      cantidad: 3,
      motivo: 'Compra',
    });
    assert.equal(entrada.tipo, 'Entrada');
    assert.throws(() =>
      dtoRegistrarMovimiento.parse({ idVariante: 1, tipo: 'Ajuste', cantidad: 0, motivo: 'Conteo' }),
    );
    assert.throws(() =>
      dtoRegistrarMovimiento.parse({ idVariante: 1, tipo: 'Salida', cantidad: 2, motivo: 'Venta', usuario: 1 }),
    );
  });

  it('rellena la página del kardex', () => {
    const consulta = dtoConsultarKardex.parse({ idVariante: '4' });
    assert.equal(consulta.pagina, 1);
    assert.equal(consulta.tamano, 20);
    assert.equal(consulta.idVariante, 4);
  });
});
