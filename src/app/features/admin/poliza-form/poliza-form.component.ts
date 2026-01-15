import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { PolizaService } from '../../../core/services/poliza.service';
import { ClienteService } from '../../../core/services/cliente.service';
import { CreatePolizaRequest, TipoPoliza, EstatusPoliza, Cliente } from '../../../core/models/seguros.models';
import { DateInputComponent } from '../../../shared/components/date-input/date-input.component';

@Component({
  selector: 'app-poliza-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, DateInputComponent],
  templateUrl: './poliza-form.component.html',
  styleUrl: './poliza-form.component.scss'
})
export class PolizaFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private polizaService = inject(PolizaService);
  private clienteService = inject(ClienteService);
  private router = inject(Router);

  polizaForm: FormGroup;
  clientes: Cliente[] = [];
  clientesFiltrados: Cliente[] = [];
  isLoadingClientes = false;
  isSubmitting = false;
  showSuccessAlert = false;
  errorMessage = '';
  searchClienteControl = this.fb.control('');
  
  // Fecha mínima para los inputs de fecha (hoy)
  minDate: string;

  // Opciones para los selects (orden según backend: 1-Vida, 2-Automóvil, 3-Hogar, 4-Salud)
  tiposPoliza = [
    { value: TipoPoliza.Vida, label: 'Vida' },
    { value: TipoPoliza.Automovil, label: 'Automóvil' },
    { value: TipoPoliza.Hogar, label: 'Hogar' },
    { value: TipoPoliza.Salud, label: 'Salud' }
  ];

  estadosPoliza = [
    { value: EstatusPoliza.Vigente, label: 'Activa' },
    { value: EstatusPoliza.Cancelada, label: 'Cancelada' }
  ];

  constructor() {
    // Inicializar fecha mínima (hoy)
    this.minDate = new Date().toISOString().split('T')[0];
    
    this.polizaForm = this.fb.group({
      idCliente: ['', Validators.required],
      tipoPoliza: ['', Validators.required],
      fechaInicio: ['', Validators.required],
      fechaFin: ['', [Validators.required, this.fechaFinValidator]],
      monto: ['', [Validators.required, Validators.min(0.01), Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
      estatus: [{ value: EstatusPoliza.Vigente, disabled: true }] // Deshabilitado, siempre será Vigente
    });
  }

  ngOnInit() {
    this.loadClientes();
    
    // Validar fecha inicio cuando cambie
    this.polizaForm.get('fechaInicio')?.valueChanges.subscribe(() => {
      this.validateFechaInicio();
      // Actualizar min de fechaFin cuando cambia fechaInicio
      const fechaInicio = this.polizaForm.get('fechaInicio')?.value;
      if (fechaInicio) {
        const fecha = new Date(fechaInicio);
        fecha.setDate(fecha.getDate() + 1);
        const minDate = fecha.toISOString().split('T')[0];
        const fechaFinInput = document.getElementById('fechaFin') as HTMLInputElement;
        if (fechaFinInput) {
          fechaFinInput.min = minDate;
        }
        // Validar fecha fin cuando cambia fecha inicio
        this.polizaForm.get('fechaFin')?.updateValueAndValidity();
      }
    });

    // Validar fecha fin cuando cambie
    this.polizaForm.get('fechaFin')?.valueChanges.subscribe(() => {
      this.validateFechaFin();
    });
  }

  validateFechaInicio() {
    const fechaInicio = this.polizaForm.get('fechaInicio')?.value;
    if (fechaInicio) {
      // Convertir la fecha del input (formato YYYY-MM-DD) a Date
      const fecha = new Date(fechaInicio + 'T00:00:00');
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      
      // Comparar solo las fechas sin considerar la hora
      const fechaComparar = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
      const hoyComparar = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
      
      // Permitir hoy o fechas futuras (>= hoy)
      if (fechaComparar < hoyComparar) {
        this.polizaForm.get('fechaInicio')?.setErrors({ fechaPasada: true });
      } else {
        // Limpiar error si existe
        const currentErrors = this.polizaForm.get('fechaInicio')?.errors;
        if (currentErrors && currentErrors['fechaPasada']) {
          delete currentErrors['fechaPasada'];
          if (Object.keys(currentErrors).length === 0) {
            this.polizaForm.get('fechaInicio')?.setErrors(null);
          } else {
            this.polizaForm.get('fechaInicio')?.setErrors(currentErrors);
          }
        }
        this.polizaForm.get('fechaInicio')?.updateValueAndValidity({ emitEvent: false });
      }
    }
  }

  validateFechaFin() {
    const fechaInicio = this.polizaForm.get('fechaInicio')?.value;
    const fechaFin = this.polizaForm.get('fechaFin')?.value;
    
    if (fechaInicio && fechaFin) {
      const inicio = new Date(fechaInicio);
      const fin = new Date(fechaFin);
      
      if (fin <= inicio) {
        this.polizaForm.get('fechaFin')?.setErrors({ fechaFinInvalida: true });
      } else {
        const currentErrors = this.polizaForm.get('fechaFin')?.errors;
        if (currentErrors && currentErrors['fechaFinInvalida']) {
          delete currentErrors['fechaFinInvalida'];
          if (Object.keys(currentErrors).length === 0) {
            this.polizaForm.get('fechaFin')?.setErrors(null);
          } else {
            this.polizaForm.get('fechaFin')?.setErrors(currentErrors);
          }
        }
        this.polizaForm.get('fechaFin')?.updateValueAndValidity({ emitEvent: false });
      }
    }
  }

  // Validador personalizado para fecha fin
  fechaFinValidator = (control: AbstractControl): ValidationErrors | null => {
    const fechaInicio = this.polizaForm?.get('fechaInicio')?.value;
    const fechaFin = control.value;

    if (!fechaInicio || !fechaFin) {
      return null;
    }

    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);

    if (fin <= inicio) {
      return { fechaFinInvalida: true };
    }

    return null;
  };

  loadClientes() {
    this.isLoadingClientes = true;
    this.clienteService.getAll().subscribe({
      next: (response) => {
        if (response.success) {
          this.clientes = response.data;
          // No mostrar clientes hasta que haya texto en la búsqueda
          this.clientesFiltrados = [];
        }
        this.isLoadingClientes = false;
      },
      error: (error) => {
        console.error('Error al cargar clientes:', error);
        this.errorMessage = 'Error al cargar la lista de clientes';
        this.isLoadingClientes = false;
      }
    });
  }

  filterClientes() {
    const search = this.searchClienteControl.value?.toLowerCase() || '';
    if (!search || search.trim() === '') {
      // No mostrar clientes hasta que haya texto
      this.clientesFiltrados = [];
      return;
    }

    this.clientesFiltrados = this.clientes.filter(cliente =>
      cliente.nombreCompleto.toLowerCase().includes(search) ||
      cliente.numeroIdentificacion.includes(search) ||
      cliente.email.toLowerCase().includes(search)
    );
  }

  selectCliente(cliente: Cliente) {
    this.polizaForm.patchValue({ idCliente: cliente.id });
    this.searchClienteControl.setValue(cliente.nombreCompleto);
    this.clientesFiltrados = this.clientes;
  }

  clearClienteSelection() {
    this.polizaForm.patchValue({ idCliente: '' });
    this.searchClienteControl.setValue('');
    this.clientesFiltrados = this.clientes;
  }

  getClienteNombre(id: number | null | undefined): string {
    if (!id) return '';
    const cliente = this.clientes.find(c => c.id === id);
    return cliente ? cliente.nombreCompleto : '';
  }

  getDisplayValue(): string {
    const clienteId = this.polizaForm.get('idCliente')?.value;
    if (clienteId) {
      return this.getClienteNombre(clienteId);
    }
    return this.searchClienteControl.value || '';
  }

  getMinDateFin(): string {
    const fechaInicio = this.polizaForm.get('fechaInicio')?.value;
    if (fechaInicio) {
      // Retornar la fecha de inicio + 1 día como mínimo
      const fecha = new Date(fechaInicio);
      fecha.setDate(fecha.getDate() + 1);
      return fecha.toISOString().split('T')[0];
    }
    return this.minDate;
  }

  onSubmit() {
    if (this.polizaForm.valid) {
      this.isSubmitting = true;
      this.errorMessage = '';

      const formValue = this.polizaForm.value;
      
      // Obtener el valor del estatus (puede estar deshabilitado)
      const estatusValue = this.polizaForm.get('estatus')?.value || EstatusPoliza.Vigente;
      
      const polizaData: CreatePolizaRequest = {
        idCliente: Number(formValue.idCliente),
        tipoPoliza: Number(formValue.tipoPoliza) as TipoPoliza,
        fechaInicio: formValue.fechaInicio,
        fechaFin: formValue.fechaFin,
        monto: parseFloat(formValue.monto),
        estatus: Number(estatusValue) as EstatusPoliza
      };

      this.polizaService.create(polizaData).subscribe({
        next: (response) => {
          if (response.success) {
            this.showSuccessAlert = true;
            this.polizaForm.reset();
            this.polizaForm.patchValue({ estatus: EstatusPoliza.Vigente });
            this.searchClienteControl.setValue('');
          } else {
            this.errorMessage = response.message || 'Error al crear la póliza';
            this.isSubmitting = false;
          }
        },
        error: (error) => {
          console.error('Error al crear póliza:', error);
          const errorMsg = error.error?.message || 
                          error.error?.errors?.[0] || 
                          'Error al crear la póliza. Intenta nuevamente.';
          this.errorMessage = errorMsg;
          this.isSubmitting = false;
        }
      });
    } else {
      this.polizaForm.markAllAsTouched();
    }
  }

  closeSuccessAlert() {
    this.showSuccessAlert = false;
    this.isSubmitting = false;
    this.router.navigate(['/admin/polizas']);
  }

  get idCliente() { return this.polizaForm.get('idCliente'); }
  get tipoPoliza() { return this.polizaForm.get('tipoPoliza'); }
  get fechaInicio() { return this.polizaForm.get('fechaInicio'); }
  get fechaFin() { return this.polizaForm.get('fechaFin'); }
  get monto() { return this.polizaForm.get('monto'); }
  get estatus() { return this.polizaForm.get('estatus'); }
}
