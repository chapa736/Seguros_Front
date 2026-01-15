import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngxs/store';
import { AuthState } from '../../../store/auth.state';
import { PolizaService } from '../../../core/services/poliza.service';
import { ClienteService } from '../../../core/services/cliente.service';
import { PolizaEventsService } from '../../../core/services/poliza-events.service';
import { Poliza, EstatusPoliza, TipoPoliza } from '../../../core/models/seguros.models';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-mis-polizas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mis-polizas.component.html',
  styleUrl: './mis-polizas.component.scss'
})
export class MisPolizasComponent implements OnInit, OnDestroy {
  private store = inject(Store);
  private polizaService = inject(PolizaService);
  private clienteService = inject(ClienteService);
  private polizaEventsService = inject(PolizaEventsService);
  private polizaChangedSubscription?: Subscription;

  user: any = null;
  clienteId: number | null = null;
  polizas: Poliza[] = [];
  todasLasPolizas: Poliza[] = [];
  isLoading = false;
  errorMessage = '';
  showCancelConfirm = false;
  polizaToCancel: Poliza | null = null;

  filtroTipo: TipoPoliza | null = null;
  filtroEstatus: EstatusPoliza | null = null;

  // Exponer el enum para usar en el template
  EstatusPoliza = EstatusPoliza;

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

  ngOnInit() {
    this.user = this.store.selectSnapshot(AuthState.user);
    if (this.user?.id) {
      this.loadClienteYPolizas();
    }

    // Suscribirse a cambios en pólizas
    this.polizaChangedSubscription = this.polizaEventsService.polizaChanged$.subscribe(() => {
      if (this.clienteId) {
        this.loadPolizas();
      }
    });
  }

  ngOnDestroy() {
    if (this.polizaChangedSubscription) {
      this.polizaChangedSubscription.unsubscribe();
    }
  }

  loadClienteYPolizas() {
    this.isLoading = true;
    this.errorMessage = '';
    
    // Obtener el cliente usando el userId (el endpoint /api/Clientes/{id} ahora recibe userId)
    this.clienteService.getByUserId(this.user.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.clienteId = response.data.id;
          this.loadPolizas();
        } else {
          this.errorMessage = response.message || 'Error al cargar la información del cliente';
          this.isLoading = false;
        }
      },
      error: (error) => {
        console.error('Error al cargar cliente:', error);
        this.errorMessage = 'Error al cargar la información del cliente. Intenta nuevamente.';
        this.isLoading = false;
      }
    });
  }

  loadPolizas() {
    if (!this.clienteId) {
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.polizaService.getByClienteId(this.clienteId).subscribe({
      next: (response) => {
        if (response.success) {
          this.todasLasPolizas = response.data;
          this.aplicarFiltros();
        } else {
          this.errorMessage = response.message || 'Error al cargar las pólizas';
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar pólizas:', error);
        this.errorMessage = 'Error al cargar las pólizas. Intenta nuevamente.';
        this.isLoading = false;
      }
    });
  }

  getTipoPolizaLabel(tipo: TipoPoliza): string {
    const tipos: { [key: number]: string } = {
      [TipoPoliza.Vida]: 'Vida',
      [TipoPoliza.Automovil]: 'Automóvil',
      [TipoPoliza.Hogar]: 'Hogar',
      [TipoPoliza.Salud]: 'Salud'
    };
    return tipos[tipo] || 'Desconocido';
  }

  getEstatusLabel(estatus: EstatusPoliza): string {
    return estatus === EstatusPoliza.Vigente ? 'Activa' : 'Cancelada';
  }

  getEstatusClass(estatus: EstatusPoliza): string {
    return estatus === EstatusPoliza.Vigente ? 'status-active' : 'status-cancelled';
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    
    try {
      // Parsear la fecha considerando diferentes formatos
      let date: Date;
      
      // Si viene en formato ISO (YYYY-MM-DD o YYYY-MM-DDTHH:mm:ss)
      if (dateString.includes('T')) {
        date = new Date(dateString);
      } else if (dateString.includes('-')) {
        // Formato YYYY-MM-DD - parsear manualmente para evitar problemas de zona horaria
        const parts = dateString.split('-');
        if (parts.length === 3) {
          const year = parseInt(parts[0]);
          const month = parseInt(parts[1]) - 1; // Los meses en JS son 0-indexed
          const day = parseInt(parts[2]);
          date = new Date(year, month, day);
        } else {
          date = new Date(dateString);
        }
      } else {
        date = new Date(dateString);
      }
      
      // Verificar que la fecha es válida
      if (isNaN(date.getTime())) return dateString;
      
      // Formatear como dd/mm/yyyy usando la zona horaria local
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (error) {
      console.error('Error al formatear fecha:', error, dateString);
      return dateString;
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  }

  confirmCancel(poliza: Poliza, event: Event) {
    event.stopPropagation();
    if (poliza.estatus === EstatusPoliza.Vigente) {
      this.polizaToCancel = poliza;
      this.showCancelConfirm = true;
    }
  }

  cancelCancel() {
    this.showCancelConfirm = false;
    this.polizaToCancel = null;
  }

  cancelarPoliza() {
    if (this.polizaToCancel && this.polizaToCancel.id) {
      this.isLoading = true;
      this.errorMessage = '';
      
      // Usar el endpoint específico para cancelar pólizas
      this.polizaService.cancelar(this.polizaToCancel.id).subscribe({
        next: (response) => {
          if (response.success) {
            // El servicio ya notificó el cambio, solo cerrar el modal
            this.showCancelConfirm = false;
            this.polizaToCancel = null;
            // loadPolizas se ejecutará automáticamente por la suscripción
          } else {
            this.errorMessage = response.message || 'Error al cancelar la póliza';
            this.isLoading = false;
          }
        },
        error: (error) => {
          console.error('Error al cancelar póliza:', error);
          this.errorMessage = error.error?.message || 'Error al cancelar la póliza. Intenta nuevamente.';
          this.isLoading = false;
        }
      });
    }
  }

  aplicarFiltros() {
    let polizasFiltradas = [...this.todasLasPolizas];

    if (this.filtroTipo !== null) {
      polizasFiltradas = polizasFiltradas.filter(p => p.tipoPoliza === Number(this.filtroTipo));
    }

    if (this.filtroEstatus !== null) {
      polizasFiltradas = polizasFiltradas.filter(p => p.estatus === Number(this.filtroEstatus));
    }

    this.polizas = polizasFiltradas;
  }

  limpiarFiltros() {
    this.filtroTipo = null;
    this.filtroEstatus = null;
    this.polizas = [...this.todasLasPolizas];
  }
}
