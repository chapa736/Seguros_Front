import { HttpInterceptorFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { of, tap } from 'rxjs';
import { CacheService } from '../services/cache.service';
import { CacheStrategy, CacheOptions } from '../models/cache.models';

/**
 * Interceptor que cachea automáticamente las respuestas GET
 * y sirve datos desde el caché cuando están disponibles
 */
export const cacheInterceptor: HttpInterceptorFn = (req, next) => {
  // Solo cachear peticiones GET
  if (req.method !== 'GET') {
    return next(req);
  }

  const cacheService = inject(CacheService);
  
  // Generar clave de caché incluyendo parámetros de query si existen
  let params: any = undefined;
  if (req.params && req.params.keys().length > 0) {
    params = {};
    req.params.keys().forEach(key => {
      params[key] = req.params.get(key);
    });
  }
  const cacheKey = cacheService.generateKey(req.url, params);

  // Estrategia de caché: usar localStorage para datos que queremos persistir
  // Puedes cambiar a CacheStrategy.MEMORY para caché solo en memoria
  const cacheStrategy = CacheStrategy.LOCAL_STORAGE;
  
  // TTL por defecto: 5 minutos
  // Puedes personalizar según el tipo de endpoint
  const defaultTtl = getCacheTtl(req.url);

  // Intentar obtener del caché
  const cachedData = cacheService.get(cacheKey, cacheStrategy);
  
  if (cachedData) {
    console.log(`[Cache] Hit para: ${req.url}`);
    // Retornar datos desde el caché como una respuesta HTTP
    return of(new HttpResponse({
      body: cachedData,
      status: 200,
      statusText: 'OK (from cache)',
      url: req.url
    }));
  }

  console.log(`[Cache] Miss para: ${req.url}, obteniendo del servidor...`);

  // Si no está en caché, hacer la petición y cachear la respuesta
  return next(req).pipe(
    tap(event => {
      if (event instanceof HttpResponse && event.status === 200) {
        const options: CacheOptions = {
          strategy: cacheStrategy,
          ttl: defaultTtl,
          key: cacheKey
        };
        
        cacheService.set(cacheKey, event.body, options);
        console.log(`[Cache] Guardado en caché: ${req.url} (TTL: ${defaultTtl}ms)`);
      }
    })
  );
};

/**
 * Determina el TTL según el tipo de endpoint
 */
function getCacheTtl(url: string): number {
  // Datos que cambian poco: 10 minutos
  if (url.includes('/clientes') && !url.includes('/UpdateMyInfo')) {
    return 10 * 60 * 1000; // 10 minutos
  }

  // Pólizas: 5 minutos (pueden cambiar más frecuentemente)
  if (url.includes('/Polizas') || url.includes('/polizas')) {
    return 5 * 60 * 1000; // 5 minutos
  }

  // Datos de usuario/perfil: 2 minutos (cambian más frecuentemente)
  if (url.includes('/User/') || url.includes('/mi-perfil') || url.includes('/mi-cliente')) {
    return 2 * 60 * 1000; // 2 minutos
  }

  // Por defecto: 5 minutos
  return 5 * 60 * 1000;
}
