import { Component, inject, signal, computed, effect } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { MockDataService } from '../../../core/services/mock-data.service';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge';
import { SearchFilterComponent } from '../../../shared/components/search-filter/search-filter';
import { PaginationComponent } from '../../../shared/components/pagination/pagination';
import { RelativeTimePipe } from '../../../shared/pipes/relative-time.pipe';
import { TooltipDirective } from '../../../shared/directives/tooltip.directive';
import { CaseStatus } from '../../../core/models/case.model';

@Component({
  selector: 'app-case-list',
  standalone: true,
  imports: [RouterLink, FormsModule, StatusBadgeComponent, SearchFilterComponent, PaginationComponent, RelativeTimePipe, TooltipDirective],
  template: `
    <div class="case-list">
      <div class="page-header">
        <div>
          <h1>My Cases</h1>
          <p class="subtitle">Manage and track your business cases</p>
        </div>
        <button class="btn btn-primary" routerLink="/cases/create" appTooltip="Create a new business case">
          <span class="material-icons-outlined">add</span> New Case
        </button>
      </div>

      <div class="card">
        <div class="filters-row">
          <app-search-filter placeholder="Search by title or reference..." (searchChange)="searchTerm.set($event)" />
          <div class="filter-group">
            <select [ngModel]="statusFilter()" (ngModelChange)="statusFilter.set($event)" class="filter-select">
              <option value="">All Statuses</option>
              @for (s of statuses; track s) {
                <option [value]="s">{{ s.replace('_', ' ') }}</option>
              }
            </select>
            <select [ngModel]="typeFilter()" (ngModelChange)="typeFilter.set($event)" class="filter-select">
              <option value="">All Types</option>
              @for (t of mockData.caseTypes; track t.id) {
                <option [value]="t.name">{{ t.name }}</option>
              }
            </select>
          </div>
        </div>

        <div class="results-info">
          <span>{{ filteredCases().length }} case{{ filteredCases().length !== 1 ? 's' : '' }} found</span>
        </div>

        @if (paginatedCases().length === 0) {
          <div class="empty-state">
            <span class="empty-icon material-icons-outlined">folder_off</span>
            <h3>No cases found</h3>
            <p>Try adjusting your filters or create a new case.</p>
          </div>
        } @else {
          <div class="table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Department</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>SLA</th>
                  <th>Updated</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                @for (c of paginatedCases(); track c.caseId; let idx = $index) {
                  <tr class="clickable" (click)="router.navigate(['/cases', c.caseId])" [style.animation-delay]="idx * 30 + 'ms'" style="animation: fadeInUp 0.25s ease backwards"
                      [class.row-breached]="c.slaStatus === 'BREACHED'"
                      [class.row-at-risk]="c.slaStatus === 'AT_RISK'">
                    <td class="ref-cell">{{ c.caseReferenceNo }}</td>
                    <td class="title-cell" [appTooltip]="c.title">{{ c.title }}</td>
                    <td><span class="type-badge">{{ c.caseType.name }}</span></td>
                    <td>{{ c.department.name }}</td>
                    <td>
                      <span class="priority-pill" [class]="'pri-' + (c.priorityLevel || 'NORMAL').toLowerCase()">
                        @if ((c.escalationLevel || 0) > 0) {
                          <span class="material-icons-outlined" style="font-size:13px">trending_up</span>
                        }
                        {{ c.priorityLevel || 'NORMAL' }}
                      </span>
                    </td>
                    <td><app-status-badge [status]="c.status" /></td>
                    <td>
                      @if (c.slaStatus === 'BREACHED') {
                        <span class="sla-badge sla-breached" appTooltip="SLA has been breached">Breached</span>
                      } @else if (c.slaStatus === 'AT_RISK') {
                        <span class="sla-badge sla-risk" appTooltip="SLA is at risk">At Risk</span>
                      } @else if (c.slaRemainingHours && c.slaRemainingHours > 0) {
                        <span class="sla-badge sla-ok" [appTooltip]="c.slaRemainingHours + ' hours remaining'">{{ c.slaRemainingHours }}h</span>
                      }
                    </td>
                    <td class="time-cell">{{ c.lastActionOn || c.createdOn | relativeTime }}</td>
                    <td>
                      <span class="material-icons-outlined row-arrow">chevron_right</span>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <app-pagination [currentPage]="page()" [totalItems]="filteredCases().length" [pageSize]="pageSize()" [showPageSize]="true"
                          (pageChange)="page.set($event)" (pageSizeChange)="pageSize.set($event); page.set(1)" />
        }
      </div>
    </div>
  `,
  styles: [`
    .case-list { animation: fadeIn 0.3s ease; }
    .filters-row { display: flex; gap: 12px; margin-bottom: 12px; flex-wrap: wrap; align-items: center; }
    .filter-group { display: flex; gap: 10px; flex-wrap: wrap; }
    .filter-select { width: auto; min-width: 160px; }
    .results-info {
      font-size: 0.786rem; color: var(--text-muted);
      margin-bottom: 16px; padding-bottom: 12px;
      border-bottom: 1px solid var(--border-color-card);
    }
    .table-wrapper { overflow-x: auto; margin: 0 -24px; padding: 0 24px; }
    .ref-cell { font-weight: 700; color: var(--color-primary); font-size: 0.786rem; white-space: nowrap; }
    .title-cell { max-width: 280px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 500; }
    .time-cell { font-size: 0.786rem; color: var(--text-secondary); white-space: nowrap; }
    .type-badge {
      font-size: 0.714rem; font-weight: 600;
      padding: 2px 8px; border-radius: var(--radius-full);
      background: var(--bg-hover); color: var(--text-secondary);
    }
    .sla-badge {
      font-size: 0.714rem; font-weight: 700;
      padding: 3px 10px; border-radius: var(--radius-full);
      display: inline-flex; align-items: center;
    }
    .sla-breached { background: var(--color-danger-light); color: var(--color-danger); }
    .sla-risk { background: var(--color-warning-light); color: var(--color-warning); }
    .sla-ok { background: var(--color-success-light); color: var(--color-success); }
    .row-arrow { font-size: 18px; color: var(--text-muted); transition: transform var(--transition-fast); }
    tr.clickable:hover .row-arrow { transform: translateX(3px); color: var(--color-primary); }
    tr.row-breached td:first-child { box-shadow: inset 3px 0 0 var(--color-danger); }
    tr.row-at-risk td:first-child { box-shadow: inset 3px 0 0 var(--color-warning); }
    .priority-pill {
      display: inline-flex; align-items: center; gap: 3px;
      font-size: 0.679rem; font-weight: 700; letter-spacing: 0.4px;
      padding: 2px 8px; border-radius: var(--radius-full);
      text-transform: uppercase;
    }
    .priority-pill.pri-low { background: rgba(148, 163, 184, 0.15); color: #64748b; }
    .priority-pill.pri-normal { background: rgba(59, 130, 246, 0.12); color: #2563eb; }
    .priority-pill.pri-high { background: rgba(245, 158, 11, 0.16); color: #d97706; }
    .priority-pill.pri-urgent { background: rgba(239, 68, 68, 0.16); color: #dc2626; animation: pulseGlow 2s ease-in-out infinite; }
    @keyframes pulseGlow {
      0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
      50% { box-shadow: 0 0 0 4px rgba(239, 68, 68, 0); }
    }
  `]
})
export class CaseListComponent {
  router = inject(Router);
  mockData = inject(MockDataService);
  private auth = inject(AuthService);
  private route = inject(ActivatedRoute);

  searchTerm = signal('');
  statusFilter = signal<string>('');
  typeFilter = signal<string>('');
  page = signal(1);
  pageSize = signal(10);

  statuses: CaseStatus[] = ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'CLARIFICATION_REQUIRED', 'MORE_INFO_REQUIRED', 'REWORK_REQUIRED', 'PENDING_APPROVAL', 'ESCALATED', 'APPROVED', 'REJECTED', 'CANCELLED', 'CLOSED'];

  constructor() {
    // Restore state from query params
    const params = this.route.snapshot.queryParams;
    if (params['q']) this.searchTerm.set(params['q']);
    if (params['status']) this.statusFilter.set(params['status']);
    if (params['type']) this.typeFilter.set(params['type']);
    if (params['page']) this.page.set(+params['page'] || 1);

    // Persist state to query params on change
    effect(() => {
      const q = this.searchTerm();
      const status = this.statusFilter();
      const type = this.typeFilter();
      const page = this.page();
      const queryParams: Record<string, string | number | undefined> = {};
      if (q) queryParams['q'] = q;
      if (status) queryParams['status'] = status;
      if (type) queryParams['type'] = type;
      if (page > 1) queryParams['page'] = page;
      this.router.navigate([], { queryParams, queryParamsHandling: 'replace', replaceUrl: true });
    });
  }

  filteredCases = computed(() => {
    this.mockData.version();
    let cases = this.mockData.getCases();
    const search = this.searchTerm().toLowerCase();
    const status = this.statusFilter();
    const type = this.typeFilter();
    if (search) cases = cases.filter(c => c.title.toLowerCase().includes(search) || c.caseReferenceNo.toLowerCase().includes(search));
    if (status) cases = cases.filter(c => c.status === status);
    if (type) cases = cases.filter(c => c.caseType.name === type);
    return cases.sort((a, b) => new Date(b.createdOn).getTime() - new Date(a.createdOn).getTime());
  });

  paginatedCases = computed(() => {
    const start = (this.page() - 1) * this.pageSize();
    return this.filteredCases().slice(start, start + this.pageSize());
  });
}
