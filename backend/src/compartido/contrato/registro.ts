import { extendZodWithOpenApi, OpenAPIRegistry, OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

export const registro = new OpenAPIRegistry();

registro.registerComponent('securitySchemes', 'acceso', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
});

export function documentoOpenApi() {
  return new OpenApiGeneratorV3(registro.definitions).generateDocument({
    openapi: '3.0.3',
    info: {
      title: 'ShopCart',
      version: '1.0.0',
      description: 'API de la tienda. Los montos van como texto con dos decimales.',
    },
  });
}
