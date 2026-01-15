# Seguros_Front

FrontEnd Angular del sistema de seguros — aplicación SPA desarrollada con Angular 19, TypeScript y NGXS para manejo de estado. El proyecto incluye configuración para desarrollo local y un flujo de producción mediante Docker + Nginx.

## Contenido rápido
- Stack: Angular 19, TypeScript, NGXS, RxJS
- Scripts disponibles: start, build, watch, test
- Docker: imagen multi-stage y docker-compose para levantar el servicio en puerto 8080 (mapeado a 80)
- Archivos de interés:
  - Dockerfile, docker-compose.yml, nginx.conf
  - src/environments/environment.ts  (dev)
  - src/environments/environment.prod.ts (prod)
  - IMPLEMENTACION.md (guía interna de implementación y comandos)

## Requisitos
- Node.js 18+ / 20+ (el Dockerfile usa node:20-alpine)
- npm 8+
- Angular CLI (opcional para desarrollo local): npm i -g @angular/cli
- Docker & docker-compose (si vas a usar contenedores)

## Instalación (local)
Clonar y preparar dependencias:
```bash
git clone https://github.com/chapa736/Seguros_Front.git
cd Seguros_Front

# Instalar dependencias (recomendado)
npm ci
```

Nota: si encuentras conflictos con peer deps (NGXS 21 vs Angular 19), el Dockerfile usa `npm ci --legacy-peer-deps`. Para reproducir localmente:
```bash
npm ci --legacy-peer-deps
```

## Desarrollo (servidor local)
Levantar servidor de desarrollo (hot-reload):
```bash
npm start
# o con puerto explícito
ng serve --port 4200
```
- La aplicación carga las variables en `src/environments/environment.ts`.
- Si necesitas reconducir llamadas API durante desarrollo (proxy), revisa `proxy.conf.json` (vacío en este repo). Puedes crear uno y arrancar con:
```bash
ng serve --proxy-config proxy.conf.json
```

## Build de producción
Genera los artefactos para producción:
```bash
npm run build
# o
ng build --configuration production
```
Salida por defecto: `dist/Seguros_Front/` (el Dockerfile copia desde `/app/dist/Seguros_Front/browser` en la etapa multi-stage).

## Ejecutar con Docker (producción)
Construye la imagen y levanta el contenedor (usa el Dockerfile incluido):
```bash
# build y run (imagen local)
docker build -t seguros-front:latest .
docker run -p 8080:80 --name seguros-frontend --rm seguros-front:latest

# ó con docker-compose (recomendado)
docker-compose up --build
# abre http://localhost:8080
```

¿Qué hace el Dockerfile?
- Etapa build: usa node:20-alpine, instala dependencias (con --legacy-peer-deps), construye la app.
- Etapa final: usa nginx:alpine y copia los archivos estáticos al `usr/share/nginx/html`.
- Usa `nginx.conf` que:
  - Sirve SPA con try_files /index.html
  - Habilita cache para archivos estáticos (1 año, immutable)
  - Habilita gzip y agrega headers de seguridad (X-Frame-Options, X-Content-Type-Options, X-XSS-Protection)

## Configuración de entornos
- Dev: `src/environments/environment.ts`
  - authApiUrl: http://localhost:5001/api
  - segurosApiUrl: http://localhost:5002/api
- Prod: `src/environments/environment.prod.ts`
  - Mantener URLs accesibles desde navegador (usar IP/host público si corresponde).
  
Modificar estos archivos ajusta dónde hará las peticiones la app desde el navegador.

## APIs y endpoints esperados
La app espera dos microservicios (URLs por defecto en IMPLEMENTACION.md y en environments):
- Auth API: http://localhost:5001/api
  - POST /auth/login
  - POST /auth/register
  - POST /auth/logout
  - POST /auth/refresh
- Seguros API: http://localhost:5002/api
  - /Polizas (vigentes, por cliente, por tipo, cancelar, etc.)
  - /clientes (GET, POST, PUT, DELETE)

Revisa los servicios en `src/app/core/services/` (ej. auth.service.ts, poliza.service.ts, cliente.service.ts) para los detalles de rutas usadas.

## Autenticación y seguridad
- Token JWT se almacena en localStorage (key: token) al iniciar sesión.
- Hay un interceptor que añade Authorization: Bearer <token> a las peticiones HTTP.
- Logout elimina token y refreshToken de localStorage.
- Ten en cuenta:
  - El método logout en auth.service usa JSON.stringify para enviar el refresh token (el backend espera un string en body).
  - La política de CORS y la accesibilidad de los hosts de API deben estar correctamente configuradas en los microservicios.

## Routing y permisos (resumen)
- Rutas principales definidas en `src/app/app.routes.ts`:
  - /login, /register
  - /admin/* (requiere role ADMINISTRADOR y AuthGuard)
    - dashboard, clientes, polizas, formularios CRUD
  - /cliente/* (requiere role CLIENTE y AuthGuard)
    - dashboard, mis-polizas, perfil
- Los guards revisan el estado NGXS para validar autenticación y roles.

## Cache y eventos (polizas)
- `PolizaService` invalida caches (memory y local storage) tras crear/editar/eliminar/cancelar pólizas y notifica cambios via PolizaEventsService.
- Nginx añade headers de cache para assets estáticos; para datos dinámicos la app usa estrategias de cache propias.

## Pruebas
Se incluye configuración de Karma/Jasmine:
```bash
npm test
```
## Recursos internos
- IMPLEMENTACION.md: contiene comandos y ejemplos prácticos adicionales (generación de componentes, estructura NGXS, ejemplos de services, interceptors, guards, app.config y rutas). Revisa este documento si necesitas más detalles de implementación o ejemplos de código.
