import { Component, inject, input, signal, computed } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { TooltipDirective } from '../../shared/directives/tooltip.directive';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  roles?: string[];
  children?: NavItem[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, TooltipDirective],
  template: `
    <aside class="sidebar" [class.collapsed]="collapsed()">
      <nav class="sidebar-nav">
        @for (item of visibleItems(); track item.route; let idx = $index) {
          @if (!item.children) {
            <a class="nav-item"
               [routerLink]="item.route"
               routerLinkActive="active"
               [routerLinkActiveOptions]="{ exact: item.route === '/dashboard' }"
               [appTooltip]="collapsed() ? item.label : ''"
               tooltipPosition="right"
               [style.animation-delay]="idx * 30 + 'ms'">
              <span class="material-icons-outlined nav-icon">{{ item.icon }}</span>
              @if (!collapsed()) {
                <span class="nav-label">{{ item.label }}</span>
              }
            </a>
          } @else {
            <div class="nav-group" [style.animation-delay]="idx * 30 + 'ms'">
              <button class="nav-item nav-group-toggle"
                      (click)="toggleGroup(item.label)"
                      [appTooltip]="collapsed() ? item.label : ''"
                      tooltipPosition="right">
                <span class="material-icons-outlined nav-icon">{{ item.icon }}</span>
                @if (!collapsed()) {
                  <span class="nav-label">{{ item.label }}</span>
                  <span class="material-icons-outlined nav-arrow" [class.expanded]="expandedGroups().has(item.label)">expand_more</span>
                }
              </button>
              @if (!collapsed() && expandedGroups().has(item.label)) {
                <div class="nav-children">
                  @for (child of item.children; track child.route; let ci = $index) {
                    <a class="nav-item child"
                       [routerLink]="child.route"
                       routerLinkActive="active"
                       [style.animation-delay]="ci * 40 + 'ms'">
                      <span class="material-icons-outlined nav-icon">{{ child.icon }}</span>
                      <span class="nav-label">{{ child.label }}</span>
                    </a>
                  }
                </div>
              }
            </div>
          }
        }
      </nav>
      <div class="sidebar-footer">
        @if (!collapsed()) {
          <div class="sidebar-version">BCMS v1.0</div>
        }
      </div>
    </aside>
  `,
  styles: [`
    .sidebar {
      width: var(--sidebar-width);
      height: calc(100vh - var(--navbar-height));
      position: fixed;
      top: var(--navbar-height); left: 0;
      background: var(--bg-sidebar);
      border-right: 1px solid var(--border-color-card);
      overflow-y: auto;
      overflow-x: hidden;
      transition: width var(--transition-normal);
      z-index: 90;
      padding: 12px 0 0;
      display: flex;
      flex-direction: column;
      box-shadow: var(--shadow-sidebar);
    }
    .sidebar.collapsed { width: var(--sidebar-collapsed-width); }
    .sidebar-nav {
      display: flex;
      flex-direction: column;
      gap: 2px;
      padding: 0 10px;
      flex: 1;
    }
    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 14px;
      border-radius: var(--radius-lg);
      color: var(--text-sidebar);
      text-decoration: none;
      transition: all var(--transition-fast);
      cursor: pointer;
      font-size: 0.857rem;
      font-weight: 500;
      background: none;
      border: none;
      width: 100%;
      text-align: left;
      position: relative;
      animation: fadeInLeft 0.3s ease backwards;
    }
    .nav-item:hover {
      background: var(--bg-sidebar-hover);
      color: var(--text-primary);
    }
    .nav-item.active {
      background: var(--bg-sidebar-active);
      color: var(--text-sidebar-active);
      font-weight: 700;
    }
    .nav-item.active .nav-icon {
      color: var(--text-sidebar-active);
    }
    .nav-icon {
      font-size: 20px;
      flex-shrink: 0;
      transition: color var(--transition-fast);
    }
    .nav-label {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .nav-arrow {
      margin-left: auto;
      font-size: 18px;
      transition: transform var(--transition-fast);
      color: var(--text-muted);
    }
    .nav-arrow.expanded { transform: rotate(180deg); }
    .nav-children {
      padding-left: 4px;
      animation: fadeIn 0.2s ease;
    }
    .nav-item.child {
      padding: 8px 14px 8px 24px;
      font-size: 0.857rem;
      margin-left: 8px;
      border-left: 2px solid var(--border-color);
      border-radius: 0 var(--radius-md) var(--radius-md) 0;
    }
    .nav-item.child.active {
      border-left-color: var(--color-primary);
    }
    .collapsed .nav-item {
      justify-content: center;
      padding: 10px;
    }
    .collapsed .nav-icon { font-size: 22px; }
    .sidebar-footer {
      padding: 12px 16px;
      border-top: 1px solid var(--border-color-card);
    }
    .sidebar-version {
      font-size: 0.679rem;
      color: var(--text-muted);
      text-align: center;
    }
    @media (max-width: 768px) {
      .sidebar {
        transform: translateX(-100%);
        transition: transform var(--transition-normal), width var(--transition-normal);
        box-shadow: var(--shadow-xl);
      }
      .sidebar:not(.collapsed) {
        transform: translateX(0);
        width: 280px;
      }
    }
  `]
})
export class SidebarComponent {
  private auth = inject(AuthService);
  collapsed = input(false);
  private expandedGroupsSet = signal(new Set<string>(['Administration']));
  expandedGroups = this.expandedGroupsSet;

  private navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'dashboard', route: '/dashboard' },
    { label: 'My Cases', icon: 'folder_open', route: '/cases', roles: ['SUBMITTER', 'ADMIN'] },
    { label: 'Create Case', icon: 'add_circle_outline', route: '/cases/create', roles: ['SUBMITTER', 'ADMIN'] },
    { label: 'Review Queue', icon: 'rate_review', route: '/review', roles: ['REVIEWER', 'ADMIN'] },
    { label: 'Approval Queue', icon: 'approval', route: '/approval', roles: ['APPROVER', 'ADMIN'] },
    { label: 'Reports', icon: 'bar_chart', route: '/reports', roles: ['MANAGEMENT', 'ADMIN', 'AUDITOR'] },
    { label: 'Notifications', icon: 'notifications_none', route: '/notifications' },
    { label: 'Audit Trail', icon: 'history', route: '/audit', roles: ['AUDITOR', 'ADMIN'] },
    { label: 'Administration', icon: 'settings', route: '/admin', roles: ['ADMIN'], children: [
      { label: 'Master Data', icon: 'dataset', route: '/admin/master-data' },
      { label: 'Workflows', icon: 'account_tree', route: '/admin/workflows' },
      { label: 'Routing Rules', icon: 'alt_route', route: '/admin/routing' },
      { label: 'Users', icon: 'people', route: '/admin/users' },
    ]},
  ];

  visibleItems = () => {
    const roles = this.auth.userRoles();
    return this.navItems.filter(item => {
      if (!item.roles) return true;
      return item.roles.some(r => roles.includes(r));
    });
  };

  toggleGroup(label: string) {
    const groups = new Set(this.expandedGroupsSet());
    if (groups.has(label)) groups.delete(label);
    else groups.add(label);
    this.expandedGroupsSet.set(groups);
  }
}
