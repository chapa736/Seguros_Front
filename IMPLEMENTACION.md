# Guía de Implementación Frontend

## 1. Comandos para generar componentes y servicios

```bash
cd E:\Prueba_Zurich\Seguros_Front

# Servicios
ng g service core/services/auth --skip-tests
ng g service core/services/cliente --skip-tests
ng g service core/services/poliza --skip-tests

# Guards
ng g guard core/guards/auth --skip-tests
ng g guard core/guards/role --skip-tests

# Interceptors
ng g interceptor core/interceptors/auth --skip-tests
ng g interceptor core/interceptors/error --skip-tests

# Componentes Auth
ng g component features/auth/login --skip-tests
ng g component features/auth/register --skip-tests

# Componentes Admin
ng g component features/admin/dashboard --skip-tests
ng g component features/admin/clientes-list --skip-tests
ng g component features/admin/cliente-form --skip-tests
ng g component features/admin/polizas-list --skip-tests
ng g component features/admin/poliza-form --skip-tests

# Componentes Cliente
ng g component features/cliente/dashboard --skip-tests
ng g component features/cliente/mis-polizas --skip-tests
ng g component features/cliente/perfil --skip-tests

# Componentes Shared
ng g component shared/components/navbar --skip-tests
ng g component shared/components/loading --skip-tests
```

## 2. Estructura NGXS State

Crear archivos en `src/app/store/`:

### auth.state.ts
```typescript
import { Injectable } from '@angular/core';
import { State, Action, StateContext, Selector } from '@ngxs/store';
import { tap } from 'rxjs/operators';
import { AuthService } from '../core/services/auth.service';
import { User } from '../core/models/auth.models';

export class Login {
  static readonly type = '[Auth] Login';
  constructor(public username: string, public password: string) {}
}

export class Logout {
  static readonly type = '[Auth] Logout';
}

export class SetUser {
  static readonly type = '[Auth] Set User';
  constructor(public user: User) {}
}

export interface AuthStateModel {
  token: string | null;
  refreshToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
}

@State<AuthStateModel>({
  name: 'auth',
  defaults: {
    token: null,
    refreshToken: null,
    user: null,
    isAuthenticated: false
  }
})
@Injectable()
export class AuthState {
  constructor(private authService: AuthService) {}

  @Selector()
  static token(state: AuthStateModel) {
    return state.token;
  }

  @Selector()
  static user(state: AuthStateModel) {
    return state.user;
  }

  @Selector()
  static isAuthenticated(state: AuthStateModel) {
    return state.isAuthenticated;
  }

  @Selector()
  static isAdmin(state: AuthStateModel) {
    return state.user?.roles.some(r => r.nombre === 'ADMINISTRADOR') ?? false;
  }

  @Action(Login)
  login(ctx: StateContext<AuthStateModel>, action: Login) {
    return this.authService.login(action.username, action.password).pipe(
      tap(response => {
        if (response.success) {
          ctx.patchState({
            token: response.data.accessToken,
            refreshToken: response.data.refreshToken,
            user: response.data.user,
            isAuthenticated: true
          });
          localStorage.setItem('token', response.data.accessToken);
          localStorage.setItem('refreshToken', response.data.refreshToken);
        }
      })
    );
  }

  @Action(Logout)
  logout(ctx: StateContext<AuthStateModel>) {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    ctx.setState({
      token: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false
    });
  }
}
```

### clientes.state.ts
```typescript
import { Injectable } from '@angular/core';
import { State, Action, StateContext, Selector } from '@ngxs/store';
import { tap } from 'rxjs/operators';
import { ClienteService } from '../core/services/cliente.service';
import { Cliente } from '../core/models/seguros.models';

export class LoadClientes {
  static readonly type = '[Clientes] Load';
}

export class CreateCliente {
  static readonly type = '[Clientes] Create';
  constructor(public cliente: any) {}
}

export class UpdateCliente {
  static readonly type = '[Clientes] Update';
  constructor(public id: number, public cliente: any) {}
}

export class DeleteCliente {
  static readonly type = '[Clientes] Delete';
  constructor(public id: number) {}
}

export interface ClientesStateModel {
  clientes: Cliente[];
  loading: boolean;
}

@State<ClientesStateModel>({
  name: 'clientes',
  defaults: {
    clientes: [],
    loading: false
  }
})
@Injectable()
export class ClientesState {
  constructor(private clienteService: ClienteService) {}

  @Selector()
  static clientes(state: ClientesStateModel) {
    return state.clientes;
  }

  @Selector()
  static loading(state: ClientesStateModel) {
    return state.loading;
  }

  @Action(LoadClientes)
  loadClientes(ctx: StateContext<ClientesStateModel>) {
    ctx.patchState({ loading: true });
    return this.clienteService.getAll().pipe(
      tap(response => {
        ctx.patchState({
          clientes: response.data,
          loading: false
        });
      })
    );
  }

  @Action(CreateCliente)
  createCliente(ctx: StateContext<ClientesStateModel>, action: CreateCliente) {
    return this.clienteService.create(action.cliente).pipe(
      tap(response => {
        if (response.success) {
          const state = ctx.getState();
          ctx.patchState({
            clientes: [...state.clientes, response.data]
          });
        }
      })
    );
  }

  @Action(UpdateCliente)
  updateCliente(ctx: StateContext<ClientesStateModel>, action: UpdateCliente) {
    return this.clienteService.update(action.id, action.cliente).pipe(
      tap(response => {
        if (response.success) {
          const state = ctx.getState();
          const clientes = state.clientes.map(c => 
            c.id === action.id ? response.data : c
          );
          ctx.patchState({ clientes });
        }
      })
    );
  }

  @Action(DeleteCliente)
  deleteCliente(ctx: StateContext<ClientesStateModel>, action: DeleteCliente) {
    return this.clienteService.delete(action.id).pipe(
      tap(response => {
        if (response.success) {
          const state = ctx.getState();
          ctx.patchState({
            clientes: state.clientes.filter(c => c.id !== action.id)
          });
        }
      })
    );
  }
}
```

## 3. Servicios HTTP

### auth.service.ts
```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { LoginRequest, LoginResponse, RegisterRequest } from '../models/auth.models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.authApiUrl;

  constructor(private http: HttpClient) {}

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, { username, password });
  }

  register(request: RegisterRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/register`, request);
  }

  logout(refreshToken: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/logout`, refreshToken);
  }

  refreshToken(refreshToken: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/refresh`, refreshToken);
  }
}
```

### cliente.service.ts
```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse, Cliente, CreateClienteRequest, UpdateClienteRequest } from '../models/seguros.models';

@Injectable({
  providedIn: 'root'
})
export class ClienteService {
  private apiUrl = `${environment.segurosApiUrl}/clientes`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<ApiResponse<Cliente[]>> {
    return this.http.get<ApiResponse<Cliente[]>>(this.apiUrl);
  }

  getById(id: number): Observable<ApiResponse<Cliente>> {
    return this.http.get<ApiResponse<Cliente>>(`${this.apiUrl}/${id}`);
  }

  create(cliente: CreateClienteRequest): Observable<ApiResponse<Cliente>> {
    return this.http.post<ApiResponse<Cliente>>(this.apiUrl, cliente);
  }

  update(id: number, cliente: UpdateClienteRequest): Observable<ApiResponse<Cliente>> {
    return this.http.put<ApiResponse<Cliente>>(`${this.apiUrl}/${id}`, cliente);
  }

  delete(id: number): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.apiUrl}/${id}`);
  }
}
```

## 4. Interceptor de Autenticación

### auth.interceptor.ts
```typescript
import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = localStorage.getItem('token');
    
    if (token) {
      const cloned = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${token}`)
      });
      return next.handle(cloned);
    }
    
    return next.handle(req);
  }
}
```

## 5. Guards

### auth.guard.ts
```typescript
import { Injectable } from '@angular/core';
import { Router, CanActivate } from '@angular/router';
import { Store } from '@ngxs/store';
import { AuthState } from '../../store/auth.state';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private store: Store, private router: Router) {}

  canActivate(): boolean {
    const isAuthenticated = this.store.selectSnapshot(AuthState.isAuthenticated);
    
    if (!isAuthenticated) {
      this.router.navigate(['/login']);
      return false;
    }
    
    return true;
  }
}
```

### role.guard.ts
```typescript
import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot } from '@angular/router';
import { Store } from '@ngxs/store';
import { AuthState } from '../../store/auth.state';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  constructor(private store: Store, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const user = this.store.selectSnapshot(AuthState.user);
    const requiredRole = route.data['role'];
    
    if (!user || !user.roles.some(r => r.nombre === requiredRole)) {
      this.router.navigate(['/']);
      return false;
    }
    
    return true;
  }
}
```

## 6. Configuración app.config.ts

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

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAnimations(),
    importProvidersFrom(
      NgxsModule.forRoot([AuthState, ClientesState, PolizasState]),
      NgxsLoggerPluginModule.forRoot(),
      NgxsReduxDevtoolsPluginModule.forRoot()
    )
  ]
};
```

## 7. Rutas app.routes.ts

```typescript
import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { RoleGuard } from './core/guards/role.guard';

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
    canActivate: [AuthGuard, RoleGuard],
    data: { role: 'ADMINISTRADOR' },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { 
        path: 'dashboard', 
        loadComponent: () => import('./features/admin/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      { 
        path: 'clientes', 
        loadComponent: () => import('./features/admin/clientes-list/clientes-list.component').then(m => m.ClientesListComponent)
      },
      { 
        path: 'polizas', 
        loadComponent: () => import('./features/admin/polizas-list/polizas-list.component').then(m => m.PolizasListComponent)
      }
    ]
  },
  {
    path: 'cliente',
    canActivate: [AuthGuard, RoleGuard],
    data: { role: 'CLIENTE' },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
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

## 8. Comandos para ejecutar

```bash
# Desarrollo
npm start


# Ejecutar en puerto específico
ng serve --port 4200
```

## 9. URLs de los microservicios

- Auth API: https://localhost:5001
- Seguros API: https://localhost:5002
- Frontend: http://localhost:4200

