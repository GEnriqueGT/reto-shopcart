import 'dotenv/config';
import { crearAplicacion, cerrarRecursos } from './aplicacion.js';
import { leerEntorno } from './configuracion/entorno.js';

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
