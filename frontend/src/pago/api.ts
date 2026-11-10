import { pedirJson } from '../compartido/http/cliente';
import type { ConsultaPedido, Direccion, MetodoEnvio } from './tipos';
import type { DatosDireccion } from './esquema';

export const claveDirecciones = ['pago', 'direcciones'] as const;
export const claveEnvios = ['pago', 'envios'] as const;

export function listarEnvios() {
  return pedirJson<MetodoEnvio[]>('/pago/envios', { auth: false });
}

export function listarDirecciones() {
  return pedirJson<Direccion[]>('/pago/direcciones');
}

export function crearDireccion(datos: DatosDireccion) {
  return pedirJson<Direccion>('/pago/direcciones', { cuerpo: datos });
}

export function desactivarDireccion(idDireccion: number) {
  return pedirJson<void>(`/pago/direcciones/${idDireccion}/desactivar`, { metodo: 'POST' });
}

export function iniciarPago(cuerpo: {
  idDireccion?: number | null;
  idMetodoEnvio: number;
  llave: string;
}) {
  return pedirJson<ConsultaPedido>('/pago/iniciar', { cuerpo });
}

export function cobrarPago(cuerpo: { llave: string; aprobado: boolean }) {
  return pedirJson<ConsultaPedido>('/pago/cobrar', { cuerpo });
}

export function consultarPedido(idPedido: number) {
  return pedirJson<ConsultaPedido>(`/pago/pedidos/${idPedido}`);
}
