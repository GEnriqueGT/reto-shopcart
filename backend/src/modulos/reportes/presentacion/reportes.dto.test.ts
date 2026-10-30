import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { esquemaCarritoAbandonado, esquemaVentaPeriodo } from '../dominio/reportes.js';
import { dtoConsultarPedidos, dtoRango, dtoVentas } from './reportes.dto.js';

describe('dto de reportes', () => {
  it('pide el periodo y rechaza un rango invertido', () => {
    const ventas = dtoVentas.parse({ periodo: 'Dia', desde: '', hasta: '2026-10-30T00:00:00.000Z' });
    assert.equal(ventas.periodo, 'Dia');
    assert.equal(ventas.desde, undefined);
    assert.throws(() =>
      dtoRango.parse({ desde: '2026-10-31T00:00:00.000Z', hasta: '2026-10-01T00:00:00.000Z' }),
    );
    assert.throws(() => dtoVentas.parse({ periodo: 'Dia', cliente: 1 }));
  });

  it('rellena la página y deja fuera al pedido cancelado', () => {
    const consulta = dtoConsultarPedidos.parse({ estado: 'Pagado', idUsuario: '4' });
    assert.equal(consulta.pagina, 1);
    assert.equal(consulta.tamano, 20);
    assert.equal(consulta.idUsuario, 4);
    assert.throws(() => dtoConsultarPedidos.parse({ estado: 'Cancelado' }));
  });

  it('lee la fila de la venta y del carrito abandonado', () => {
    const venta = esquemaVentaPeriodo.parse({
      Periodo: '2026-10-01T00:00:00.000Z',
      Pedidos: 2,
      Monto: '70.00',
    });
    assert.equal(venta.Monto, '70.00');
    const carrito = esquemaCarritoAbandonado.parse({
      IDCarrito: 3,
      IDUsuario: null,
      Invitado: 1,
      Subtotal: '19.99',
      Descuento: '0.00',
      Total: '19.99',
      ActualizadoEn: '2026-10-30T12:00:00.000Z',
      Items: 1,
    });
    assert.equal(carrito.Invitado, true);
  });
});
