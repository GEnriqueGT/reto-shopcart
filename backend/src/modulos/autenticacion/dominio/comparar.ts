import { createHash, timingSafeEqual } from 'node:crypto';

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function iguales(izquierdo: string, derecho: string): boolean {
  const a = Buffer.from(izquierdo);
  const b = Buffer.from(derecho);
  if (a.length !== b.length) {
    return false;
  }
  return timingSafeEqual(a, b);
}
