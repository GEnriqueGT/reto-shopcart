import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { esquemaTransicionPedido } from '../dominio/pedidos.js';
import { dtoDevolver, dtoListarPedidos, dtoTransicionar } from './pedidos.dto.js';

describe('dto de pedidos', () => {
  it('rellena la página y rechaza un estado de más', () => {
    const consulta = dtoListarPedidos.parse({ estado: 'Pagado', idUsuario: '4' });
    assert.equal(consulta.pagina, 1);
    assert.equal(consulta.tamano, 20);
    assert.equal(consulta.idUsuario, 4);
    assert.equal(dtoListarPedidos.parse({ estado: '' }).estado, undefined);
    assert.throws(() => dtoListarPedidos.parse({ pagina: 1, tamano: 20, cliente: 1 }));
  });

  it('acepta el siguiente estado y una devolución sin líneas repetidas', () => {
    assert.equal(dtoTransicionar.parse({ estado: 'EnPreparacion' }).estado, 'EnPreparacion');
    assert.throws(() => dtoTransicionar.parse({ estado: 'Cancelado' }));
    const devolucion = dtoDevolver.parse({
      lineas: [
        { idDetallePedido: 1, cantidad: 2 },
        { idDetallePedido: 3, cantidad: 1 },
      ],
    });
    assert.equal(devolucion.lineas.length, 2);
    assert.throws(() =>
      dtoDevolver.parse({
        lineas: [
          { idDetallePedido: 1, cantidad: 1 },
          { idDetallePedido: 1, cantidad: 1 },
        ],
      }),
    );
    assert.throws(() => dtoDevolver.parse({ lineas: [{ idDetallePedido: 1, cantidad: 1 }], motivo: 'ya no' }));
  });

  it('lee la fila de la transición con los nombres de la columna', () => {
    const fila = esquemaTransicionPedido.parse({
      IDTransicionPedido: 1,
      IDPedido: 8,
      IDUsuario: 2,
      EstadoAnterior: 'Pagado',
      EstadoNuevo: 'EnPreparacion',
      CreadoEn: '2026-10-30T12:00:00.000Z',
    });
    assert.equal(fila.EstadoNuevo, 'EnPreparacion');
  });
});
