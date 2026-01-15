import { Component, EventEmitter, Input, Output, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-left-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './left-sidebar.component.html',
  styleUrl: './left-sidebar.component.scss'
})
export class LeftSidebarComponent implements OnInit {
  @Input() isAdmin = false;
  @Input() isCollapsed = false;
  @Output() toggle = new EventEmitter<void>();
  
  private router = inject(Router);
  
  clientesExpanded = false;
  polizasExpanded = false;

  ngOnInit() {
    // Expandir submenús según la ruta actual
    this.updateExpandedStates();
    
    // Escuchar cambios de ruta para expandir/colapsar automáticamente
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.updateExpandedStates();
      });
  }

  updateExpandedStates() {
    const url = this.router.url;
    this.clientesExpanded = url.startsWith('/admin/clientes');
    this.polizasExpanded = url.startsWith('/admin/polizas');
  }

  toggleClientes() {
    this.clientesExpanded = !this.clientesExpanded;
    if (!this.clientesExpanded) {
      // Si se colapsa, navegar a la lista de clientes
      this.router.navigate(['/admin/clientes']);
    }
  }

  togglePolizas() {
    this.polizasExpanded = !this.polizasExpanded;
    if (!this.polizasExpanded) {
      // Si se colapsa, navegar a la lista de pólizas
      this.router.navigate(['/admin/polizas']);
    }
  }

  isRouteActive(route: string): boolean {
    return this.router.url.startsWith(route);
  }
}

