import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { dtoCobrar, dtoCrearDireccion, dtoIniciarPago } from './pago.dto.js';

describe('dto de pago', () => {
  it('acepta una dirección y rechaza un campo de más', () => {
    const direccion = dtoCrearDireccion.parse({
      destinatario: ' Ana López ',
      linea: '4a avenida 10-20',
      ciudad: 'Guatemala',
      referencia: '',
    });
    assert.equal(direccion.destinatario, 'Ana López');
    assert.equal(direccion.referencia, null);
    assert.throws(() =>
      dtoCrearDireccion.parse({
        destinatario: 'Ana',
        linea: '4a avenida',
        ciudad: 'Guatemala',
        referencia: null,
        usuario: 1,
      }),
    );
  });

  it('exige una llave de idempotencia y un resultado de cobro', () => {
    const pago = dtoIniciarPago.parse({
      idDireccion: 1,
      idMetodoEnvio: 2,
      llave: ' pago-demo-01 ',
    });
    assert.equal(pago.llave, 'pago-demo-01');
    assert.throws(() => dtoIniciarPago.parse({ idDireccion: 1, idMetodoEnvio: 2, llave: 'corta' }));
    const cobro = dtoCobrar.parse({ llave: 'pago-demo-01', aprobado: true });
    assert.equal(cobro.aprobado, true);
    assert.throws(() => dtoCobrar.parse({ llave: 'pago-demo-01', aprobado: true, tarjeta: '4111' }));
  });
});
