export interface CacheConfig {
  ttl: number; // Time to live en milisegundos
  key: string;
  invalidateOn?: string[]; // Claves que invalidan este caché
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export enum CacheStrategy {
  MEMORY = 'memory', // Solo en memoria (se pierde al recargar)
  LOCAL_STORAGE = 'localStorage', // Persiste en localStorage
  REDIS = 'redis' // Usa Redis en backend (requiere endpoint)
}

export interface CacheOptions {
  strategy?: CacheStrategy;
  ttl?: number; // Tiempo de vida en milisegundos (default: 5 minutos)
  key?: string; // Clave personalizada (default: URL de la petición)
  invalidateOn?: string[]; // Claves que invalidan este caché
}
