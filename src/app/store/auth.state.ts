import { Injectable } from '@angular/core';
import { State, Action, StateContext, Selector } from '@ngxs/store';
import { catchError, tap } from 'rxjs/operators';
import { AuthService } from '../core/services/auth.service';
import { User } from '../core/models/auth.models';
import { of } from 'rxjs';

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
      tap({
        next: (response) => {
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
        },
        error: (error) => {
          // El error se manejará en el componente
          throw error;
        }
      })
    );
  }

  @Action(Logout)
  logout(ctx: StateContext<AuthStateModel>) {
    const refreshToken = ctx.getState().refreshToken;
    
    if (refreshToken) {
      return this.authService.logout(refreshToken).pipe(
        tap({
          next: () => {
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            ctx.setState({
              token: null,
              refreshToken: null,
              user: null,
              isAuthenticated: false
            });
          },
          error: () => {}
        })
        ,
        catchError(() => {
          // Aunque falle el servicio, limpiamos el estado local y NO propagamos error
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          ctx.setState({
            token: null,
            refreshToken: null,
            user: null,
            isAuthenticated: false
          });
          return of(null);
        })
      );
    } else {
      // Si no hay refreshToken, solo limpiamos el estado local
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      ctx.setState({
        token: null,
        refreshToken: null,
        user: null,
        isAuthenticated: false
      });
      return of(null);
    }
  }
}
