import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Store } from '@ngxs/store';
import { forkJoin } from 'rxjs';
import { Subscription } from 'rxjs';
import { AuthState } from '../../../store/auth.state';
import { ClienteService } from '../../../core/services/cliente.service';
import { PolizaService } from '../../../core/services/poliza.service';
import { PolizaEventsService } from '../../../core/services/poliza-events.service';
import { EstatusPoliza } from '../../../core/models/seguros.models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit, OnDestroy {
  private store = inject(Store);
  private clienteService = inject(ClienteService);
  private polizaService = inject(PolizaService);
  private polizaEventsService = inject(PolizaEventsService);
  private polizaChangedSubscription?: Subscription;
  
  user: any = null;
  isLoading = false;
  stats = {
    totalClientes: 0,
    totalPolizas: 0,
    polizasVigentes: 0,
    polizasCanceladas: 0
  };

  ngOnInit() {
    this.user = this.store.selectSnapshot(AuthState.user);
    this.loadEstadisticas();

    // Suscribirse a cambios en pólizas para actualizar estadísticas
    this.polizaChangedSubscription = this.polizaEventsService.polizaChanged$.subscribe(() => {
      this.loadEstadisticas();
    });
  }

  ngOnDestroy() {
    if (this.polizaChangedSubscription) {
      this.polizaChangedSubscription.unsubscribe();
    }
  }

  loadEstadisticas() {
    this.isLoading = true;
    
    // Cargar clientes y todas las pólizas (vigentes y canceladas) en paralelo
    forkJoin({
      clientes: this.clienteService.getAll(),
      polizasVigentes: this.polizaService.getByEstatus(EstatusPoliza.Vigente),
      polizasCanceladas: this.polizaService.getByEstatus(EstatusPoliza.Cancelada)
    }).subscribe({
      next: ({ clientes, polizasVigentes, polizasCanceladas }) => {
        if (clientes.success) {
          this.stats.totalClientes = clientes.data.length;
        }
        
        const todasLasPolizas: any[] = [];
        
        if (polizasVigentes.success) {
          todasLasPolizas.push(...polizasVigentes.data);
        }
        
        if (polizasCanceladas.success) {
          todasLasPolizas.push(...polizasCanceladas.data);
        }
        
        this.stats.totalPolizas = todasLasPolizas.length;
        this.stats.polizasVigentes = polizasVigentes.success ? polizasVigentes.data.length : 0;
        this.stats.polizasCanceladas = polizasCanceladas.success ? polizasCanceladas.data.length : 0;
        
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar estadísticas:', error);
        this.isLoading = false;
      }
    });
  }
}
