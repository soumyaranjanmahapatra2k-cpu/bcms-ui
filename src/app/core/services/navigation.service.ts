import { Injectable, inject, signal, computed } from '@angular/core';
import { Router, NavigationEnd, ActivatedRouteSnapshot } from '@angular/router';
import { Location } from '@angular/common';
import { filter } from 'rxjs';

export interface Breadcrumb {
  label: string;
  url: string;
  icon?: string;
}

const ROUTE_LABELS: Record<string, { label: string; icon?: string }> = {
  dashboard:        { label: 'Dashboard',        icon: 'dashboard' },
  cases:            { label: 'My Cases',         icon: 'folder_open' },
  create:           { label: 'Create Case',      icon: 'add_circle_outline' },
  edit:             { label: 'Edit Case',        icon: 'edit' },
  review:           { label: 'Review Queue',     icon: 'rate_review' },
  approval:         { label: 'Approval Queue',   icon: 'approval' },
  reports:          { label: 'Reports',          icon: 'bar_chart' },
  notifications:    { label: 'Notifications',    icon: 'notifications_none' },
  audit:            { label: 'Audit Trail',      icon: 'history' },
  admin:            { label: 'Administration',   icon: 'settings' },
  'master-data':    { label: 'Master Data',      icon: 'dataset' },
  workflows:        { label: 'Workflows',        icon: 'account_tree' },
  routing:          { label: 'Routing Rules',    icon: 'alt_route' },
  users:            { label: 'Users',            icon: 'people' },
};

const FALLBACK_MAP: Record<string, string> = {
  cases:    '/cases',
  review:   '/review',
  approval: '/approval',
  admin:    '/admin/master-data',
};

@Injectable({ providedIn: 'root' })
export class NavigationService {
  private router = inject(Router);
  private location = inject(Location);

  private history: string[] = [];
  private _breadcrumbs = signal<Breadcrumb[]>([]);
  breadcrumbs = this._breadcrumbs.asReadonly();

  constructor() {
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd)
    ).subscribe(event => {
      const url = event.urlAfterRedirects;
      if (this.history[this.history.length - 1] !== url) {
        this.history.push(url);
        if (this.history.length > 50) this.history.shift();
      }
      this._breadcrumbs.set(this.buildBreadcrumbs(url));
    });
  }

  goBack(fallback = '/dashboard') {
    if (this.history.length > 1) {
      this.history.pop();
      const prev = this.history[this.history.length - 1];
      this.router.navigateByUrl(prev);
    } else {
      const segment = this.router.url.split('/').filter(Boolean)[0];
      this.router.navigateByUrl(FALLBACK_MAP[segment] || fallback);
    }
  }

  get canGoBack(): boolean {
    return this.history.length > 1;
  }

  private buildBreadcrumbs(url: string): Breadcrumb[] {
    const segments = url.split('?')[0].split('/').filter(Boolean);
    const crumbs: Breadcrumb[] = [];
    let path = '';

    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      path += '/' + seg;

      if (this.isId(seg)) {
        const prev = crumbs[crumbs.length - 1];
        if (prev) prev.label += ' Details';
        continue;
      }

      const meta = ROUTE_LABELS[seg];
      crumbs.push({
        label: meta?.label || this.titleCase(seg),
        url: path,
        icon: meta?.icon,
      });
    }

    return crumbs;
  }

  private isId(segment: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}/.test(segment) || segment.length > 20;
  }

  private titleCase(s: string): string {
    return s.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }
}
