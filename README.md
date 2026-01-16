# Documento Técnico - Frontend Seguros_Front

**Versión:** 1.0  
**Fecha:** Enero 2026  
**Autor:** Proyecto Microservicios  
**Framework:** Angular 19.2.0

---

## Tabla de Contenidos

1. [Descripción General](#1-descripción-general)
2. [Arquitectura del Sistema](#2-arquitectura-del-sistema)
3. [Tecnologías Utilizadas](#3-tecnologías-utilizadas)
4. [Estructura del Proyecto](#4-estructura-del-proyecto)
5. [Configuración y Ambientes](#5-configuración-y-ambientes)
6. [Routing y Navegación](#6-routing-y-navegación)
7. [Gestión de Estado (NGXS)](#7-gestión-de-estado-ngxs)
8. [Servicios y APIs](#8-servicios-y-apis)
9. [Interceptores HTTP](#9-interceptores-http)
10. [Guards y Protección de Rutas](#10-guards-y-protección-de-rutas)
11. [Componentes Principales](#11-componentes-principales)
12. [Modelos de Datos](#12-modelos-de-datos)
13. [Cache y Performance](#13-cache-y-performance)
14. [Docker y Deployment](#14-docker-y-deployment)
15. [Integración con Backend](#15-integración-con-backend)

---

## 1. Descripción General

### 1.1. Visión General

**Seguros_Front** es una aplicación web frontend desarrollada con **Angular 19.2.0** para gestionar clientes y pólizas de seguros. La aplicación consume los microservicios **Auth API** y **Seguros API** desarrollados en .NET 8.0.

### 1.2. Características Principales

- **SPA (Single Page Application)**: Aplicación de una sola página con routing
- **Standalone Components**: Componentes independientes sin NgModules
- **Lazy Loading**: Carga diferida de componentes para optimizar el bundle
- **Gestión de Estado**: NGXS para estado global reactivo
- **Cache Inteligente**: Sistema de cache con localStorage y memoria
- **Autenticación JWT**: Manejo automático de tokens y refresh
- **Roles y Permisos**: Protección de rutas según roles (ADMINISTRADOR, CLIENTE)

### 1.3. Funcionalidades

- **Autenticación**: Login y registro de usuarios
- **Gestión de Clientes**: CRUD completo (solo ADMINISTRADOR)
- **Gestión de Pólizas**: Crear, consultar y cancelar pólizas
- **Dashboard**: Vistas diferenciadas por rol
- **Perfil de Usuario**: Actualización de información personal (CLIENTE)

### 1.4. Roles del Sistema

- **ADMINISTRADOR**: Acceso completo a todas las funcionalidades
- **CLIENTE**: Acceso limitado a su propia información y pólizas

---

## 2. Arquitectura del Sistema

### 2.1. Arquitectura General

```
┌─────────────────────────────────────────────────────────────┐
│                   Usuario/Browser                            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              Seguros_Front (Angular 19.2)                    │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Components   │  │   Services   │  │    NGXS      │      │
│  │ (Standalone) │  │              │  │    Store     │      │
│  │              │  │ - Auth       │  │              │      │
│  │ - Auth       │  │ - Clientes   │  │ - AuthState  │      │
│  │ - Admin      │  │ - Polizas    │  │ - ClientesSt │      │
│  │ - Cliente    │  │ - Cache      │  │ - PolizasSt  │      │
│  │ - Shared     │  │              │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Interceptors │  │   Guards     │  │   Routing    │      │
│  │              │  │              │  │              │      │
│  │ - Auth       │  │ - AuthGuard  │  │ - Lazy Load  │      │
│  │ - Error      │  │ - RoleGuard  │  │ - Protected  │      │
│  │ - Cache      │  │              │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ HTTP/REST API
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
┌──────────────┐        ┌──────────────┐
│   Auth API   │        │ Seguros API  │
│  .NET 8.0    │        │  .NET 8.0    │
└──────────────┘        └──────────────┘
```

### 2.2. Flujo de Datos

```
Component → Action (NGXS) → Service → HTTP Client
                                        ↓
                              Interceptors (Cache, Auth, Error)
                                        ↓
                              Backend API
                                        ↓
                              Response → Service → NGXS Store
                                        ↓
                              Selectors → Component (UI Update)
```

### 2.3. Patrones Implementados

- **Service Pattern**: Servicios para comunicación con APIs
- **State Management (NGXS)**: Gestión de estado global reactivo
- **Interceptor Pattern**: Interceptores HTTP para cache, auth y errores
- **Guard Pattern**: Guards para protección de rutas
- **Lazy Loading**: Carga diferida de componentes
- **Singleton Pattern**: Servicios como singletons
- **Observer Pattern**: Programación reactiva con Observables (RxJS)

---

## 3. Tecnologías Utilizadas

### 3.1. Framework Principal

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **Angular** | 19.2.0 | Framework frontend completo |
| **TypeScript** | 5.7.2 | Lenguaje de programación |
| **RxJS** | 7.8.0 | Programación reactiva |
| **Zone.js** | 0.15.0 | Detección de cambios |

### 3.2. Gestión de Estado

| Paquete | Versión | Propósito |
|---------|---------|-----------|
| `@ngxs/store` | 21.0.0 | Store para gestión de estado |
| `@ngxs/devtools-plugin` | 21.0.0 | DevTools para debugging |
| `@ngxs/logger-plugin` | 21.0.0 | Logger para acciones NGXS |

### 3.3. Build y Herramientas

| Paquete | Versión | Propósito |
|---------|---------|-----------|
| `@angular/cli` | 19.2.12 | CLI de Angular |
| `@angular-devkit/build-angular` | 19.2.12 | Build tool |
| `typescript` | 5.7.2 | Compilador TypeScript |
| `webpack` | (incluido) | Bundler |
| `karma` | 6.4.0 | Test runner |
| `jasmine-core` | 5.6.0 | Framework de testing |

### 3.4. Dependencias Principales

| Paquete | Versión | Propósito |
|---------|---------|-----------|
| `@angular/core` | 19.2.0 | Core de Angular |
| `@angular/common` | 19.2.0 | Utilidades comunes |
| `@angular/router` | 19.2.0 | Routing y navegación |
| `@angular/forms` | 19.2.0 | Formularios reactivos |
| `@angular/platform-browser` | 19.2.0 | Plataforma browser |
| `@angular/animations` | 19.2.0 | Animaciones |

### 3.5. Infraestructura

| Tecnología | Versión/Descripción | Uso |
|------------|---------------------|-----|
| **Docker** | Latest | Containerización |
| **Nginx** | Alpine | Servidor web para producción |
| **Node.js** | 20-alpine | Entorno de ejecución para build |

---

## 4. Estructura del Proyecto

### 4.1. Estructura Completa

```
Seguros_Front/
├── src/
│   ├── app/
│   │   ├── core/
│   │   │   ├── guards/
│   │   │   │   ├── auth.guard.ts
│   │   │   │   └── role.guard.ts
│   │   │   ├── interceptors/
│   │   │   │   ├── auth.interceptor.ts
│   │   │   │   ├── cache.interceptor.ts
│   │   │   │   └── error.interceptor.ts
│   │   │   ├── models/
│   │   │   │   ├── auth.models.ts
│   │   │   │   ├── cache.models.ts
│   │   │   │   └── seguros.models.ts
│   │   │   └── services/
│   │   │       ├── auth.service.ts
│   │   │       ├── cache.service.ts
│   │   │       ├── cliente.service.ts
│   │   │       ├── poliza-events.service.ts
│   │   │       └── poliza.service.ts
│   │   │
│   │   ├── features/
│   │   │   ├── admin/
│   │   │   │   ├── cliente-form/
│   │   │   │   │   ├── cliente-form.component.ts
│   │   │   │   │   ├── cliente-form.component.html
│   │   │   │   │   └── cliente-form.component.scss
│   │   │   │   ├── clientes-list/
│   │   │   │   │   └── ...
│   │   │   │   ├── dashboard/
│   │   │   │   │   └── ...
│   │   │   │   ├── poliza-form/
│   │   │   │   │   └── ...
│   │   │   │   └── polizas-list/
│   │   │   │       └── ...
│   │   │   │
│   │   │   ├── auth/
│   │   │   │   ├── login/
│   │   │   │   │   └── ...
│   │   │   │   └── register/
│   │   │   │       └── ...
│   │   │   │
│   │   │   └── cliente/
│   │   │       ├── dashboard/
│   │   │       │   └── ...
│   │   │       ├── mis-polizas/
│   │   │       │   └── ...
│   │   │       └── perfil/
│   │   │           └── ...
│   │   │
│   │   ├── shared/
│   │   │   └── components/
│   │   │       ├── app-shell/
│   │   │       │   └── ...
│   │   │       ├── date-input/
│   │   │       │   └── ...
│   │   │       ├── left-sidebar/
│   │   │       │   └── ...
│   │   │       ├── loading/
│   │   │       │   └── ...
│   │   │       └── navbar/
│   │   │           └── ...
│   │   │
│   │   ├── store/
│   │   │   ├── auth.state.ts
│   │   │   ├── clientes.state.ts
│   │   │   └── polizas.state.ts
│   │   │
│   │   ├── app.component.ts
│   │   ├── app.component.html
│   │   ├── app.component.scss
│   │   ├── app.config.ts
│   │   └── app.routes.ts
│   │
│   ├── assets/
│   │   └── img/
│   │       └── Zurich_Logo.png
│   │
│   ├── environments/
│   │   ├── environment.ts
│   │   └── environment.prod.ts
│   │
│   ├── index.html
│   ├── main.ts
│   └── styles.scss
│
├── public/
│   └── favicon.ico
│
├── .angular/
├── .vscode/
│   ├── extensions.json
│   ├── launch.json
│   └── tasks.json
│
├── .dockerignore
├── .editorconfig
├── .gitignore
├── angular.json
├── Dockerfile
├── docker-compose.yml
├── nginx.conf
├── package.json
├── package-lock.json
├── proxy.conf.json
├── tsconfig.json
├── tsconfig.app.json
└── tsconfig.spec.json
```

### 4.2. Explicación de Carpetas

#### 4.2.1. `/src/app/core`
**Propósito**: Funcionalidad central y servicios compartidos

- **guards/**: Guards de rutas (autenticación, roles)
- **interceptors/**: Interceptores HTTP (auth, cache, error)
- **models/**: Modelos de datos TypeScript
- **services/**: Servicios core (auth, cliente, poliza, cache)

#### 4.2.2. `/src/app/features`
**Propósito**: Módulos de funcionalidad organizados por feature

- **admin/**: Funcionalidades para ADMINISTRADOR
  - `clientes-list`, `cliente-form`: Gestión de clientes
  - `polizas-list`, `poliza-form`: Gestión de pólizas
  - `dashboard`: Dashboard administrativo
- **auth/**: Autenticación y autorización
  - `login`: Componente de login
  - `register`: Componente de registro
- **cliente/**: Funcionalidades para CLIENTE
  - `dashboard`: Dashboard del cliente
  - `mis-polizas`: Lista de pólizas del cliente
  - `perfil`: Perfil y actualización de datos

#### 4.2.3. `/src/app/shared`
**Propósito**: Componentes, directivas y pipes reutilizables

- **components/**:
  - `app-shell`: Layout principal de la aplicación
  - `left-sidebar`: Barra lateral de navegación
  - `navbar`: Barra de navegación superior
  - `loading`: Indicador de carga
  - `date-input`: Input personalizado para fechas

#### 4.2.4. `/src/app/store`
**Propósito**: Estados globales con NGXS

- `auth.state.ts`: Estado de autenticación
- `clientes.state.ts`: Estado de clientes
- `polizas.state.ts`: Estado de pólizas

#### 4.2.5. `/src/environments`
**Propósito**: Configuración por entorno

- `environment.ts`: Desarrollo (localhost)
- `environment.prod.ts`: Producción

---

## 5. Configuración y Ambientes

### 5.1. Environment - Desarrollo

**Archivo**: `src/environments/environment.ts`

```typescript
export const environment = {
  production: false,
  authApiUrl: 'http://localhost:5001/api',
  segurosApiUrl: 'http://localhost:5002/api'
};
```

**Características:**
- URLs apuntan a `localhost`
- Puertos 5001 (Auth API) y 5002 (Seguros API)
- Source maps habilitados
- Optimización deshabilitada

### 5.2. Environment - Producción

**Archivo**: `src/environments/environment.prod.ts`

```typescript
export const environment = {
  production: true,
  // IMPORTANTE: El frontend Angular se ejecuta en el navegador del usuario,
  // por lo que las peticiones HTTP salen desde el navegador, NO desde el contenedor Docker.
  // Por eso usamos localhost o la IP del servidor, NO los nombres de contenedores.
  
  // Para desarrollo local o cuando todo está en la misma máquina:
  authApiUrl: 'http://localhost:5001/api',      // Contenedor: auth-api (puerto 5001:80)
  segurosApiUrl: 'http://localhost:5002/api',   // Contenedor: seguros-api (puerto 5002:80)
};
```

**Nota**: En producción real, estas URLs deberían apuntar a los dominios públicos de las APIs en Azure.

**Características:**
- URLs configuradas para producción
- Optimización habilitada (minificación, tree-shaking)
- Source maps deshabilitados (opcional)

### 5.3. app.config.ts

**Archivo**: `src/app/app.config.ts`

**Configuración Principal:**

```typescript
import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { NgxsModule } from '@ngxs/store';
import { NgxsLoggerPluginModule } from '@ngxs/logger-plugin';
import { NgxsReduxDevtoolsPluginModule } from '@ngxs/devtools-plugin';
import { AuthState } from './store/auth.state';
import { ClientesState } from './store/clientes.state';
import { PolizasState } from './store/polizas.state';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { cacheInterceptor } from './core/interceptors/cache.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([cacheInterceptor, authInterceptor, errorInterceptor])),
    provideAnimations(),
    importProvidersFrom(
      NgxsModule.forRoot([AuthState, ClientesState, PolizasState]),
      NgxsLoggerPluginModule.forRoot(),
      NgxsReduxDevtoolsPluginModule.forRoot()
    )
  ]
};
```

**Configuración:**
- **Routing**: Rutas con lazy loading
- **HTTP Client**: Con interceptores (cache, auth, error)
- **Animations**: Animaciones habilitadas
- **NGXS Store**: Estados globales configurados
- **DevTools**: Logger y Redux DevTools habilitados

### 5.4. TypeScript Configuration

**Archivo**: `tsconfig.json`

```json
{
  "compileOnSave": false,
  "compilerOptions": {
    "outDir": "./dist/out-tsc",
    "strict": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "experimentalDecorators": true,
    "moduleResolution": "bundler",
    "importHelpers": true,
    "target": "ES2022",
    "module": "ES2022"
  },
  "angularCompilerOptions": {
    "enableI18nLegacyMessageIdFormat": false,
    "strictInjectionParameters": true,
    "strictInputAccessModifiers": true,
    "strictTemplates": true
  }
}
```

**Características:**
- **Strict Mode**: Habilitado para mayor seguridad
- **Target**: ES2022
- **Module Resolution**: Bundler (para Angular 17+)
- **Experimental Decorators**: Habilitado para decoradores Angular

---

## 6. Routing y Navegación

### 6.1. Configuración de Rutas

**Archivo**: `src/app/app.routes.ts`

```typescript
import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { AppShellComponent } from './shared/components/app-shell/app-shell.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { 
    path: 'login', 
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  { 
    path: 'register', 
    loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard],
    data: { role: 'ADMINISTRADOR' },
    component: AppShellComponent,
    children: [
      { 
        path: 'dashboard', 
        loadComponent: () => import('./features/admin/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      { 
        path: 'clientes', 
        loadComponent: () => import('./features/admin/clientes-list/clientes-list.component').then(m => m.ClientesListComponent)
      },
      { 
        path: 'clientes/registrar', 
        loadComponent: () => import('./features/admin/cliente-form/cliente-form.component').then(m => m.ClienteFormComponent)
      },
      { 
        path: 'polizas', 
        loadComponent: () => import('./features/admin/polizas-list/polizas-list.component').then(m => m.PolizasListComponent)
      },
      { 
        path: 'polizas/crear', 
        loadComponent: () => import('./features/admin/poliza-form/poliza-form.component').then(m => m.PolizaFormComponent)
      }
    ]
  },
  {
    path: 'cliente',
    canActivate: [authGuard, roleGuard],
    data: { role: 'CLIENTE' },
    component: AppShellComponent,
    children: [
      { 
        path: 'dashboard', 
        loadComponent: () => import('./features/cliente/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      { 
        path: 'mis-polizas', 
        loadComponent: () => import('./features/cliente/mis-polizas/mis-polizas.component').then(m => m.MisPolizasComponent)
      },
      { 
        path: 'perfil', 
        loadComponent: () => import('./features/cliente/perfil/perfil.component').then(m => m.PerfilComponent)
      }
    ]
  }
];
```

### 6.2. Rutas Públicas

| Ruta | Componente | Descripción |
|------|------------|-------------|
| `/` | Redirect a `/login` | Ruta por defecto |
| `/login` | LoginComponent | Formulario de login |
| `/register` | RegisterComponent | Formulario de registro |

### 6.3. Rutas Protegidas - ADMINISTRADOR

| Ruta | Componente | Guard | Descripción |
|------|------------|-------|-------------|
| `/admin/dashboard` | DashboardComponent | authGuard, roleGuard | Dashboard administrativo |
| `/admin/clientes` | ClientesListComponent | authGuard, roleGuard | Lista de clientes |
| `/admin/clientes/registrar` | ClienteFormComponent | authGuard, roleGuard | Formulario de nuevo cliente |
| `/admin/polizas` | PolizasListComponent | authGuard, roleGuard | Lista de pólizas |
| `/admin/polizas/crear` | PolizaFormComponent | authGuard, roleGuard | Formulario de nueva póliza |

### 6.4. Rutas Protegidas - CLIENTE

| Ruta | Componente | Guard | Descripción |
|------|------------|-------|-------------|
| `/cliente/dashboard` | DashboardComponent | authGuard, roleGuard | Dashboard del cliente |
| `/cliente/mis-polizas` | MisPolizasComponent | authGuard, roleGuard | Pólizas del cliente |
| `/cliente/perfil` | PerfilComponent | authGuard, roleGuard | Perfil y actualización de datos |

### 6.5. Lazy Loading

**Características:**
- Todos los componentes se cargan de forma diferida con `loadComponent()`
- Reduce el tamaño inicial del bundle
- Mejora el tiempo de carga inicial
- Código dividido en chunks por ruta

---

## 7. Gestión de Estado (NGXS)

### 7.1. NGXS Store

**Framework**: NGXS 21.0.0  
**Patrón**: Redux-like con TypeScript

### 7.2. Estados Configurados

#### 7.2.1. AuthState

**Archivo**: `src/app/store/auth.state.ts`

**Estado:**
```typescript
export interface AuthStateModel {
  token: string | null;
  refreshToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
}
```

**Acciones:**
- `Login`: Iniciar sesión
- `Logout`: Cerrar sesión
- `SetUser`: Establecer usuario actual

**Selectores:**
- `token`: Token de acceso
- `user`: Usuario actual
- `isAuthenticated`: Estado de autenticación
- `isAdmin`: Si es administrador

**Funcionalidad:**
- Almacena tokens en localStorage
- Sincroniza estado con localStorage
- Maneja errores de autenticación

#### 7.2.2. ClientesState

**Archivo**: `src/app/store/clientes.state.ts`

**Funcionalidad:**
- Estado de clientes
- Acciones: Load, Create, Update, Delete
- Selectores para consultas

#### 7.2.3. PolizasState

**Archivo**: `src/app/store/polizas.state.ts`

**Funcionalidad:**
- Estado de pólizas
- Acciones: Load, Create, Update, Delete, Cancelar
- Selectores para filtros y consultas

### 7.3. Plugins NGXS

- **LoggerPlugin**: Registra todas las acciones en consola
- **ReduxDevtoolsPlugin**: Integración con Redux DevTools del navegador

---

## 8. Servicios y APIs

### 8.1. Auth Service

**Archivo**: `src/app/core/services/auth.service.ts`

**Métodos:**

```typescript
@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = environment.authApiUrl;

  login(username: string, password: string): Observable<LoginResponse>
  register(request: RegisterRequest): Observable<any>
  logout(refreshToken: string): Observable<any>
  refreshToken(refreshToken: string): Observable<any>
}
```

**Endpoints Consumidos:**
- `POST /api/auth/login` → Login
- `POST /api/auth/register` → Registro
- `POST /api/auth/logout` → Logout
- `POST /api/auth/refresh` → Refresh token

### 8.2. Cliente Service

**Archivo**: `src/app/core/services/cliente.service.ts`

**Métodos:**

```typescript
@Injectable({ providedIn: 'root' })
export class ClienteService {
  private apiUrl = `${environment.segurosApiUrl}/clientes`;

  getAll(): Observable<ApiResponse<Cliente[]>>
  getById(id: number): Observable<ApiResponse<Cliente>>
  getByUserId(userId: number): Observable<ApiResponse<Cliente>>
  create(cliente: CreateClienteRequest): Observable<ApiResponse<Cliente>>
  update(id: number, cliente: UpdateClienteRequest): Observable<ApiResponse<Cliente>>
  updateMyInfo(request: UpdateMyInfoRequest): Observable<ApiResponse<Cliente>>
  delete(id: number): Observable<ApiResponse<boolean>>
}
```

**Endpoints Consumidos:**
- `GET /api/Clientes` → Lista de clientes
- `GET /api/Clientes/{id}` → Cliente por ID
- `GET /api/Clientes/User/{userId}` → Cliente por UserID
- `POST /api/Clientes` → Crear cliente
- `PUT /api/Clientes/{id}` → Actualizar cliente
- `PATCH /api/Clientes/UpdateMyInfo` → Actualizar información propia
- `DELETE /api/Clientes/{id}` → Eliminar cliente

**Cache:**
- Invalida caché automáticamente en operaciones de escritura
- Usa `CacheService` para invalidación

### 8.3. Poliza Service

**Archivo**: `src/app/core/services/poliza.service.ts`

**Métodos:**

```typescript
@Injectable({ providedIn: 'root' })
export class PolizaService {
  private apiUrl = `${environment.segurosApiUrl}/Polizas`;

  getAll(): Observable<ApiResponse<Poliza[]>>
  getById(id: number): Observable<ApiResponse<Poliza>>
  getByClienteId(clienteId: number): Observable<ApiResponse<Poliza[]>>
  getByTipo(tipo: number): Observable<ApiResponse<Poliza[]>>
  getByEstatus(estatus: number): Observable<ApiResponse<Poliza[]>>
  getVigentes(): Observable<ApiResponse<Poliza[]>>
  create(poliza: CreatePolizaRequest): Observable<ApiResponse<Poliza>>
  update(id: number, poliza: Partial<CreatePolizaRequest>): Observable<ApiResponse<Poliza>>
  delete(id: number): Observable<ApiResponse<boolean>>
  cancelar(id: number): Observable<ApiResponse<Poliza>>
}
```

**Endpoints Consumidos:**
- `GET /api/Polizas/vigentes` → Pólizas vigentes
- `GET /api/Polizas/{id}` → Póliza por ID
- `GET /api/Polizas/cliente/{clienteId}` → Pólizas por cliente
- `GET /api/Polizas/tipo/{tipo}` → Pólizas por tipo
- `GET /api/Polizas/estatus/{estatus}` → Pólizas por estatus
- `POST /api/Polizas` → Crear póliza
- `PUT /api/Polizas/{id}` → Actualizar póliza
- `DELETE /api/Polizas/{id}` → Eliminar póliza
- `POST /api/Polizas/{id}/cancelar` → Cancelar póliza

**Cache:**
- Invalida caché automáticamente
- Notifica cambios mediante `PolizaEventsService`

### 8.4. Cache Service

**Archivo**: `src/app/core/services/cache.service.ts`

**Funcionalidad:**
- Cache con localStorage y memoria
- Generación de claves de caché
- Invalidación por patrón
- TTL (Time To Live) configurable

**Estrategias:**
- `MEMORY`: Cache solo en memoria
- `LOCAL_STORAGE`: Cache persistente en localStorage

---

## 9. Interceptores HTTP

### 9.1. Cache Interceptor

**Archivo**: `src/app/core/interceptors/cache.interceptor.ts`

**Funcionalidad:**
- Cachea automáticamente peticiones GET
- TTL según tipo de endpoint:
  - Clientes: 10 minutos
  - Pólizas: 5 minutos
  - Perfil/Usuario: 2 minutos
- Estrategia: localStorage (persistente)

**Flujo:**
```
1. Verificar si existe en caché
2. Si existe → Retornar desde caché
3. Si no existe → Hacer petición HTTP
4. Guardar respuesta en caché
5. Retornar respuesta
```

### 9.2. Auth Interceptor

**Archivo**: `src/app/core/interceptors/auth.interceptor.ts`

**Funcionalidad:**
- Agrega `Authorization: Bearer {token}` a todas las peticiones
- Obtiene token de `localStorage.getItem('token')`
- Limpia espacios en blanco del token
- Logs de debug para troubleshooting

**Headers Agregados:**
```
Authorization: Bearer {accessToken}
```

### 9.3. Error Interceptor

**Archivo**: `src/app/core/interceptors/error.interceptor.ts`

**Funcionalidad:**
- Captura errores HTTP globales
- Maneja error 401 (Unauthorized):
  - Limpia tokens de localStorage
  - Redirige a `/login`
- Propaga otros errores para manejo en componentes

---

## 10. Guards y Protección de Rutas

### 10.1. Auth Guard

**Archivo**: `src/app/core/guards/auth.guard.ts`

**Funcionalidad:**
- Verifica si el usuario está autenticado
- Usa `AuthState.isAuthenticated` del store NGXS
- Redirige a `/login` si no está autenticado

```typescript
export const authGuard: CanActivateFn = (route, state) => {
  const store = inject(Store);
  const router = inject(Router);
  
  const isAuthenticated = store.selectSnapshot(AuthState.isAuthenticated);
  
  if (!isAuthenticated) {
    router.navigate(['/login']);
    return false;
  }
  
  return true;
};
```

### 10.2. Role Guard

**Archivo**: `src/app/core/guards/role.guard.ts`

**Funcionalidad:**
- Verifica si el usuario tiene el rol requerido
- Lee `route.data['role']` para obtener rol requerido
- Compara con roles del usuario desde `AuthState.user`
- Redirige a `/` si no tiene el rol

```typescript
export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const store = inject(Store);
  const router = inject(Router);
  
  const user = store.selectSnapshot(AuthState.user);
  const requiredRole = route.data['role'];
  
  if (!user || !user.roles.some(r => r.nombre === requiredRole)) {
    router.navigate(['/']);
    return false;
  }
  
  return true;
};
```

---

## 11. Componentes Principales

### 11.1. Componentes de Autenticación

#### 11.1.1. Login Component

**Ruta**: `/login`  
**Path**: `src/app/features/auth/login/`

**Funcionalidades:**
- Formulario de login reactivo
- Validaciones de campos
- Manejo de errores
- Redirección según rol después del login

**Campos:**
- `username` (required)
- `password` (required)

#### 11.1.2. Register Component

**Ruta**: `/register`  
**Path**: `src/app/features/auth/register/`

**Funcionalidades:**
- Formulario de registro
- Validaciones de datos
- Registro de nuevos usuarios

**Campos:**
- `username` (required)
- `email` (required, valid email)
- `password` (required, min length)
- `roleId` (default: 2 - CLIENTE)

### 11.2. Componentes de Administración

#### 11.2.1. Clientes List Component

**Ruta**: `/admin/clientes`  
**Path**: `src/app/features/admin/clientes-list/`

**Funcionalidades:**
- Lista paginada de clientes
- Búsqueda y filtrado
- Acciones: Ver, Editar, Eliminar
- Solo ADMINISTRADOR

#### 11.2.2. Cliente Form Component

**Ruta**: `/admin/clientes/registrar`  
**Path**: `src/app/features/admin/cliente-form/`

**Funcionalidades:**
- Formulario reactivo para crear/editar clientes
- Validaciones completas según backend
- Manejo de errores
- Redirección después de crear/actualizar

**Validaciones:**
- `numeroIdentificacion`: 10 dígitos numéricos
- `nombre`, `apPaterno`, `apMaterno`: Solo letras, max 40 caracteres
- `telefono`: Formato válido, max 20 caracteres
- `email`: Email válido, max 100 caracteres
- `direccion`: Opcional, max 250 caracteres

#### 11.2.3. Polizas List Component

**Ruta**: `/admin/polizas`  
**Path**: `src/app/features/admin/polizas-list/`

**Funcionalidades:**
- Lista de pólizas
- Filtros: Tipo, Estatus, Cliente
- Acciones: Ver, Editar, Eliminar

#### 11.2.4. Poliza Form Component

**Ruta**: `/admin/polizas/crear`  
**Path**: `src/app/features/admin/poliza-form/`

**Funcionalidades:**
- Creación de pólizas
- Solo ADMINISTRADOR
- Validaciones de fechas y montos

#### 11.2.5. Dashboard Component (Admin)

**Ruta**: `/admin/dashboard`  
**Path**: `src/app/features/admin/dashboard/`

**Funcionalidades:**
- Vista general del sistema
- Estadísticas de clientes y pólizas
- Accesos rápidos

### 11.3. Componentes de Cliente

#### 11.3.1. Dashboard Component (Cliente)

**Ruta**: `/cliente/dashboard`  
**Path**: `src/app/features/cliente/dashboard/`

**Funcionalidades:**
- Vista general para cliente
- Resumen de pólizas
- Accesos rápidos

#### 11.3.2. Mis Polizas Component

**Ruta**: `/cliente/mis-polizas`  
**Path**: `src/app/features/cliente/mis-polizas/`

**Funcionalidades:**
- Lista de pólizas del cliente
- Información detallada
- Acción de cancelar (si aplica)

#### 11.3.3. Perfil Component

**Ruta**: `/cliente/perfil`  
**Path**: `src/app/features/cliente/perfil/`

**Funcionalidades:**
- Vista y edición de perfil
- Actualización de dirección y teléfono
- Solo campos editables según backend (`UpdateMyInfo`)

### 11.4. Componentes Compartidos

#### 11.4.1. App Shell Component

**Path**: `src/app/shared/components/app-shell/`

**Funcionalidades:**
- Layout principal de la aplicación
- Contiene: navbar, sidebar, contenido principal
- Router outlet para componentes hijos

#### 11.4.2. Navbar Component

**Path**: `src/app/shared/components/navbar/`

**Funcionalidades:**
- Barra de navegación superior
- Logo
- Información del usuario
- Menú de usuario (logout)

#### 11.4.3. Left Sidebar Component

**Path**: `src/app/shared/components/left-sidebar/`

**Funcionalidades:**
- Barra lateral de navegación
- Menú según rol
- Indicador de ruta activa

#### 11.4.4. Loading Component

**Path**: `src/app/shared/components/loading/`

**Funcionalidades:**
- Indicador de carga global
- Spinner o skeleton loader

#### 11.4.5. Date Input Component

**Path**: `src/app/shared/components/date-input/`

**Funcionalidades:**
- Input personalizado para fechas
- Formateo y validación
- Reutilizable en formularios

---

## 12. Modelos de Datos

### 12.1. Auth Models

**Archivo**: `src/app/core/models/auth.models.ts`

```typescript
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
```

### 12.2. Seguros Models

**Archivo**: `src/app/core/models/seguros.models.ts`

```typescript
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
```

---

## 13. Cache y Performance

### 13.1. Estrategia de Cache

**Implementación**: `CacheService` + `cacheInterceptor`

**Características:**
- Cache automático de peticiones GET
- Estrategia: localStorage (persistente)
- TTL configurable según tipo de endpoint
- Invalidación automática en operaciones de escritura

### 13.2. TTL por Tipo de Endpoint

| Endpoint | TTL | Razón |
|----------|-----|-------|
| `/Clientes` | 10 minutos | Datos que cambian poco |
| `/Polizas` | 5 minutos | Pueden cambiar más frecuentemente |
| `/User/`, `/perfil` | 2 minutos | Datos de usuario más dinámicos |
| Otros | 5 minutos | Por defecto |

### 13.3. Invalidación de Cache

**Automatizada:**
- Al crear/actualizar/eliminar cliente → Invalida caché de clientes
- Al crear/actualizar/eliminar/cancelar póliza → Invalida caché de pólizas

**Manual:**
- `CacheService.remove(key, strategy)` → Eliminar clave específica
- `CacheService.invalidateByPattern(pattern, strategy)` → Invalidar por patrón

### 13.4. Optimizaciones

- **Lazy Loading**: Componentes cargados bajo demanda
- **Tree Shaking**: Eliminación de código no utilizado
- **Minificación**: Código minificado en producción
- **Bundle Splitting**: Código dividido en chunks
- **Cache de Assets**: Nginx cachea archivos estáticos (1 año)

---

## 14. Docker y Deployment

### 14.1. Dockerfile

**Archivo**: `Dockerfile`

```dockerfile
# Etapa 1: Construcción de la aplicación Angular
FROM node:20-alpine AS build

WORKDIR /app

# Copiar archivos de dependencias
COPY package.json package-lock.json ./

# Instalar dependencias
# Usar --legacy-peer-deps para resolver conflictos de versiones entre Angular 19 y NGXS 21
RUN npm ci --legacy-peer-deps

# Copiar el resto del código fuente
COPY . .

# Construir la aplicación para producción
RUN npm run build

# Etapa 2: Servir la aplicación con Nginx
FROM nginx:alpine

# Copiar los archivos construidos desde la etapa de build
COPY --from=build /app/dist/Seguros_Front/browser /usr/share/nginx/html

# Copiar configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponer el puerto 80
EXPOSE 80

# Comando para iniciar Nginx
CMD ["nginx", "-g", "daemon off;"]
```

**Características:**
- Multi-stage build
- Node.js 20-alpine para build
- Nginx Alpine para producción
- Build optimizado para producción

### 14.2. nginx.conf

**Archivo**: `nginx.conf`

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Configuración para SPA (Single Page Application)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache para archivos estáticos
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Compresión gzip
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json;

    # Seguridad
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

**Configuración:**
- SPA routing con `try_files`
- Cache de assets estáticos (1 año)
- Compresión gzip habilitada
- Headers de seguridad

### 14.3. Build para Producción

**Comando:**
```bash
npm run build
```

**Salida**: `dist/Seguros_Front/browser/`

**Optimizaciones Aplicadas:**
- Minificación de código
- Tree-shaking
- AOT (Ahead-of-Time) compilation
- Bundle splitting
- Source maps deshabilitados (producción)

### 14.4. Docker Compose (Opcional)

**Archivo**: `docker-compose.yml`

```yaml
version: "3.9"

services:
  seguros-front:
    build: .
    container_name: seguros-front
    ports:
      - "80:80"
    networks:
      - frontend

networks:
  frontend:
```

---

## 15. Integración con Backend

### 15.1. URLs de APIs

**Desarrollo:**
- Auth API: `http://localhost:5001/api`
- Seguros API: `http://localhost:5002/api`

**Producción:**
- Auth API: `https://auth-api-hscra6bsgahsepdb.westus2-01.azurewebsites.net/api`
- Seguros API: `https://seguros-api-allr-hycycshxhsgah8eq.westus2-01.azurewebsites.net/api`

### 15.2. Autenticación JWT

**Flujo:**
1. Usuario hace login → `POST /api/auth/login`
2. Backend retorna `accessToken` y `refreshToken`
3. Frontend almacena tokens en `localStorage`
4. `AuthInterceptor` agrega `Authorization: Bearer {token}` a todas las peticiones
5. Si token expira (401) → `ErrorInterceptor` redirige a `/login`

**Almacenamiento:**
- `localStorage.setItem('token', accessToken)`
- `localStorage.setItem('refreshToken', refreshToken)`

### 15.3. Formato de Respuestas

**Todas las respuestas del backend siguen:**

```typescript
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  errors?: string[];
}
```

### 15.4. Manejo de Errores

**Errores Comunes:**

- **401 Unauthorized**: Token expirado → Logout automático
- **403 Forbidden**: Sin permisos → Mensaje de error
- **404 Not Found**: Recurso no encontrado → Mensaje específico
- **500 Internal Server Error**: Error del servidor → Mensaje genérico

**Implementación:**
- `ErrorInterceptor` maneja 401 globalmente
- Componentes manejan otros errores específicos
- Mensajes mostrados al usuario mediante UI

---
## Recursos internos
- IMPLEMENTACION.md: contiene comandos y ejemplos prácticos adicionales (generación de componentes, estructura NGXS, ejemplos de services, interceptors, guards, app.config y rutas). Revisa este documento si necesitas más detalles de implementación o ejemplos de código.
