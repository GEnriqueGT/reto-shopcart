import 'dotenv/config';
import { crearAplicacion, cerrarRecursos } from './aplicacion.js';
import { leerEntorno } from './configuracion/entorno.js';
import { asegurarUsuariosIniciales } from './modulos/autenticacion/aplicacion/autenticacion.servicio.js';

async function arrancar(): Promise<void> {
  await asegurarUsuariosIniciales();
  const app = crearAplicacion();
  const servidor = app.listen(leerEntorno().PUERTO_API, () => {
    console.log('API escuchando');
  });

  async function apagar(): Promise<void> {
    servidor.close();
    await cerrarRecursos();
    process.exit(0);
  }

  process.on('SIGTERM', () => {
    void apagar();
  });
  process.on('SIGINT', () => {
    void apagar();
  });
}

arrancar().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
