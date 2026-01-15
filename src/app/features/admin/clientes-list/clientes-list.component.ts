import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { ClienteService } from '../../../core/services/cliente.service';
import { Cliente, UpdateClienteRequest } from '../../../core/models/seguros.models';

@Component({
  selector: 'app-clientes-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './clientes-list.component.html',
  styleUrl: './clientes-list.component.scss'
})
export class ClientesListComponent implements OnInit {
  private fb = inject(FormBuilder);
  private clienteService = inject(ClienteService);

  // Todas las clientes cargadas (en memoria)
  todosLosClientes: Cliente[] = [];
  // Clientes filtrados (los que se muestran)
  clientes: Cliente[] = [];
  isLoading = false;
  errorMessage = '';
  showEditModal = false;
  selectedCliente: Cliente | null = null;
  clienteForm: FormGroup;
  isSubmitting = false;
  showDeleteConfirm = false;
  clienteToDelete: Cliente | null = null;
  
  // Filtros
  filtroTexto: string = '';
  mostrarFiltros = false;

  constructor() {
    this.clienteForm = this.fb.group({
      numeroIdentificacion: [{ value: '', disabled: true }],
      nombre: ['', [Validators.required, this.nameValidator]],
      apPaterno: ['', [Validators.required, this.nameValidator]],
      apMaterno: ['', [Validators.required, this.nameValidator]],
      email: ['', [Validators.required, Validators.email]],
      telefono: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      direccion: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.loadClientes();
  }

  nameValidator(control: any) {
    if (!control.value) return null;
    const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/;
    return nameRegex.test(control.value) ? null : { invalidName: true };
  }

  loadClientes() {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.clienteService.getAll().subscribe({
      next: (response) => {
        if (response.success) {
          this.todosLosClientes = response.data;
          this.clientes = response.data; // Mostrar todos por defecto
        } else {
          this.errorMessage = response.message || 'Error al cargar los clientes';
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar clientes:', error);
        this.errorMessage = 'Error al cargar los clientes. Intenta nuevamente.';
        this.isLoading = false;
      }
    });
  }

  selectCliente(cliente: Cliente) {
    this.selectedCliente = cliente;
    this.clienteForm.patchValue({
      numeroIdentificacion: cliente.numeroIdentificacion,
      nombre: cliente.nombre,
      apPaterno: cliente.apPaterno,
      apMaterno: cliente.apMaterno,
      email: cliente.email,
      telefono: cliente.telefono,
      direccion: cliente.direccion
    });
    this.showEditModal = true;
  }

  closeEditModal() {
    this.showEditModal = false;
    this.selectedCliente = null;
    this.clienteForm.reset();
  }

  onSubmit() {
    if (this.clienteForm.valid && this.selectedCliente) {
      this.isSubmitting = true;
      this.errorMessage = '';

      const formValue = this.clienteForm.getRawValue(); // getRawValue() para obtener valores de campos disabled
      const updateData: UpdateClienteRequest = {
        id: this.selectedCliente.id,
        numeroIdentificacion: formValue.numeroIdentificacion, // Incluir el número de identificación
        nombre: formValue.nombre.trim(),
        apPaterno: formValue.apPaterno.trim(),
        apMaterno: formValue.apMaterno.trim(),
        email: formValue.email.trim().toLowerCase(),
        telefono: formValue.telefono.trim(),
        direccion: formValue.direccion.trim()
      };

      this.clienteService.update(this.selectedCliente.id, updateData).subscribe({
        next: (response) => {
          if (response.success) {
            // Actualizar el cliente en ambas listas
            const indexClientes = this.clientes.findIndex(c => c.id === this.selectedCliente!.id);
            const indexTodos = this.todosLosClientes.findIndex(c => c.id === this.selectedCliente!.id);
            
            if (indexClientes !== -1) {
              this.clientes[indexClientes] = response.data;
            }
            if (indexTodos !== -1) {
              this.todosLosClientes[indexTodos] = response.data;
            }
            this.closeEditModal();
          } else {
            this.errorMessage = response.message || 'Error al actualizar el cliente';
            this.isSubmitting = false;
          }
        },
        error: (error) => {
          console.error('Error al actualizar cliente:', error);
          const errorMsg = error.error?.message || 
                          error.error?.errors?.[0] || 
                          'Error al actualizar el cliente. Intenta nuevamente.';
          this.errorMessage = errorMsg;
          this.isSubmitting = false;
        }
      });
    } else {
      this.clienteForm.markAllAsTouched();
    }
  }

  confirmDelete(cliente: Cliente, event: Event) {
    event.stopPropagation();
    this.clienteToDelete = cliente;
    this.showDeleteConfirm = true;
  }

  cancelDelete() {
    this.showDeleteConfirm = false;
    this.clienteToDelete = null;
  }

  deleteCliente() {
    if (this.clienteToDelete) {
      this.isLoading = true;
      this.clienteService.delete(this.clienteToDelete.id).subscribe({
        next: (response) => {
          if (response.success) {
            // Eliminar de ambas listas
            this.clientes = this.clientes.filter(c => c.id !== this.clienteToDelete!.id);
            this.todosLosClientes = this.todosLosClientes.filter(c => c.id !== this.clienteToDelete!.id);
            this.showDeleteConfirm = false;
            this.clienteToDelete = null;
          } else {
            this.errorMessage = response.message || 'Error al eliminar el cliente';
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error al eliminar cliente:', error);
          this.errorMessage = error.error?.message || 'Error al eliminar el cliente. Intenta nuevamente.';
          this.isLoading = false;
        }
      });
    }
  }

  // Filtrado local (en memoria)
  aplicarFiltros() {
    this.errorMessage = '';
    
    if (!this.filtroTexto || this.filtroTexto.trim() === '') {
      // Si no hay texto, mostrar todos
      this.clientes = [...this.todosLosClientes];
      return;
    }

    const textoBusqueda = this.filtroTexto.trim().toLowerCase();
    
    // Filtrar por nombre, correo o número de identificación
    this.clientes = this.todosLosClientes.filter(cliente => {
      const nombreCompleto = cliente.nombreCompleto?.toLowerCase() || '';
      const email = cliente.email?.toLowerCase() || '';
      const numeroIdentificacion = cliente.numeroIdentificacion?.toLowerCase() || '';
      
      return nombreCompleto.includes(textoBusqueda) ||
             email.includes(textoBusqueda) ||
             numeroIdentificacion.includes(textoBusqueda);
    });

    // Mostrar mensaje si no hay resultados
    if (this.clientes.length === 0) {
      this.errorMessage = 'No se encontraron clientes con los criterios de búsqueda.';
    }
  }

  limpiarFiltros() {
    this.filtroTexto = '';
    this.clientes = [...this.todosLosClientes];
    this.errorMessage = '';
  }

  toggleFiltros() {
    this.mostrarFiltros = !this.mostrarFiltros;
  }

  // Actualizar lista cuando se modifica o elimina un cliente
  actualizarListaClientes() {
    this.todosLosClientes = [...this.clientes];
  }

  get nombre() { return this.clienteForm.get('nombre'); }
  get apPaterno() { return this.clienteForm.get('apPaterno'); }
  get apMaterno() { return this.clienteForm.get('apMaterno'); }
  get email() { return this.clienteForm.get('email'); }
  get telefono() { return this.clienteForm.get('telefono'); }
  get direccion() { return this.clienteForm.get('direccion'); }
}
