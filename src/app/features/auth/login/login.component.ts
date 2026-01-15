import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Store } from '@ngxs/store';
import { Login, AuthState } from '../../../store/auth.state';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private store = inject(Store);
  private router = inject(Router);

  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';

  constructor() {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required]]
    });
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      
      const { username, password } = this.loginForm.value;
      
      this.store.dispatch(new Login(username, password)).subscribe({
        next: () => {
          // Verificar si el login fue exitoso después de un pequeño delay
          setTimeout(() => {
            const isAuthenticated = this.store.selectSnapshot(AuthState.isAuthenticated);
            if (isAuthenticated) {
              const user = this.store.selectSnapshot(AuthState.user);
              if (user) {
                // Redirigir según el rol
                const isAdmin = this.store.selectSnapshot(AuthState.isAdmin);
                this.router.navigate([isAdmin ? '/admin/dashboard' : '/cliente/dashboard']);
              }
            } else {
              this.errorMessage = 'Credenciales incorrectas. Intenta nuevamente.';
              this.isLoading = false;
            }
          }, 100);
        },
        error: (error) => {
          console.error('Login error:', error);
          const errorMsg = error?.error?.message || 
                          error?.error?.errors?.[0] || 
                          error?.message || 
                          'Error al iniciar sesión. Verifica tus credenciales.';
          this.errorMessage = errorMsg;
          this.isLoading = false;
        }
      });
    } else {
      this.loginForm.markAllAsTouched();
    }
  }

  get username() {
    return this.loginForm.get('username');
  }

  get password() {
    return this.loginForm.get('password');
  }
}
