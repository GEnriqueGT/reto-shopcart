export type Usuario = {
  IDUsuario: number;
  IDRol: number;
  Correo: string;
  Rol: string;
  Activo: boolean;
};

export type ParTokens = {
  acceso: string;
  refresco: string;
};
