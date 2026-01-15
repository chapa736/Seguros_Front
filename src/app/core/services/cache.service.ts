import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CacheEntry, CacheOptions, CacheStrategy } from '../models/cache.models';

@Injectable({
  providedIn: 'root'
})
export class CacheService {
  private memoryCache = new Map<string, CacheEntry<any>>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutos por defecto
  private readonly CACHE_PREFIX = 'zurich_cache_';

  /**
   * Obtiene datos del caché
   */
  get<T>(key: string, strategy: CacheStrategy = CacheStrategy.MEMORY): T | null {
    const fullKey = this.getFullKey(key);

    switch (strategy) {
      case CacheStrategy.MEMORY:
        return this.getFromMemory<T>(fullKey);
      
      case CacheStrategy.LOCAL_STORAGE:
        return this.getFromLocalStorage<T>(fullKey);
      
      case CacheStrategy.REDIS:
        // Redis se maneja en el backend, aquí retornamos null
        // El interceptor HTTP se encargará de hacer la petición
        return null;
      
      default:
        return null;
    }
  }

  /**
   * Guarda datos en el caché
   */
  set<T>(key: string, data: T, options: CacheOptions = {}): void {
    const fullKey = this.getFullKey(key);
    const ttl = options.ttl || this.DEFAULT_TTL;
    const strategy = options.strategy || CacheStrategy.MEMORY;

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl
    };

    switch (strategy) {
      case CacheStrategy.MEMORY:
        this.setInMemory(fullKey, entry);
        break;
      
      case CacheStrategy.LOCAL_STORAGE:
        this.setInLocalStorage(fullKey, entry);
        break;
      
      case CacheStrategy.REDIS:
        // Redis se maneja en el backend
        // Por ahora, también guardamos en memoria como fallback
        this.setInMemory(fullKey, entry);
        break;
    }
  }

  /**
   * Elimina una entrada del caché
   */
  remove(key: string, strategy: CacheStrategy = CacheStrategy.MEMORY): void {
    const fullKey = this.getFullKey(key);

    switch (strategy) {
      case CacheStrategy.MEMORY:
        this.memoryCache.delete(fullKey);
        break;
      
      case CacheStrategy.LOCAL_STORAGE:
        localStorage.removeItem(fullKey);
        break;
      
      case CacheStrategy.REDIS:
        // Redis se maneja en el backend
        this.memoryCache.delete(fullKey);
        localStorage.removeItem(fullKey);
        break;
    }
  }

  /**
   * Invalida múltiples claves (útil para invalidar en cascada)
   */
  invalidate(keys: string[], strategy: CacheStrategy = CacheStrategy.MEMORY): void {
    keys.forEach(key => this.remove(key, strategy));
  }

  /**
   * Limpia todo el caché
   */
  clear(strategy: CacheStrategy = CacheStrategy.MEMORY): void {
    switch (strategy) {
      case CacheStrategy.MEMORY:
        this.memoryCache.clear();
        break;
      
      case CacheStrategy.LOCAL_STORAGE:
        // Eliminar solo las claves que empiezan con nuestro prefijo
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(this.CACHE_PREFIX)) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        break;
      
      case CacheStrategy.REDIS:
        this.memoryCache.clear();
        // Limpiar localStorage también
        this.clear(CacheStrategy.LOCAL_STORAGE);
        break;
    }
  }

  /**
   * Verifica si una clave existe y no ha expirado
   */
  has(key: string, strategy: CacheStrategy = CacheStrategy.MEMORY): boolean {
    const fullKey = this.getFullKey(key);
    const entry = this.getEntry(fullKey, strategy);
    
    if (!entry) {
      return false;
    }

    // Verificar si ha expirado
    const now = Date.now();
    const isExpired = (now - entry.timestamp) > entry.ttl;

    if (isExpired) {
      this.remove(key, strategy);
      return false;
    }

    return true;
  }

  /**
   * Obtiene datos del caché en memoria
   */
  private getFromMemory<T>(key: string): T | null {
    const entry = this.memoryCache.get(key);
    if (!entry) {
      return null;
    }

    // Verificar expiración
    const now = Date.now();
    if ((now - entry.timestamp) > entry.ttl) {
      this.memoryCache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Obtiene datos del localStorage
   */
  private getFromLocalStorage<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      if (!item) {
        return null;
      }

      const entry: CacheEntry<T> = JSON.parse(item);
      
      // Verificar expiración
      const now = Date.now();
      if ((now - entry.timestamp) > entry.ttl) {
        localStorage.removeItem(key);
        return null;
      }

      return entry.data;
    } catch (error) {
      console.error('Error al leer del localStorage:', error);
      return null;
    }
  }

  /**
   * Guarda datos en memoria
   */
  private setInMemory<T>(key: string, entry: CacheEntry<T>): void {
    this.memoryCache.set(key, entry);
  }

  /**
   * Guarda datos en localStorage
   */
  private setInLocalStorage<T>(key: string, entry: CacheEntry<T>): void {
    try {
      localStorage.setItem(key, JSON.stringify(entry));
    } catch (error) {
      console.error('Error al guardar en localStorage:', error);
      // Si localStorage está lleno, limpiar entradas antiguas
      this.cleanExpiredEntries();
      try {
        localStorage.setItem(key, JSON.stringify(entry));
      } catch (retryError) {
        console.error('Error persistente al guardar en localStorage:', retryError);
      }
    }
  }

  /**
   * Obtiene una entrada del caché (sin verificar expiración)
   */
  private getEntry<T>(key: string, strategy: CacheStrategy): CacheEntry<T> | null {
    switch (strategy) {
      case CacheStrategy.MEMORY:
        return this.memoryCache.get(key) || null;
      
      case CacheStrategy.LOCAL_STORAGE:
        try {
          const item = localStorage.getItem(key);
          return item ? JSON.parse(item) : null;
        } catch {
          return null;
        }
      
      default:
        return null;
    }
  }

  /**
   * Limpia entradas expiradas del localStorage
   */
  private cleanExpiredEntries(): void {
    const now = Date.now();
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.CACHE_PREFIX)) {
        try {
          const entry: CacheEntry<any> = JSON.parse(localStorage.getItem(key) || '{}');
          if ((now - entry.timestamp) > entry.ttl) {
            keysToRemove.push(key);
          }
        } catch {
          keysToRemove.push(key);
        }
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));
  }

  /**
   * Genera la clave completa con prefijo
   */
  private getFullKey(key: string): string {
    return `${this.CACHE_PREFIX}${key}`;
  }

  /**
   * Genera una clave de caché a partir de una URL y parámetros
   */
  generateKey(url: string, params?: any): string {
    let key = url;
    if (params) {
      const sortedParams = Object.keys(params)
        .sort()
        .map(k => `${k}=${JSON.stringify(params[k])}`)
        .join('&');
      key = `${url}?${sortedParams}`;
    }
    // Reemplazar caracteres especiales para usar como clave
    return key.replace(/[^a-zA-Z0-9]/g, '_');
  }

  /**
   * Invalida todas las claves que contengan el patrón especificado
   */
  invalidateByPattern(pattern: string, strategy: CacheStrategy = CacheStrategy.LOCAL_STORAGE): void {
    const normalizedPattern = pattern.replace(/[^a-zA-Z0-9]/g, '_');
    
    switch (strategy) {
      case CacheStrategy.MEMORY:
        const memoryKeysToRemove: string[] = [];
        this.memoryCache.forEach((value, key) => {
          if (key.includes(normalizedPattern)) {
            memoryKeysToRemove.push(key);
          }
        });
        memoryKeysToRemove.forEach(key => this.memoryCache.delete(key));
        break;
      
      case CacheStrategy.LOCAL_STORAGE:
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(this.CACHE_PREFIX) && key.includes(normalizedPattern)) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        break;
      
      case CacheStrategy.REDIS:
        // Implementación futura
        break;
    }
    
    console.log(`[Cache] Invalidadas claves con patrón: ${pattern}`);
  }
}
