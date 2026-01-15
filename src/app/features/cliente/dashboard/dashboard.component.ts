import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Store } from '@ngxs/store';
import { AuthState } from '../../../store/auth.state';
import { PolizaService } from '../../../core/services/poliza.service';
import { ClienteService } from '../../../core/services/cliente.service';
import { PolizaEventsService } from '../../../core/services/poliza-events.service';
import { EstatusPoliza } from '../../../core/models/seguros.models';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit, OnDestroy {
  private store = inject(Store);
  private polizaService = inject(PolizaService);
  private clienteService = inject(ClienteService);
  private polizaEventsService = inject(PolizaEventsService);
  private polizaChangedSubscription?: Subscription;
  
  user: any = null;
  clienteId: number | null = null;
  isLoading = false;
  stats = {
    polizasVigentes: 0,
    polizasCanceladas: 0,
    totalPolizas: 0
  };

  ngOnInit() {
    this.user = this.store.selectSnapshot(AuthState.user);
    if (this.user?.id) {
      this.loadClienteYEstadisticas();
    }

    // Suscribirse a cambios en pólizas para actualizar estadísticas
    this.polizaChangedSubscription = this.polizaEventsService.polizaChanged$.subscribe(() => {
      if (this.clienteId) {
        this.loadEstadisticas();
      }
    });
  }

  ngOnDestroy() {
    if (this.polizaChangedSubscription) {
      this.polizaChangedSubscription.unsubscribe();
    }
  }

  loadClienteYEstadisticas() {
    this.isLoading = true;
    
    // Obtener el cliente usando el userId (el endpoint /api/Clientes/{id} ahora recibe userId)
    this.clienteService.getByUserId(this.user.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.clienteId = response.data.id;
          this.loadEstadisticas();
        } else {
          this.isLoading = false;
        }
      },
      error: (error) => {
        console.error('Error al cargar cliente:', error);
        this.isLoading = false;
      }
    });
  }

  loadEstadisticas() {
    if (!this.clienteId) {
      this.isLoading = false;
      return;
    }

    // Cargar todas las pólizas del cliente
    this.polizaService.getByClienteId(this.clienteId).subscribe({
      next: (response) => {
        if (response.success) {
          const polizas = response.data;
          
          this.stats.totalPolizas = polizas.length;
          this.stats.polizasVigentes = polizas.filter(p => p.estatus === EstatusPoliza.Vigente).length;
          this.stats.polizasCanceladas = polizas.filter(p => p.estatus === EstatusPoliza.Cancelada).length;
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar estadísticas:', error);
        this.isLoading = false;
      }
    });
  }
}
