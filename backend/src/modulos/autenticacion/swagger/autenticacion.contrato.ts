import { z } from 'zod';
import { registro } from '../../../compartido/contrato/registro.js';
import { dtoIdUsuario, dtoPagina } from '../../../compartido/dto/comun.dto.js';
import { dtoRefresco, dtoRegistro } from '../presentacion/autenticacion.dto.js';

const error = z
  .object({
    codigo: z.string(),
    mensaje: z.string(),
  })
  .openapi('Error');

const usuario = z
  .object({
    idUsuario: z.number().int(),
    idRol: z.number().int(),
    correo: z.string(),
    rol: z.string(),
    activo: z.boolean(),
  })
  .openapi('Usuario');

const parTokens = z
  .object({
    acceso: z.string(),
    refresco: z.string(),
  })
  .openapi('ParTokens');

const paginaUsuarios = z
  .object({
    usuarios: z.array(usuario),
    total: z.number().int(),
  })
  .openapi('PaginaUsuarios');

const cuerpoRegistro = dtoRegistro.openapi('Registro');
const cuerpoRefresco = dtoRefresco.openapi('Refresco');
const consultaUsuarios = dtoPagina.openapi('ConsultaUsuarios');
const parametroUsuario = dtoIdUsuario.openapi('ParametroUsuario');

const acceso = [{ acceso: [] }];

registro.registerPath({
  method: 'post',
  path: '/autenticacion/registro',
  tags: ['Autenticación'],
  summary: 'Registrar un cliente',
  request: {
    body: { required: true, content: { 'application/json': { schema: cuerpoRegistro } } },
  },
  responses: {
    201: json(usuario, 'El cliente quedó registrado'),
    400: json(error, 'Los datos no cumplen el esquema'),
    409: json(error, 'El correo ya está registrado'),
    429: json(error, 'Demasiados intentos'),
  },
});

registro.registerPath({
  method: 'post',
  path: '/autenticacion/entrar',
  tags: ['Autenticación'],
  summary: 'Entrar con correo y contraseña',
  request: {
    body: { required: true, content: { 'application/json': { schema: cuerpoRegistro } } },
  },
  responses: {
    200: json(parTokens, 'Access y refresh token'),
    400: json(error, 'Los datos no cumplen el esquema'),
    401: json(error, 'El correo o la contraseña no son válidos'),
    429: json(error, 'Demasiados intentos'),
  },
});

registro.registerPath({
  method: 'post',
  path: '/autenticacion/refrescar',
  tags: ['Autenticación'],
  summary: 'Rotar el refresh token',
  request: {
    body: { required: true, content: { 'application/json': { schema: cuerpoRefresco } } },
  },
  responses: {
    200: json(parTokens, 'El par vigente, nuevo o de la ventana de gracia'),
    400: json(error, 'Los datos no cumplen el esquema'),
    401: json(error, 'La sesión no es válida'),
    429: json(error, 'Demasiados intentos'),
  },
});

registro.registerPath({
  method: 'post',
  path: '/autenticacion/salir',
  tags: ['Autenticación'],
  summary: 'Cerrar la sesión y anular el access token',
  security: acceso,
  responses: {
    204: { description: 'La sesión quedó cerrada' },
    401: json(error, 'No hay una sesión válida'),
  },
});

registro.registerPath({
  method: 'get',
  path: '/autenticacion/yo',
  tags: ['Autenticación'],
  summary: 'Ver el usuario de la sesión',
  security: acceso,
  responses: {
    200: json(usuario, 'El dueño de la sesión'),
    401: json(error, 'No hay una sesión válida'),
  },
});

registro.registerPath({
  method: 'get',
  path: '/autenticacion/usuarios',
  tags: ['Autenticación'],
  summary: 'Listar usuarios',
  security: acceso,
  request: { query: consultaUsuarios },
  responses: {
    200: json(paginaUsuarios, 'Página de usuarios'),
    401: json(error, 'No hay una sesión válida'),
    403: json(error, 'El rol no alcanza'),
  },
});

registro.registerPath({
  method: 'post',
  path: '/autenticacion/usuarios/{idUsuario}/desactivar',
  tags: ['Autenticación'],
  summary: 'Desactivar un usuario sin borrarlo',
  security: acceso,
  request: { params: parametroUsuario },
  responses: {
    204: { description: 'La cuenta quedó inactiva' },
    401: json(error, 'No hay una sesión válida'),
    403: json(error, 'El rol no alcanza'),
    404: json(error, 'El usuario no existe'),
  },
});

function json(schema: z.ZodType, description: string) {
  return { description, content: { 'application/json': { schema } } };
}
