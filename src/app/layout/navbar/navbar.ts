import { Component, inject, output, signal, computed } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { MockDataService } from '../../core/services/mock-data.service';
import { NavigationService } from '../../core/services/navigation.service';
import { TooltipDirective } from '../../shared/directives/tooltip.directive';
import { GlobalSearchComponent } from '../../shared/components/global-search/global-search';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, TooltipDirective, GlobalSearchComponent],
  template: `
    <nav class="navbar">
      <div class="navbar-left">
        <button class="btn-icon sidebar-toggle" (click)="toggleSidebar.emit()" appTooltip="Toggle sidebar" tooltipPosition="bottom">
          <span class="material-icons-outlined">menu</span>
        </button>
        <a routerLink="/dashboard" class="navbar-brand">
          <div class="brand-logo">
            <span class="material-icons-outlined">business_center</span>
          </div>
          <div class="brand-text">
            <span class="brand-name">BCMS</span>
            <span class="brand-sub">Business Case Management</span>
          </div>
        </a>
      </div>

      <div class="navbar-center">
        <app-global-search />
      </div>

      <div class="navbar-right">
        <button class="btn-icon theme-toggle" (click)="themeService.toggle()" appTooltip="Switch to {{ themeService.theme() === 'light' ? 'dark' : 'light' }} mode" tooltipPosition="bottom">
          <span class="material-icons-outlined theme-icon">{{ themeService.theme() === 'light' ? 'dark_mode' : 'light_mode' }}</span>
        </button>
        <button class="btn-icon notification-btn" routerLink="/notifications" appTooltip="Notifications" tooltipPosition="bottom">
          <span class="material-icons-outlined">notifications_none</span>
          @if (unreadCount() > 0) {
            <span class="notif-badge">{{ unreadCount() > 9 ? '9+' : unreadCount() }}</span>
          }
        </button>
        <div class="nav-divider"></div>
        <div class="user-menu" (click)="showMenu.set(!showMenu())">
          <div class="user-avatar">{{ initials() }}</div>
          <div class="user-info">
            <span class="user-name">{{ auth.user()?.fullName }}</span>
            <span class="user-role">{{ auth.user()?.roles?.[0] }}</span>
          </div>
          <span class="material-icons-outlined chevron" [class.rotated]="showMenu()">expand_more</span>
          @if (showMenu()) {
            <div class="dropdown-menu" (click)="$event.stopPropagation()">
              <div class="dropdown-header">
                <div class="dropdown-avatar">{{ initials() }}</div>
                <div class="dropdown-user-info">
                  <strong>{{ auth.user()?.fullName }}</strong>
                  <span>{{ auth.user()?.email }}</span>
                </div>
              </div>
              <div class="dropdown-divider"></div>
              <button class="dropdown-item" (click)="logout()">
                <span class="material-icons-outlined">logout</span> Sign Out
              </button>
            </div>
          }
        </div>
      </div>
    </nav>
    <!-- Breadcrumb bar -->
    @if (nav.breadcrumbs().length > 0) {
      <div class="breadcrumb-bar">
        @if (nav.canGoBack) {
          <button class="back-btn" (click)="nav.goBack()" appTooltip="Go back">
            <span class="material-icons-outlined">arrow_back</span>
          </button>
        }
        <nav class="breadcrumbs">
          @for (crumb of nav.breadcrumbs(); track crumb.url; let last = $last) {
            @if (last) {
              <span class="crumb current">
                @if (crumb.icon) { <span class="material-icons-outlined crumb-icon">{{ crumb.icon }}</span> }
                {{ crumb.label }}
              </span>
            } @else {
              <a class="crumb" [routerLink]="crumb.url">
                @if (crumb.icon) { <span class="material-icons-outlined crumb-icon">{{ crumb.icon }}</span> }
                {{ crumb.label }}
              </a>
              <span class="material-icons-outlined crumb-sep">chevron_right</span>
            }
          }
        </nav>
      </div>
    }
    @if (showMenu()) {
      <div class="menu-backdrop" (click)="showMenu.set(false)"></div>
    }
  `,
  styles: [`
    .navbar {
      height: var(--navbar-height);
      background: var(--bg-navbar);
      border-bottom: 1px solid var(--border-color-card);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 20px;
      position: fixed;
      top: 0; left: 0; right: 0;
      z-index: 100;
      box-shadow: var(--shadow-navbar);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      transition: background var(--transition-normal), box-shadow var(--transition-normal);
    }
    .navbar-left { display: flex; align-items: center; gap: 12px; flex-shrink: 0; }
    .navbar-center { flex: 1; display: flex; justify-content: center; padding: 0 20px; max-width: 520px; margin: 0 auto; }
    .navbar-brand {
      display: flex; align-items: center; gap: 10px;
      text-decoration: none; color: var(--text-primary);
    }
    .brand-logo {
      width: 36px; height: 36px;
      background: var(--color-primary);
      border-radius: var(--radius-md);
      display: flex; align-items: center; justify-content: center;
      color: var(--text-inverse);
      transition: transform var(--transition-fast);
      .material-icons-outlined { font-size: 20px; }
    }
    .navbar-brand:hover .brand-logo { transform: scale(1.05); }
    .brand-text { display: flex; flex-direction: column; }
    .brand-name { font-weight: 800; font-size: 1.05rem; line-height: 1.1; letter-spacing: -0.02em; }
    .brand-sub { font-size: 0.643rem; color: var(--text-muted); line-height: 1; letter-spacing: 0.02em; }
    .navbar-right { display: flex; align-items: center; gap: 4px; flex-shrink: 0; }
    .nav-divider { width: 1px; height: 28px; background: var(--border-color); margin: 0 8px; }
    .theme-toggle {
      .theme-icon { transition: transform var(--transition-normal); }
      &:hover .theme-icon { transform: rotate(30deg); }
    }
    .notification-btn { position: relative; }
    .notif-badge {
      position: absolute; top: 0; right: 0;
      background: var(--color-danger); color: #fff;
      font-size: 0.6rem; font-weight: 800;
      min-width: 18px; height: 18px;
      border-radius: 9px;
      display: flex; align-items: center; justify-content: center;
      padding: 0 4px;
      box-shadow: 0 0 0 2px var(--bg-navbar);
      animation: bounceIn 0.3s ease;
    }
    .user-menu {
      display: flex; align-items: center; gap: 10px;
      cursor: pointer; position: relative;
      padding: 6px 12px; border-radius: var(--radius-lg);
      transition: background var(--transition-fast);
    }
    .user-menu:hover { background: var(--bg-hover); }
    .user-avatar {
      width: 34px; height: 34px; border-radius: var(--radius-md);
      background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
      color: var(--text-inverse);
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 0.786rem;
      letter-spacing: 0.05em;
    }
    .user-info { display: flex; flex-direction: column; }
    .user-name { font-weight: 600; font-size: 0.857rem; line-height: 1.2; }
    .user-role { font-size: 0.714rem; color: var(--text-secondary); }
    .chevron {
      font-size: 18px; color: var(--text-muted);
      transition: transform var(--transition-fast);
    }
    .chevron.rotated { transform: rotate(180deg); }
    .dropdown-menu {
      position: absolute; top: calc(100% + 8px); right: 0;
      background: var(--bg-card);
      border: 1px solid var(--border-color-card);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-dropdown);
      min-width: 240px; z-index: 200;
      overflow: hidden;
      animation: fadeInDown 0.2s ease;
    }
    .dropdown-header {
      padding: 16px;
      display: flex; align-items: center; gap: 12px;
    }
    .dropdown-avatar {
      width: 40px; height: 40px; border-radius: var(--radius-md);
      background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
      color: var(--text-inverse);
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 0.857rem; flex-shrink: 0;
    }
    .dropdown-user-info { display: flex; flex-direction: column; overflow: hidden; }
    .dropdown-user-info strong { font-size: 0.857rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .dropdown-user-info span { font-size: 0.75rem; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .dropdown-divider { height: 1px; background: var(--border-color); margin: 0; }
    .dropdown-item {
      display: flex; align-items: center; gap: 10px;
      padding: 12px 16px; width: 100%;
      font-size: 0.857rem; color: var(--text-primary);
      cursor: pointer; background: none; border: none;
      transition: background var(--transition-fast);
      .material-icons-outlined { font-size: 18px; color: var(--text-secondary); }
    }
    .dropdown-item:hover { background: var(--bg-hover); }
    .menu-backdrop {
      position: fixed; inset: 0; z-index: 99;
    }
    /* Breadcrumb Bar */
    .breadcrumb-bar {
      position: fixed;
      top: var(--navbar-height);
      left: var(--sidebar-width);
      right: 0;
      height: 38px;
      background: var(--bg-card);
      border-bottom: 1px solid var(--border-color-card);
      display: flex;
      align-items: center;
      padding: 0 28px;
      gap: 8px;
      z-index: 95;
      transition: left var(--transition-normal);
    }
    :host-context(.sidebar-collapsed) .breadcrumb-bar {
      left: var(--sidebar-collapsed-width);
    }
    .back-btn {
      display: flex; align-items: center; justify-content: center;
      width: 28px; height: 28px;
      border: 1px solid var(--border-color-card); border-radius: var(--radius-md);
      background: var(--bg-hover); cursor: pointer;
      color: var(--text-secondary);
      transition: all var(--transition-fast);
      flex-shrink: 0;
    }
    .back-btn:hover { background: var(--color-primary-subtle); color: var(--color-primary); border-color: var(--color-primary-light); }
    .back-btn .material-icons-outlined { font-size: 16px; }
    .breadcrumbs { display: flex; align-items: center; gap: 4px; }
    .crumb {
      font-size: 0.786rem; font-weight: 500; color: var(--text-secondary);
      text-decoration: none; display: inline-flex; align-items: center; gap: 4px;
      padding: 2px 6px; border-radius: var(--radius-sm);
      transition: all var(--transition-fast);
    }
    a.crumb:hover { color: var(--color-primary); background: var(--color-primary-subtle); }
    .crumb.current { font-weight: 700; color: var(--text-primary); }
    .crumb-icon { font-size: 14px; }
    .crumb-sep { font-size: 14px; color: var(--text-muted); }
    @media (max-width: 768px) {
      .user-info, .brand-text { display: none; }
      .navbar { padding: 0 12px; }
      .navbar-center { padding: 0 8px; }
      .nav-divider { display: none; }
      .breadcrumb-bar { left: 0 !important; padding: 0 16px; }
    }
  `]
})
export class NavbarComponent {
  auth = inject(AuthService);
  themeService = inject(ThemeService);
  nav = inject(NavigationService);
  private mockData = inject(MockDataService);
  private router = inject(Router);

  toggleSidebar = output<void>();
  showMenu = signal(false);

  unreadCount = computed(() => { this.mockData.version(); return this.mockData.getUnreadCount(); });
  initials = computed(() => {
    const name = this.auth.user()?.fullName || '';
    return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  });

  logout() {
    this.showMenu.set(false);
    this.auth.logout();
  }
}
