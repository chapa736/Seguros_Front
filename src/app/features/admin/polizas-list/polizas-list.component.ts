import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { PolizaService } from '../../../core/services/poliza.service';
import { ClienteService } from '../../../core/services/cliente.service';
import { Poliza, TipoPoliza, EstatusPoliza, Cliente, ApiResponse } from '../../../core/models/seguros.models';
import { DateInputComponent } from '../../../shared/components/date-input/date-input.component';

@Component({
  selector: 'app-polizas-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, DateInputComponent],
  templateUrl: './polizas-list.component.html',
  styleUrl: './polizas-list.component.scss'
})
export class PolizasListComponent implements OnInit {
  private polizaService = inject(PolizaService);
  private clienteService = inject(ClienteService);

  // Todas las pólizas cargadas (en memoria)
  todasLasPolizas: Poliza[] = [];
  // Pólizas filtradas (las que se muestran)
  polizas: Poliza[] = [];
  clientes: Cliente[] = [];
  isLoading = false;
  errorMessage = '';
  
  // Filtros
  filtroId: number | null = null;
  filtroCliente: number | null = null;
  filtroTipo: TipoPoliza | null = null;
  filtroEstatus: EstatusPoliza | null = null;
  filtroFechaInicio: string = '';
  filtroFechaFin: string = '';
  mostrarFiltros = false;

  // Opciones para los filtros
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
    this.loadTodasLasPolizas();
    this.loadClientes();
  }

  // Cargar todas las pólizas del backend (vigentes y canceladas)
  loadTodasLasPolizas() {
    this.isLoading = true;
    this.errorMessage = '';
    
    // Cargar pólizas vigentes y canceladas en paralelo
    forkJoin({
      vigentes: this.polizaService.getByEstatus(EstatusPoliza.Vigente),
      canceladas: this.polizaService.getByEstatus(EstatusPoliza.Cancelada)
    }).subscribe({
      next: ({ vigentes, canceladas }) => {
        const todasLasPolizas: Poliza[] = [];
        
        if (vigentes.success) {
          todasLasPolizas.push(...vigentes.data);
        }
        
        if (canceladas.success) {
          todasLasPolizas.push(...canceladas.data);
        }
        
        this.todasLasPolizas = todasLasPolizas;
        this.polizas = todasLasPolizas; // Mostrar todas por defecto
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar pólizas:', error);
        this.errorMessage = 'Error al cargar las pólizas. Intenta nuevamente.';
        this.isLoading = false;
      }
    });
  }

  // Cargar solo pólizas vigentes (para el botón "Ver Vigentes")
  loadPolizas() {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.polizaService.getVigentes().subscribe({
      next: (response) => {
        if (response.success) {
          this.todasLasPolizas = response.data;
          this.polizas = response.data;
          // Limpiar filtros cuando se cargan vigentes
          this.limpiarFiltros();
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

  loadClientes() {
    this.clienteService.getAll().subscribe({
      next: (response) => {
        if (response.success) {
          this.clientes = response.data;
        }
      },
      error: (error) => {
        console.error('Error al cargar clientes:', error);
      }
    });
  }

  getClienteNombre(idCliente: number): string {
    const cliente = this.clientes.find(c => c.id === idCliente);
    return cliente ? cliente.nombreCompleto : `Cliente #${idCliente}`;
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

  // Filtrado local (en memoria)
  aplicarFiltros() {
    this.errorMessage = '';
    
    // Empezar con todas las pólizas
    let polizasFiltradas = [...this.todasLasPolizas];

    // Aplicar filtro por ID (tiene prioridad)
    if (this.filtroId !== null && this.filtroId > 0) {
      polizasFiltradas = polizasFiltradas.filter(p => p.id === Number(this.filtroId));
    }

    // Aplicar filtro por Cliente (solo si no es null y es un número válido)
    if (this.filtroCliente !== null && this.filtroCliente !== undefined) {
      const clienteId = Number(this.filtroCliente);
      if (!isNaN(clienteId) && clienteId > 0) {
        polizasFiltradas = polizasFiltradas.filter(p => p.idCliente === clienteId);
      }
    }

    // Aplicar filtro por Tipo (solo si no es null)
    if (this.filtroTipo !== null && this.filtroTipo !== undefined) {
      const tipo = Number(this.filtroTipo);
      if (!isNaN(tipo)) {
        polizasFiltradas = polizasFiltradas.filter(p => p.tipoPoliza === tipo);
      }
    }

    // Aplicar filtro por Estatus (solo si no es null)
    if (this.filtroEstatus !== null && this.filtroEstatus !== undefined) {
      const estatus = Number(this.filtroEstatus);
      if (!isNaN(estatus)) {
        polizasFiltradas = polizasFiltradas.filter(p => p.estatus === estatus);
      }
    }

    // Aplicar filtro por rango de fechas (fecha de inicio)
    if (this.filtroFechaInicio && this.filtroFechaInicio.trim() !== '') {
      const fechaInicio = new Date(this.filtroFechaInicio);
      fechaInicio.setHours(0, 0, 0, 0);
      polizasFiltradas = polizasFiltradas.filter(p => {
        const fechaPoliza = new Date(p.fechaInicio);
        fechaPoliza.setHours(0, 0, 0, 0);
        return fechaPoliza >= fechaInicio;
      });
    }

    // Aplicar filtro por rango de fechas (fecha fin)
    if (this.filtroFechaFin && this.filtroFechaFin.trim() !== '') {
      const fechaFin = new Date(this.filtroFechaFin);
      fechaFin.setHours(23, 59, 59, 999);
      polizasFiltradas = polizasFiltradas.filter(p => {
        const fechaPoliza = new Date(p.fechaInicio);
        fechaPoliza.setHours(0, 0, 0, 0);
        return fechaPoliza <= fechaFin;
      });
    }

    // Actualizar la lista de pólizas mostradas
    this.polizas = polizasFiltradas;

    // Verificar si hay filtros activos realmente aplicados
    const tieneFiltrosActivos = 
      (this.filtroId !== null && this.filtroId > 0) ||
      (this.filtroCliente !== null && this.filtroCliente !== undefined && Number(this.filtroCliente) > 0) ||
      (this.filtroTipo !== null && this.filtroTipo !== undefined && !isNaN(Number(this.filtroTipo))) ||
      (this.filtroEstatus !== null && this.filtroEstatus !== undefined && !isNaN(Number(this.filtroEstatus))) ||
      (this.filtroFechaInicio && this.filtroFechaInicio.trim() !== '') ||
      (this.filtroFechaFin && this.filtroFechaFin.trim() !== '');

    // Mostrar mensaje solo si hay filtros activos y no hay resultados
    if (this.polizas.length === 0 && tieneFiltrosActivos) {
      this.errorMessage = 'No se encontraron pólizas con los filtros aplicados.';
    } else {
      this.errorMessage = '';
    }
  }

  limpiarFiltros() {
    this.filtroId = null;
    this.filtroCliente = null;
    this.filtroTipo = null;
    this.filtroEstatus = null;
    this.filtroFechaInicio = '';
    this.filtroFechaFin = '';
    // Mostrar todas las pólizas en memoria
    this.polizas = [...this.todasLasPolizas];
    this.errorMessage = '';
  }

  // Métodos para manejar cambios en los selects y convertir strings a null
  onFiltroClienteChange(value: any): void {
    if (value === 'null' || value === null || value === undefined || value === '') {
      this.filtroCliente = null;
    } else {
      this.filtroCliente = Number(value);
    }
    this.aplicarFiltros();
  }

  onFiltroTipoChange(value: any): void {
    if (value === 'null' || value === null || value === undefined || value === '') {
      this.filtroTipo = null;
    } else {
      this.filtroTipo = Number(value) as TipoPoliza;
    }
    this.aplicarFiltros();
  }

  onFiltroEstatusChange(value: any): void {
    if (value === 'null' || value === null || value === undefined || value === '') {
      this.filtroEstatus = null;
    } else {
      this.filtroEstatus = Number(value) as EstatusPoliza;
    }
    this.aplicarFiltros();
  }

  toggleFiltros() {
    this.mostrarFiltros = !this.mostrarFiltros;
  }
}
