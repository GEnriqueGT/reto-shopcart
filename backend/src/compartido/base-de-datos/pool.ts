import sql from 'mssql';
import { leerEntorno } from '../../configuracion/entorno.js';

let pool: sql.ConnectionPool | undefined;

export async function obtenerPool(): Promise<sql.ConnectionPool> {
  if (pool?.connected) {
    return pool;
  }
  const entorno = leerEntorno();
  pool = await new sql.ConnectionPool({
    server: entorno.SQL_SERVIDOR,
    port: entorno.SQL_PUERTO,
    database: entorno.SQL_BASE,
    user: entorno.SQL_USUARIO_APP,
    password: entorno.SQL_CONTRASENA_APP,
    options: {
      encrypt: true,
      trustServerCertificate: true,
      enableArithAbort: true,
    },
    pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
  }).connect();
  return pool;
}

export async function cerrarPool(): Promise<void> {
  if (!pool) {
    return;
  }
  await pool.close();
  pool = undefined;
}
