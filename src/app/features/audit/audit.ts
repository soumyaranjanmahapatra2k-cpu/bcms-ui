import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { PaginationComponent } from '../../shared/components/pagination/pagination';
import { RelativeTimePipe } from '../../shared/pipes/relative-time.pipe';
import { TooltipDirective } from '../../shared/directives/tooltip.directive';
import { SkeletonLoaderComponent } from '../../shared/components/skeleton-loader/skeleton-loader';

@Component({
  selector: 'app-audit',
  standalone: true,
  imports: [FormsModule, PaginationComponent, RelativeTimePipe, TooltipDirective, SkeletonLoaderComponent],
  template: `
    <div class="audit">
      <div class="page-header">
        <div>
          <h1>Audit Trail</h1>
          <p class="subtitle">Complete history of all system actions</p>
        </div>
      </div>

      <div class="card">
        <div class="filters-row">
          <div class="search-box">
            <span class="material-icons-outlined search-icon">search</span>
            <input type="text" placeholder="Search by actor or entity..." [(ngModel)]="searchTerm" (ngModelChange)="onFilterChange()" />
          </div>
          <select [(ngModel)]="actionFilter" (ngModelChange)="onFilterChange()" class="filter-select">
            <option value="">All Actions</option>
            <option value="CREATE">Create</option>
            <option value="SUBMIT">Submit</option>
            <option value="FORWARD">Forward</option>
            <option value="APPROVE">Approve</option>
            <option value="REJECT">Reject</option>
            <option value="REWORK">Rework</option>
            <option value="CLARIFICATION">Clarification</option>
            <option value="COMMENT">Comment</option>
          </select>
        </div>

        @if (loading()) {
          <app-skeleton variant="rect" width="100%" height="300px" />
        } @else {
          <div class="results-info">
            <span>{{ totalItems }} entr{{ totalItems !== 1 ? 'ies' : 'y' }} found</span>
          </div>

          <div class="table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>Actor</th>
                  <th>Entity</th>
                  <th>Entity ID</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                @for (entry of entries(); track entry.auditId; let idx = $index) {
                  <tr [style.animation-delay]="idx * 25 + 'ms'" style="animation: fadeInUp 0.2s ease backwards">
                    <td class="time-cell">{{ entry.actionOn | relativeTime }}</td>
                    <td><span class="action-tag">{{ entry.actionType }}</span></td>
                    <td class="actor-cell">{{ entry.actorName }}</td>
                    <td>{{ entry.entityType }}</td>
                    <td class="ref-cell">{{ entry.entityId }}</td>
                    <td class="comment-cell" [appTooltip]="entry.details">{{ entry.details }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          @if (entries().length === 0) {
            <div class="empty-state">
              <span class="empty-icon material-icons-outlined">history</span>
              <h3>No audit entries found</h3>
              <p>Try adjusting your search or filter criteria.</p>
            </div>
          }
          <app-pagination [currentPage]="page" [totalItems]="totalItems" [pageSize]="pageSize" (pageChange)="onPageChange($event)" />
        }
      </div>
    </div>
  `,
  styles: [`
    .audit { animation: fadeIn 0.3s ease; }
    .filters-row { display: flex; gap: 12px; margin-bottom: 12px; flex-wrap: wrap; }
    .search-box { position: relative; flex: 1; min-width: 220px; }
    .search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-muted); font-size: 18px; }
    .search-box input { padding-left: 38px; }
    .filter-select { width: auto; min-width: 160px; }
    .results-info { font-size: 0.786rem; color: var(--text-muted); margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid var(--border-color-card); }
    .table-wrapper { overflow-x: auto; margin: 0 -24px; padding: 0 24px; }
    .ref-cell { font-weight: 700; color: var(--color-primary); font-size: 0.786rem; white-space: nowrap; font-family: monospace; }
    .time-cell { font-size: 0.786rem; color: var(--text-secondary); white-space: nowrap; }
    .actor-cell { font-weight: 500; }
    .comment-cell { max-width: 260px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--text-secondary); }
    .action-tag { font-size: 0.714rem; font-weight: 700; padding: 3px 12px; border-radius: var(--radius-full); background: var(--color-primary-light); color: var(--color-primary); display: inline-block; }
  `]
})
export class AuditComponent {
  private api = inject(ApiService);
  searchTerm = '';
  actionFilter = '';
  entries = signal<any[]>([]);
  loading = signal(true);
  page = 1;
  pageSize = 25;
  totalItems = 0;

  constructor() { this.load(); }

  private debounce: any = null;
  onFilterChange() {
    if (this.debounce) clearTimeout(this.debounce);
    this.debounce = setTimeout(() => { this.page = 1; this.load(); }, 300);
  }

  onPageChange(p: number) { this.page = p; this.load(); }

  async load() {
    this.loading.set(true);
    try {
      const params: Record<string, string | number> = { page: this.page - 1, size: this.pageSize };
      if (this.searchTerm) params['actor'] = this.searchTerm;
      if (this.actionFilter) params['action'] = this.actionFilter;
      const res = await this.api.getAuditLogs(params);
      this.entries.set(res?.content ?? []);
      this.totalItems = res?.totalElements ?? 0;
    } catch {
      this.entries.set([]);
      this.totalItems = 0;
    }
    this.loading.set(false);
  }
}
