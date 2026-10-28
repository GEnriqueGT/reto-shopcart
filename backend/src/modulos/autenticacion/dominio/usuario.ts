export type UsuarioSesion = {
  idUsuario: number;
  idRol: number;
  correo: string;
  rol: string;
  activo: boolean;
};

export type Dueno = {
  tipo: 'usuario';
  idUsuario: number;
};
