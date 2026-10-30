import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { dtoCrearCupon, dtoListarCupones } from './cupones.dto.js';

const vigencia = {
  vigenteDesde: '2026-01-01T00:00:00.000Z',
  vigenteHasta: '2026-12-31T23:59:59.000Z',
};

describe('dto de cupón', () => {
  it('acepta un porcentaje y rechaza un monto de más', () => {
    const cupon = dtoCrearCupon.parse({
      codigo: 'BIENVENIDA',
      tipo: 'Porcentaje',
      porcentaje: '10.00',
      monto: null,
      minimo: '50.00',
      limite: 100,
      limitePorCliente: 1,
      alcance: 'Carrito',
      idCategoria: null,
      ...vigencia,
    });
    assert.equal(cupon.porcentaje, '10.00');
    assert.throws(() =>
      dtoCrearCupon.parse({
        codigo: 'BIENVENIDA',
        tipo: 'Porcentaje',
        porcentaje: '10.00',
        monto: '5.00',
        minimo: '0.00',
        limite: 10,
        limitePorCliente: 1,
        alcance: 'Carrito',
        idCategoria: null,
        ...vigencia,
      }),
    );
  });

  it('rellena la página del listado', () => {
    const consulta = dtoListarCupones.parse({});
    assert.equal(consulta.pagina, 1);
    assert.equal(consulta.tamano, 20);
  });
});
