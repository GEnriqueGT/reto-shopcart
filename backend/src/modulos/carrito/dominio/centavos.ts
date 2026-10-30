import { Decimal } from 'decimal.js';

const Moneda = Decimal.clone({ precision: 40, rounding: Decimal.ROUND_HALF_UP });

export function centavos(valor: string): string {
  return new Moneda(valor).toFixed(2);
}
