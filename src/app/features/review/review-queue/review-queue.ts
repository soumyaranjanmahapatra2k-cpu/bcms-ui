import { Component, inject, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MockDataService } from '../../../core/services/mock-data.service';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge';
import { SearchFilterComponent } from '../../../shared/components/search-filter/search-filter';
import { RelativeTimePipe } from '../../../shared/pipes/relative-time.pipe';
import { TooltipDirective } from '../../../shared/directives/tooltip.directive';

@Component({
  selector: 'app-review-queue',
  standalone: true,
  imports: [StatusBadgeComponent, SearchFilterComponent, RelativeTimePipe, TooltipDirective],
  template: `
    <div class="review-queue">
      <div class="page-header">
        <div>
          <h1>Review Queue</h1>
          <p class="subtitle">{{ filteredCases().length }} case{{ filteredCases().length !== 1 ? 's' : '' }} awaiting review</p>
        </div>
      </div>
      <div class="card">
        <app-search-filter placeholder="Search review queue..." (searchChange)="search.set($event)" />
        @if (filteredCases().length === 0) {
          <div class="empty-state" style="margin-top: 24px">
            <span class="empty-icon material-icons-outlined">rate_review</span>
            <h3>No cases to review</h3>
            <p>All cases have been reviewed. Check back later.</p>
          </div>
        } @else {
          <div class="queue-cards">
            @for (c of filteredCases(); track c.caseId; let idx = $index) {
              <div class="queue-card" (click)="router.navigate(['/review', c.caseId])" [style.animation-delay]="idx * 50 + 'ms'" style="animation: fadeInUp 0.3s ease backwards" appTooltip="Click to review this case">
                <div class="queue-card-header">
                  <span class="ref">{{ c.caseReferenceNo }}</span>
                  <app-status-badge [status]="c.status" />
                </div>
                <h3 class="queue-card-title">{{ c.title }}</h3>
                <p class="queue-card-summary">{{ c.summary }}</p>
                <div class="queue-card-meta">
                  <div class="meta-item">
                    <span class="material-icons-outlined">person</span>
                    {{ c.requestor.fullName }}
                  </div>
                  <div class="meta-item">
                    <span class="material-icons-outlined">business</span>
                    {{ c.department.name }}
                  </div>
                  <div class="meta-item">
                    <span class="material-icons-outlined">schedule</span>
                    {{ c.submittedOn | relativeTime }}
                  </div>
                  @if (c.slaRemainingHours !== undefined && c.slaRemainingHours > 0) {
                    <div class="meta-item sla" [class.at-risk]="c.slaStatus === 'AT_RISK'" [class.breached]="c.slaStatus === 'BREACHED'">
                      <span class="material-icons-outlined">timer</span>
                      {{ c.slaRemainingHours }}h SLA
                    </div>
                  }
                </div>
                <div class="queue-card-arrow">
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
    .review-queue { animation: fadeIn 0.3s ease; }
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
    .queue-card-summary { font-size: 0.857rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: 14px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .queue-card-meta { display: flex; gap: 16px; flex-wrap: wrap; }
    .meta-item { display: flex; align-items: center; gap: 5px; font-size: 0.786rem; color: var(--text-secondary); font-weight: 500; }
    .meta-item .material-icons-outlined { font-size: 16px; }
    .meta-item.sla { font-weight: 700; color: var(--color-success); }
    .meta-item.sla.at-risk { color: var(--color-warning); }
    .meta-item.sla.breached { color: var(--color-danger); }
    .queue-card-arrow {
      position: absolute; right: 20px; top: 50%; transform: translateY(-50%);
      color: var(--text-muted); transition: all var(--transition-fast);
    }
    .queue-card:hover .queue-card-arrow { color: var(--color-primary); transform: translateY(-50%) translateX(4px); }
  `]
})
export class ReviewQueueComponent {
  router = inject(Router);
  private mockData = inject(MockDataService);
  search = signal('');

  filteredCases = computed(() => {
    this.mockData.version();
    let cases = this.mockData.getReviewQueue();
    const term = this.search().toLowerCase();
    if (term) cases = cases.filter(c => c.title.toLowerCase().includes(term) || c.caseReferenceNo.toLowerCase().includes(term));
    return cases;
  });
}
