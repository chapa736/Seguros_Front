export interface Cliente {
  id: number;
  numeroIdentificacion: string;
  nombre: string;
  apPaterno: string;
  apMaterno: string;
  telefono: string;
  email: string;
  direccion: string;
  fechaCreacion: string;
  fechaActualizacion?: string;
  nombreCompleto: string;
  userId: number;
}

export interface CreateClienteRequest {
  numeroIdentificacion: string;
  nombre: string;
  apPaterno: string;
  apMaterno: string;
  telefono: string;
  email: string;
  direccion: string;
  userId: number;
}

export interface UpdateClienteRequest {
  id: number;
  numeroIdentificacion: string;
  nombre?: string;
  apPaterno?: string;
  apMaterno?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
}

export interface UpdateMyInfoRequest {
  idCliente: number;
  direccion: string;
  telefono: string;
}

export enum TipoPoliza {
  Vida = 1,
  Automovil = 2,
  Hogar = 3,
  Salud = 4
}

export enum EstatusPoliza {
  Vigente = 1,
  Cancelada = 3
}

export interface Poliza {
  id: number;
  idCliente: number;
  tipoPoliza: TipoPoliza;
  fechaInicio: string;
  fechaFin: string;
  monto: number;
  estatus: EstatusPoliza;
  fechaCreacion: string;
  esVigente: boolean;
}

export interface CreatePolizaRequest {
  idCliente: number;
  tipoPoliza: TipoPoliza;
  fechaInicio: string;
  fechaFin: string;
  monto: number;
  estatus: EstatusPoliza;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  errors?: string[];
}
