import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ClienteService } from '../../../core/services/cliente.service';
import { CreateClienteRequest } from '../../../core/models/seguros.models';

@Component({
  selector: 'app-cliente-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './cliente-form.component.html',
  styleUrl: './cliente-form.component.scss'
})
export class ClienteFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private clienteService = inject(ClienteService);
  private router = inject(Router);

  clienteForm: FormGroup;
  numeroIdentificacion: string = '';
  isGenerating = false;
  isSubmitting = false;
  showSuccessAlert = false;
  successData: { username: string; password: string } | null = null;
  errorMessage = '';

  constructor() {
    this.clienteForm = this.fb.group({
      nombre: ['', [Validators.required, this.nameValidator]],
      apPaterno: ['', [Validators.required, this.nameValidator]],
      apMaterno: ['', [Validators.required, this.nameValidator]],
      email: ['', [Validators.required, Validators.email]],
      telefono: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      direccion: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.generateNumeroIdentificacion();
  }

  // Validador personalizado para nombres (solo letras y espacios)
  nameValidator(control: any) {
    if (!control.value) return null;
    const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/;
    return nameRegex.test(control.value) ? null : { invalidName: true };
  }

  // Generar número de identificación único (10 dígitos)
  generateNumeroIdentificacion() {
    this.isGenerating = true;
    
    // Estrategia: timestamp (últimos 6 dígitos) + random (4 dígitos)
    // Esto reduce significativamente la posibilidad de duplicados
    const timestamp = Date.now().toString();
    const timestampPart = timestamp.slice(-6); // Últimos 6 dígitos del timestamp
    const randomPart = Math.floor(1000 + Math.random() * 9000).toString(); // 4 dígitos aleatorios
    
    this.numeroIdentificacion = (timestampPart + randomPart).slice(0, 10);
    
    // Asegurar que siempre tenga 10 dígitos
    if (this.numeroIdentificacion.length < 10) {
      this.numeroIdentificacion = this.numeroIdentificacion.padStart(10, '0');
    }
    
    this.isGenerating = false;
  }

  // Regenerar número si hay duplicado
  regenerateNumero() {
    this.generateNumeroIdentificacion();
    this.errorMessage = '';
  }

  // Generar username según la lógica especificada
  generateUsername(nombre: string, apPaterno: string, apMaterno: string): string {
    const primeraLetraPaterno = apPaterno.charAt(0).toLowerCase();
    const primeraLetraMaterno = apMaterno.charAt(0).toLowerCase();
    const primerNombre = nombre.split(' ')[0]; // Primera palabra del nombre
    
    return primeraLetraPaterno + primeraLetraMaterno + primerNombre;
  }

  onSubmit() {
    if (this.clienteForm.valid && this.numeroIdentificacion) {
      this.isSubmitting = true;
      this.errorMessage = '';

      const formValue = this.clienteForm.value;
      
      // Generar username
      const username = this.generateUsername(
        formValue.nombre,
        formValue.apPaterno,
        formValue.apMaterno
      );

      const clienteData: CreateClienteRequest = {
        numeroIdentificacion: this.numeroIdentificacion,
        nombre: formValue.nombre.trim(),
        apPaterno: formValue.apPaterno.trim(),
        apMaterno: formValue.apMaterno.trim(),
        telefono: formValue.telefono.trim(),
        email: formValue.email.trim().toLowerCase(),
        direccion: formValue.direccion.trim(),
        userId: 0 // Se asignará en el backend
      };

      this.clienteService.create(clienteData).subscribe({
        next: (response) => {
          if (response.success) {
            this.successData = {
              username: username,
              password: this.numeroIdentificacion
            };
            this.showSuccessAlert = true;
            this.clienteForm.reset();
            this.generateNumeroIdentificacion();
          } else {
            this.errorMessage = response.message || 'Error al registrar el cliente';
            this.isSubmitting = false;
          }
        },
        error: (error) => {
          console.error('Error al crear cliente:', error);
          
          // Extraer mensaje de error del backend
          let errorMsg = '';
          if (error.error) {
            if (error.error.errors && Array.isArray(error.error.errors) && error.error.errors.length > 0) {
              errorMsg = error.error.errors[0];
            } else if (error.error.message) {
              errorMsg = error.error.message;
            }
          }
          
          // Verificar si es error de duplicado
          if (error.status === 400 || error.status === 409) {
            const lowerMsg = errorMsg.toLowerCase();
            if (lowerMsg.includes('duplicado') || 
                lowerMsg.includes('ya existe') ||
                lowerMsg.includes('unique') ||
                lowerMsg.includes('número de identificación')) {
              this.errorMessage = 'El número de identificación ya existe. Por favor, regenera un nuevo número.';
            } else if (lowerMsg.includes('connection refused') || lowerMsg.includes('localhost:7001')) {
              this.errorMessage = 'Error de conexión con el servidor. Por favor, verifica que todos los servicios estén ejecutándose.';
            } else {
              this.errorMessage = errorMsg || 'Error al registrar el cliente. Verifica los datos e intenta nuevamente.';
            }
          } else if (error.status === 401 || error.status === 403) {
            this.errorMessage = 'No tienes permisos para realizar esta acción. Por favor, inicia sesión nuevamente.';
          } else if (error.status === 0 || error.status === 500) {
            this.errorMessage = 'Error de conexión con el servidor. Por favor, verifica que el servicio esté disponible.';
          } else {
            this.errorMessage = errorMsg || 'Error al registrar el cliente. Intenta nuevamente.';
          }
          
          this.isSubmitting = false;
        }
      });
    } else {
      this.clienteForm.markAllAsTouched();
      if (!this.numeroIdentificacion) {
        this.errorMessage = 'Por favor, genera un número de identificación';
      }
    }
  }

  closeSuccessAlert() {
    this.showSuccessAlert = false;
    this.successData = null;
    this.isSubmitting = false;
    this.router.navigate(['/admin/clientes']);
  }

  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      // Opcional: mostrar un toast de confirmación
      console.log('Copiado al portapapeles:', text);
    }).catch(err => {
      console.error('Error al copiar:', err);
    });
  }

  get nombre() { return this.clienteForm.get('nombre'); }
  get apPaterno() { return this.clienteForm.get('apPaterno'); }
  get apMaterno() { return this.clienteForm.get('apMaterno'); }
  get email() { return this.clienteForm.get('email'); }
  get telefono() { return this.clienteForm.get('telefono'); }
  get direccion() { return this.clienteForm.get('direccion'); }
}
