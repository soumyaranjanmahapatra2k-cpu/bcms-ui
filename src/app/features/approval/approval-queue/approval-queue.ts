import { Component, inject, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MockDataService } from '../../../core/services/mock-data.service';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge';
import { SearchFilterComponent } from '../../../shared/components/search-filter/search-filter';
import { RelativeTimePipe } from '../../../shared/pipes/relative-time.pipe';
import { TooltipDirective } from '../../../shared/directives/tooltip.directive';

@Component({
  selector: 'app-approval-queue',
  standalone: true,
  imports: [StatusBadgeComponent, SearchFilterComponent, RelativeTimePipe, TooltipDirective],
  template: `
    <div class="approval-queue">
      <div class="page-header">
        <div>
          <h1>Approval Queue</h1>
          <p class="subtitle">{{ filteredCases().length }} case{{ filteredCases().length !== 1 ? 's' : '' }} pending approval</p>
        </div>
      </div>
      <div class="card">
        <app-search-filter placeholder="Search approval queue..." (searchChange)="search.set($event)" />
        @if (filteredCases().length === 0) {
          <div class="empty-state" style="margin-top:24px">
            <span class="empty-icon material-icons-outlined">approval</span>
            <h3>No cases pending approval</h3>
            <p>All cases have been processed.</p>
          </div>
        } @else {
          <div class="queue-cards">
            @for (c of filteredCases(); track c.caseId; let idx = $index) {
              <div class="queue-card" (click)="router.navigate(['/approval', c.caseId])" [style.animation-delay]="idx * 50 + 'ms'" style="animation: fadeInUp 0.3s ease backwards">
                <div class="queue-card-header">
                  <span class="ref">{{ c.caseReferenceNo }}</span>
                  <app-status-badge [status]="c.status" />
                </div>
                <h3 class="queue-card-title">{{ c.title }}</h3>
                <p class="queue-card-summary">{{ c.summary }}</p>
                <div class="queue-card-meta">
                  <span class="meta-item"><span class="material-icons-outlined">person</span> {{ c.requestor.fullName }}</span>
                  <span class="meta-item cost"><span class="material-icons-outlined">attach_money</span> {{ c.estimatedCost ? ('$' + c.estimatedCost.toLocaleString()) : 'N/A' }}</span>
                  <span class="meta-item"><span class="material-icons-outlined">schedule</span> {{ c.lastActionOn | relativeTime }}</span>
                </div>
                <div class="queue-card-arrow" appTooltip="Review & approve">
                  <span class="material-icons-outlined">arrow_forward</span>
                </div>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .approval-queue { animation: fadeIn 0.3s ease; }
    .queue-cards { display: flex; flex-direction: column; gap: 12px; margin-top: 20px; }
    .queue-card {
      border: 1px solid var(--border-color-card); border-radius: var(--radius-xl);
      padding: 20px 24px; cursor: pointer;
      transition: all var(--transition-fast);
      position: relative;
    }
    .queue-card:hover { border-color: var(--color-primary); box-shadow: var(--shadow-card-hover); transform: translateY(-1px); }
    .queue-card:active { transform: translateY(0); }
    .queue-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .ref { font-size: 0.786rem; font-weight: 700; color: var(--color-primary); letter-spacing: 0.02em; }
    .queue-card-title { font-size: 1rem; font-weight: 700; margin-bottom: 6px; }
    .queue-card-summary { font-size: 0.857rem; color: var(--text-secondary); margin-bottom: 14px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.5; }
    .queue-card-meta { display: flex; gap: 16px; flex-wrap: wrap; }
    .meta-item { display: flex; align-items: center; gap: 5px; font-size: 0.786rem; color: var(--text-secondary); font-weight: 500; }
    .meta-item .material-icons-outlined { font-size: 16px; }
    .meta-item.cost { font-weight: 700; color: var(--text-primary); }
    .queue-card-arrow {
      position: absolute; right: 20px; top: 50%; transform: translateY(-50%);
      color: var(--text-muted); transition: all var(--transition-fast);
    }
    .queue-card:hover .queue-card-arrow { color: var(--color-primary); transform: translateY(-50%) translateX(4px); }
  `]
})
export class ApprovalQueueComponent {
  router = inject(Router);
  private mockData = inject(MockDataService);
  search = signal('');

  filteredCases = computed(() => {
    this.mockData.version();
    let cases = this.mockData.getApprovalQueue();
    const term = this.search().toLowerCase();
    if (term) cases = cases.filter(c => c.title.toLowerCase().includes(term) || c.caseReferenceNo.toLowerCase().includes(term));
    return cases;
  });
}
