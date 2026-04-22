import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './navbar/navbar';
import { SidebarComponent } from './sidebar/sidebar';
import { ToastContainerComponent } from '../shared/components/toast-container/toast-container';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, SidebarComponent, ToastContainerComponent],
  template: `
    <app-navbar (toggleSidebar)="sidebarCollapsed.set(!sidebarCollapsed())" />
    <app-sidebar [collapsed]="sidebarCollapsed()" />
    <main class="main-content" [class.sidebar-collapsed]="sidebarCollapsed()">
      <div class="content-wrapper">
        <router-outlet />
      </div>
    </main>
    <app-toast-container />
  `,
  styles: [`
    .main-content {
      margin-top: calc(var(--navbar-height) + 38px);
      margin-left: var(--sidebar-width);
      min-height: calc(100vh - var(--navbar-height) - 38px);
      transition: margin-left var(--transition-normal);
      background: var(--bg-primary);
    }
    .main-content.sidebar-collapsed {
      margin-left: var(--sidebar-collapsed-width);
    }
    .content-wrapper {
      padding: 28px;
      max-width: 1600px;
      animation: fadeInUp 0.3s ease;
    }
    @media (max-width: 1024px) {
      .content-wrapper { padding: 20px; }
    }
    @media (max-width: 768px) {
      .main-content { margin-left: 0 !important; }
      .content-wrapper { padding: 16px; }
    }
  `]
})
export class LayoutComponent {
  sidebarCollapsed = signal(false);
}
