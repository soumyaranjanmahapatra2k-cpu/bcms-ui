import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge';
import { RelativeTimePipe } from '../../shared/pipes/relative-time.pipe';
import { SkeletonLoaderComponent } from '../../shared/components/skeleton-loader/skeleton-loader';
import { TooltipDirective } from '../../shared/directives/tooltip.directive';
import { CaseStatus, STATUS_CONFIG } from '../../core/models/case.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, StatusBadgeComponent, RelativeTimePipe, SkeletonLoaderComponent, TooltipDirective],
  template: `
    <div class="dashboard">
      <div class="page-header">
        <div>
          <h1>Welcome back, {{ firstName() }} <span class="wave">&#128075;</span></h1>
          <p class="subtitle">Here's your business case overview</p>
        </div>
        @if (auth.hasAnyRole(['SUBMITTER', 'ADMIN'])) {
          <button class="btn btn-primary" routerLink="/cases/create" appTooltip="Create a new business case">
            <span class="material-icons-outlined">add</span> New Case
          </button>
        }
      </div>

      @if (loading()) {
        <div class="stats-grid">
          @for (i of [1,2,3,4]; track i) {
            <div class="card"><app-skeleton variant="rect" width="100%" height="64px" radius="var(--radius-lg)" /></div>
          }
        </div>
      } @else {
        <div class="stats-grid">
          @for (stat of stats(); track stat.label; let idx = $index) {
            <div class="card card-interactive stat-card" (click)="navigateStat(stat)" [style.animation-delay]="idx * 80 + 'ms'" [appTooltip]="'View ' + stat.label">
              <div class="stat-icon" [style.background]="stat.iconBg" [style.color]="stat.iconColor">
                <span class="material-icons-outlined">{{ stat.icon }}</span>
              </div>
              <div class="stat-info">
                <span class="stat-value">{{ stat.value }}</span>
                <span class="stat-label">{{ stat.label }}</span>
              </div>
            </div>
          }
        </div>
      }

      <div class="dashboard-grid">
        <div class="card recent-card">
          <div class="card-header">
            <h2>
              <span class="material-icons-outlined card-header-icon">folder_open</span>
              Recent Cases
            </h2>
            <a routerLink="/cases" class="view-all-link">
              View All <span class="material-icons-outlined">arrow_forward</span>
            </a>
          </div>
          @if (recentCases().length === 0) {
            <div class="empty-state">
              <span class="empty-icon material-icons-outlined">folder_off</span>
              <h3>No cases yet</h3>
              <p>Create your first business case to get started.</p>
            </div>
          } @else {
            <table class="data-table">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Title</th>
                  <th>Status</th>
                  <th>SLA</th>
                </tr>
              </thead>
              <tbody>
                @for (c of recentCases(); track c.caseId; let idx = $index) {
                  <tr class="clickable" (click)="router.navigate(['/cases', c.caseId])" [style.animation-delay]="idx * 50 + 'ms'" style="animation: fadeInUp 0.3s ease backwards">
                    <td class="ref-cell">{{ c.reference }}</td>
                    <td class="title-cell">{{ c.title }}</td>
                    <td><app-status-badge [status]="c.status" /></td>
                    <td>
                      @if (c.slaState === 'BREACHED') {
                        <span class="sla-badge breached">Breached</span>
                      } @else if (c.slaState === 'AT_RISK') {
                        <span class="sla-badge at-risk">At Risk</span>
                      } @else {
                        <span class="sla-badge on-track">On Track</span>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          }
        </div>

        <div class="card status-card">
          <div class="card-header">
            <h2>
              <span class="material-icons-outlined card-header-icon">donut_small</span>
              Status Distribution
            </h2>
          </div>
          <div class="status-bars">
            @for (s of statusDistribution(); track s.status; let idx = $index) {
              <div class="status-bar-row" [style.animation-delay]="idx * 60 + 'ms'" style="animation: fadeInUp 0.3s ease backwards">
                <div class="status-bar-label">
                  <app-status-badge [status]="s.status" />
                </div>
                <div class="status-bar-track">
                  <div class="status-bar-fill" [style.width.%]="s.percent" [style.background]="s.color" style="animation: progressGrow 0.8s ease backwards"></div>
                </div>
                <span class="status-bar-count">{{ s.count }}</span>
              </div>
            }
          </div>
        </div>
      </div>

      @if (pendingActions().length > 0) {
        <div class="card pending-card">
          <div class="card-header">
            <h2>
              <span class="material-icons-outlined card-header-icon" style="color: var(--color-warning)">pending_actions</span>
              Pending Actions
            </h2>
            <span class="pending-count">{{ pendingActions().length }}</span>
          </div>
          <div class="action-list">
            @for (action of pendingActions(); track action.notificationId; let idx = $index) {
              <div class="action-item" (click)="router.navigate([action.actionUrl])" [style.animation-delay]="idx * 60 + 'ms'" style="animation: fadeInUp 0.3s ease backwards">
                <div class="action-dot"></div>
                <div class="action-content">
                  <strong>{{ action.messageSubject }}</strong>
                  <span>{{ action.caseReferenceNo }}</span>
                </div>
                <span class="action-time">{{ action.sentOn | relativeTime }}</span>
                <span class="material-icons-outlined action-arrow">chevron_right</span>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .dashboard { animation: fadeIn 0.3s ease; }
    .wave { display: inline-block; animation: wave 2s ease-in-out infinite; transform-origin: 70% 70%; }
    @keyframes wave {
      0%, 100% { transform: rotate(0deg); }
      10% { transform: rotate(14deg); }
      20% { transform: rotate(-8deg); }
      30% { transform: rotate(14deg); }
      40% { transform: rotate(-4deg); }
      50% { transform: rotate(10deg); }
      60%, 100% { transform: rotate(0deg); }
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
      margin-bottom: 28px;
    }
    .stat-card {
      display: flex; align-items: center; gap: 16px;
      animation: fadeInUp 0.4s ease backwards;
    }
    .stat-icon {
      width: 52px; height: 52px;
      border-radius: var(--radius-xl);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
      transition: transform var(--transition-fast);
      .material-icons-outlined { font-size: 24px; }
    }
    .stat-card:hover .stat-icon { transform: scale(1.1); }
    .stat-info { display: flex; flex-direction: column; }
    .stat-value {
      font-size: 1.85rem; font-weight: 800;
      line-height: 1.1; letter-spacing: -0.02em;
      animation: countUp 0.5s ease backwards;
    }
    .stat-label { font-size: 0.786rem; color: var(--text-secondary); font-weight: 500; margin-top: 2px; }
    .dashboard-grid {
      display: grid;
      grid-template-columns: 1.5fr 1fr;
      gap: 20px;
    }
    .card-header {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 20px;
      h2 {
        font-size: 1rem; font-weight: 700;
        display: flex; align-items: center; gap: 8px;
      }
    }
    .card-header-icon { font-size: 20px; color: var(--color-primary); }
    .view-all-link {
      font-size: 0.786rem;
      color: var(--color-primary);
      display: flex; align-items: center; gap: 2px;
      font-weight: 600;
      .material-icons-outlined { font-size: 16px; transition: transform var(--transition-fast); }
      &:hover .material-icons-outlined { transform: translateX(3px); }
    }
    .ref-cell { font-weight: 700; color: var(--color-primary); font-size: 0.786rem; white-space: nowrap; }
    .title-cell { max-width: 240px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .time-cell { font-size: 0.786rem; color: var(--text-secondary); white-space: nowrap; }
    .sla-badge { font-size: 0.714rem; font-weight: 700; padding: 3px 10px; border-radius: var(--radius-full); }
    .sla-badge.on-track { background: var(--color-success-light); color: var(--color-success); }
    .sla-badge.at-risk { background: var(--color-warning-light); color: var(--color-warning); }
    .sla-badge.breached { background: var(--color-danger-light); color: var(--color-danger); }
    .status-bars { display: flex; flex-direction: column; gap: 14px; }
    .status-bar-row { display: flex; align-items: center; gap: 12px; }
    .status-bar-label { min-width: 150px; }
    .status-bar-track { flex: 1; height: 8px; background: var(--bg-hover); border-radius: var(--radius-full); overflow: hidden; }
    .status-bar-fill { height: 100%; border-radius: var(--radius-full); transition: width 0.8s ease; }
    .status-bar-count { font-size: 0.857rem; font-weight: 700; min-width: 24px; text-align: right; }
    .pending-card { margin-top: 20px; }
    .pending-count {
      background: var(--color-warning-light); color: var(--color-warning);
      font-size: 0.75rem; font-weight: 700;
      padding: 2px 10px; border-radius: var(--radius-full);
    }
    .action-list { display: flex; flex-direction: column; }
    .action-item {
      display: flex; align-items: center; gap: 14px;
      padding: 14px 0;
      border-bottom: 1px solid var(--border-color-card);
      cursor: pointer;
      transition: all var(--transition-fast);
      border-radius: var(--radius-md);
      &:last-child { border-bottom: none; }
      &:hover { background: var(--bg-hover); padding-left: 12px; padding-right: 12px; margin: 0 -12px; }
    }
    .action-dot {
      width: 8px; height: 8px; border-radius: 50%;
      background: var(--color-warning);
      flex-shrink: 0;
      animation: pulse 2s ease-in-out infinite;
    }
    .action-content { flex: 1; display: flex; flex-direction: column; }
    .action-content strong { font-size: 0.857rem; font-weight: 600; }
    .action-content span { font-size: 0.75rem; color: var(--text-secondary); }
    .action-time { font-size: 0.75rem; color: var(--text-muted); white-space: nowrap; }
    .action-arrow { font-size: 18px; color: var(--text-muted); }
    @media (max-width: 1024px) { .dashboard-grid { grid-template-columns: 1fr; } }
    @media (max-width: 768px) { .stats-grid { grid-template-columns: 1fr 1fr; } }
    @media (max-width: 480px) { .stats-grid { grid-template-columns: 1fr; } }
  `]
})
export class DashboardComponent {
  auth = inject(AuthService);
  router = inject(Router);
  private api = inject(ApiService);

  loading = signal(true);
  firstName = signal('User');
  recentCases = signal<any[]>([]);
  stats = signal<any[]>([]);
  statusDistribution = signal<any[]>([]);
  pendingActions = signal<any[]>([]);

  constructor() {
    this.firstName.set(this.auth.user()?.fullName?.split(' ')[0] || 'User');
    this.load();
  }

  async load() {
    this.loading.set(true);
    try {
      const [summary, notifs] = await Promise.all([
        this.api.getDashboardSummary().catch(() => null),
        this.api.getNotifications(0, 50).catch(() => null),
      ]);

      if (summary) {
        this.stats.set([
          { label: 'Total Cases', value: summary.totalCases ?? 0, icon: 'folder', iconBg: 'var(--color-primary-light)', iconColor: 'var(--color-primary)', route: '/cases' },
          { label: 'Pending Review', value: summary.underReview ?? 0, icon: 'rate_review', iconBg: 'var(--status-review-bg)', iconColor: 'var(--status-review)', route: '/review' },
          { label: 'Pending Approval', value: summary.pendingApproval ?? 0, icon: 'approval', iconBg: 'var(--status-pending-bg)', iconColor: 'var(--status-pending)', route: '/approval' },
          { label: 'Approved', value: summary.approved ?? 0, icon: 'check_circle', iconBg: 'var(--color-success-light)', iconColor: 'var(--color-success)', route: '/cases' },
        ]);

        // Status distribution from casesByStatus map
        const statusMap: Record<string, number> = summary.casesByStatus ?? {};
        const total = Object.values(statusMap).reduce((s: number, v: any) => s + (v as number), 0);
        this.statusDistribution.set(
          Object.entries(statusMap)
            .filter(([, v]) => (v as number) > 0)
            .map(([status, count]) => ({
              status: status as CaseStatus,
              count,
              percent: total ? ((count as number) / total) * 100 : 0,
              color: STATUS_CONFIG[status as CaseStatus]?.color ?? 'var(--color-primary)',
            }))
        );

        // Recent cases
        this.recentCases.set(summary.recent ?? []);
      }

      // Pending action notifications
      const notifList = notifs?.content ?? [];
      this.pendingActions.set(notifList.filter((n: any) => n.isActionRequired && !n.readFlag).slice(0, 5));
    } catch { /* fallback to empty */ }
    this.loading.set(false);
  }

  navigateStat(stat: { route: string }) { this.router.navigate([stat.route]); }
}
