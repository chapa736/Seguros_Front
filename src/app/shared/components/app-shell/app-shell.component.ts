import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { Store } from '@ngxs/store';
import { AuthState } from '../../../store/auth.state';
import { NavbarComponent } from '../navbar/navbar.component';
import { LeftSidebarComponent } from '../left-sidebar/left-sidebar.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent, LeftSidebarComponent],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.scss'
})
export class AppShellComponent {
  private store = inject(Store);

  isSidebarCollapsed = false;

  get isAdmin() {
    const user = this.store.selectSnapshot(AuthState.user) as any;
    return user?.roles?.some((r: any) => r.nombre === 'ADMINISTRADOR') ?? false;
  }

  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }
}

