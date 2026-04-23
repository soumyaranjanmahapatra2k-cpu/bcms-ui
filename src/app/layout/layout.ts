import { Component, signal, inject } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
    <!-- Mobile backdrop: covers content area when sidebar is open; click closes it -->
    <div class="sidebar-backdrop"
         [class.open]="!sidebarCollapsed()"
         (click)="sidebarCollapsed.set(true)"
         aria-hidden="true"></div>
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
    /* Backdrop is hidden on desktop — only activates on mobile */
    .sidebar-backdrop { display: none; }
    @media (max-width: 1024px) {
      .content-wrapper { padding: 20px; }
    }
    @media (max-width: 768px) {
      .main-content { margin-left: 0 !important; }
      .content-wrapper { padding: 16px; }
      .sidebar-backdrop {
        display: block;
        position: fixed;
        inset: 0;
        /* below sidebar (z-index 90) so clicks on the sidebar itself don't hit it;
           above main content so the whole background is tappable */
        z-index: 89;
        background: rgba(0, 0, 0, 0.45);
        opacity: 0;
        pointer-events: none;
        transition: opacity var(--transition-normal);
      }
      .sidebar-backdrop.open {
        opacity: 1;
        pointer-events: auto;
      }
    }
  `]
})
export class LayoutComponent {
  sidebarCollapsed = signal(false);
  private router = inject(Router);

  constructor() {
    // Auto-close sidebar on any navigation while in mobile viewport.
    // takeUntilDestroyed() cleans up the subscription automatically.
    this.router.events
      .pipe(
        filter(e => e instanceof NavigationEnd),
        takeUntilDestroyed()
      )
      .subscribe(() => {
        if (window.innerWidth <= 768) {
          this.sidebarCollapsed.set(true);
        }
      });
  }
}
