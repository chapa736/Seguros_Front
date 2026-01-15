export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  roleId: number;
}

export interface LoginResponse {
  success: boolean;
  data: {
    accessToken: string;
    refreshToken: string;
    expiresAt: string;
    user: User;
  };
  message: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  status: number;
  fechaCreacion: string;
  roles: Role[];
}

export interface Role {
  id: number;
  nombre: string;
  descripcion: string;
  status: number;
}
