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
