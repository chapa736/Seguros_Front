import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Store } from '@ngxs/store';
import { AuthState } from '../../../store/auth.state';
import { ClienteService } from '../../../core/services/cliente.service';
import { Cliente, UpdateMyInfoRequest } from '../../../core/models/seguros.models';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './perfil.component.html',
  styleUrl: './perfil.component.scss'
})
export class PerfilComponent implements OnInit {
  private fb = inject(FormBuilder);
  private store = inject(Store);
  private clienteService = inject(ClienteService);

  user: any = null;
  cliente: Cliente | null = null;
  isLoading = false;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';
  perfilForm: FormGroup;

  constructor() {
    this.perfilForm = this.fb.group({
      numeroIdentificacion: [{ value: '', disabled: true }],
      nombre: [{ value: '', disabled: true }],
      apPaterno: [{ value: '', disabled: true }],
      apMaterno: [{ value: '', disabled: true }],
      email: [{ value: '', disabled: true }],
      telefono: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      direccion: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.user = this.store.selectSnapshot(AuthState.user);
    if (this.user?.id) {
      this.loadCliente();
    }
  }

  loadCliente() {
    this.isLoading = true;
    this.errorMessage = '';
    
    // Obtener el cliente usando el userId (el endpoint /api/Clientes/{id} ahora recibe userId)
    this.clienteService.getByUserId(this.user.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.cliente = response.data;
          this.perfilForm.patchValue({
            numeroIdentificacion: response.data.numeroIdentificacion,
            nombre: response.data.nombre,
            apPaterno: response.data.apPaterno,
            apMaterno: response.data.apMaterno,
            email: response.data.email,
            telefono: response.data.telefono,
            direccion: response.data.direccion
          });
        } else {
          this.errorMessage = response.message || 'Error al cargar la información del cliente';
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar cliente:', error);
        this.errorMessage = 'Error al cargar la información del cliente. Intenta nuevamente.';
        this.isLoading = false;
      }
    });
  }

  onSubmit() {
    if (this.perfilForm.valid && this.cliente) {
      this.isSubmitting = true;
      this.errorMessage = '';
      this.successMessage = '';

      const formValue = this.perfilForm.getRawValue();
      const updateData: UpdateMyInfoRequest = {
        idCliente: this.cliente.id,
        telefono: formValue.telefono.trim(),
        direccion: formValue.direccion.trim()
      };

      // Log para validar los datos que se envían
      console.log('=== Datos a enviar a /api/clientes/UpdateMyInfo ===');
      console.log('Datos:', JSON.stringify(updateData, null, 2));
      console.log('Token presente:', !!localStorage.getItem('token'));
      console.log('User ID:', this.user?.id);
      console.log('Cliente ID:', this.cliente?.id);
      console.log('==================================================');

      this.clienteService.updateMyInfo(updateData).subscribe({
        next: (response) => {
          if (response.success) {
            this.cliente = response.data;
            this.successMessage = 'Tu información se ha actualizado correctamente.';
            // Limpiar mensaje después de 5 segundos
            setTimeout(() => {
              this.successMessage = '';
            }, 5000);
          } else {
            this.errorMessage = response.message || 'Error al actualizar la información';
          }
          this.isSubmitting = false;
        },
        error: (error) => {
          console.error('Error al actualizar cliente:', error);
          const errorMsg = error.error?.message || 
                          error.error?.errors?.[0] || 
                          'Error al actualizar la información. Intenta nuevamente.';
          this.errorMessage = errorMsg;
          this.isSubmitting = false;
        }
      });
    } else {
      this.perfilForm.markAllAsTouched();
    }
  }

  get telefono() { return this.perfilForm.get('telefono'); }
  get direccion() { return this.perfilForm.get('direccion'); }
}
