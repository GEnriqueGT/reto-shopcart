import { randomInt } from 'node:crypto';

export function esperaAleatoria(): Promise<void> {
  const milisegundos = randomInt(50, 151);
  return new Promise((resolver) => {
    setTimeout(resolver, milisegundos);
  });
}
