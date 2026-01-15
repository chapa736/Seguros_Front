# Sistema de Caché con Redis

## Descripción

Este proyecto implementa un sistema de caché multi-estrategia que soporta:
- **Memoria**: Caché en memoria (se pierde al recargar)
- **LocalStorage**: Caché persistente en el navegador
- **Redis**: Preparado para integración con Redis en el backend (futuro)

## Características

✅ Cacheo automático de respuestas GET  
✅ Invalidación automática en operaciones de escritura (POST, PUT, PATCH, DELETE)  
✅ TTL (Time To Live) configurable por tipo de endpoint  
✅ Limpieza automática de entradas expiradas  
✅ Logs para debugging  

## Uso Automático

El interceptor `cacheInterceptor` cachea automáticamente todas las peticiones GET:

```typescript
// Esta petición se cachea automáticamente
this.clienteService.getAll().subscribe(...);
```

### TTL por Tipo de Endpoint

- **Clientes**: 10 minutos
- **Pólizas**: 5 minutos
- **Datos de usuario/perfil**: 2 minutos
- **Otros**: 5 minutos (default)

## Uso Manual del CacheService

### Guardar en caché

```typescript
import { CacheService } from './core/services/cache.service';
import { CacheStrategy } from './core/models/cache.models';

constructor(private cacheService: CacheService) {}

// Guardar en memoria
this.cacheService.set('mi-clave', datos, {
  strategy: CacheStrategy.MEMORY,
  ttl: 5 * 60 * 1000 // 5 minutos
});

// Guardar en localStorage
this.cacheService.set('mi-clave', datos, {
  strategy: CacheStrategy.LOCAL_STORAGE,
  ttl: 10 * 60 * 1000 // 10 minutos
});
```

### Obtener del caché

```typescript
const datos = this.cacheService.get<MiTipo>('mi-clave', CacheStrategy.MEMORY);
if (datos) {
  // Usar datos del caché
} else {
  // Obtener del servidor
}
```

### Verificar si existe

```typescript
if (this.cacheService.has('mi-clave', CacheStrategy.LOCAL_STORAGE)) {
  // El dato existe y no ha expirado
}
```

### Invalidar caché

```typescript
// Invalidar una clave específica
this.cacheService.remove('mi-clave', CacheStrategy.LOCAL_STORAGE);

// Invalidar múltiples claves
this.cacheService.invalidate(['clave1', 'clave2'], CacheStrategy.MEMORY);

// Limpiar todo el caché
this.cacheService.clear(CacheStrategy.LOCAL_STORAGE);
```

## Invalidación Automática

Los servicios `ClienteService` y `PolizaService` invalidan automáticamente el caché cuando se realizan operaciones de escritura:

- `create()` → Invalida caché de clientes/pólizas
- `update()` → Invalida caché de clientes/pólizas
- `delete()` → Invalida caché de clientes/pólizas
- `cancelar()` → Invalida caché de pólizas

## Configuración

### Cambiar estrategia de caché

Edita `src/app/core/interceptors/cache.interceptor.ts`:

```typescript
// Cambiar de LOCAL_STORAGE a MEMORY
const cacheStrategy = CacheStrategy.MEMORY;
```

### Ajustar TTL por endpoint

Edita la función `getCacheTtl()` en `cache.interceptor.ts`:

```typescript
function getCacheTtl(url: string): number {
  if (url.includes('/mi-endpoint')) {
    return 15 * 60 * 1000; // 15 minutos
  }
  // ...
}
```

## Integración con Redis (Futuro)

Para integrar Redis en el backend:

1. El backend debe exponer endpoints para:
   - `GET /api/cache/{key}` - Obtener del caché
   - `POST /api/cache/{key}` - Guardar en caché
   - `DELETE /api/cache/{key}` - Eliminar del caché

2. Actualizar `CacheService` para usar estos endpoints cuando `strategy === CacheStrategy.REDIS`

3. El interceptor puede usar Redis para datos críticos y localStorage como fallback

## Debugging

Los logs del caché aparecen en la consola del navegador:

```
[Cache] Hit para: http://localhost:5002/api/clientes
[Cache] Miss para: http://localhost:5002/api/polizas, obteniendo del servidor...
[Cache] Guardado en caché: http://localhost:5002/api/polizas (TTL: 300000ms)
[Cache] Invalidado caché de clientes
```

## Mejores Prácticas

1. **No cachear datos sensibles**: El caché en localStorage es accesible, no guardes información sensible
2. **TTL apropiado**: Usa TTL cortos para datos que cambian frecuentemente
3. **Invalidación**: Siempre invalida el caché después de operaciones de escritura
4. **Monitoreo**: Revisa los logs para optimizar los TTL según el uso real

## Limitaciones Actuales

- Redis requiere implementación en el backend
- El caché es por dominio/navegador (no compartido entre usuarios)
- localStorage tiene límite de ~5-10MB dependiendo del navegador
