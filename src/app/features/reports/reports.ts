import { Component, inject, signal } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge';
import { SkeletonLoaderComponent } from '../../shared/components/skeleton-loader/skeleton-loader';
import { CaseStatus, STATUS_CONFIG } from '../../core/models/case.model';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [StatusBadgeComponent, SkeletonLoaderComponent],
  template: `
    <div class="reports">
      <div class="page-header">
        <div>
          <h1>Reports Dashboard</h1>
          <p class="subtitle">Analytics and insights for business cases</p>
        </div>
      </div>

      @if (loading()) {
        <div class="kpi-grid">
          @for (i of [1,2,3,4]; track i) { <div class="card kpi-card"><app-skeleton variant="rect" width="100%" height="100px" /></div> }
        </div>
      } @else {
        <div class="kpi-grid">
          @for (kpi of kpis(); track kpi.label; let idx = $index) {
            <div class="card kpi-card" [style.animation-delay]="idx * 100 + 'ms'" style="animation: fadeInUp 0.4s ease backwards">
              <div class="kpi-icon" [style.color]="kpi.color">
                <span class="material-icons-outlined">{{ kpi.icon }}</span>
              </div>
              <div class="kpi-value" [style.color]="kpi.color">{{ kpi.value }}</div>
              <div class="kpi-label">{{ kpi.label }}</div>
            </div>
          }
        </div>

        <div class="charts-grid">
          <div class="card chart-card">
            <h2><span class="material-icons-outlined card-icon">pie_chart</span> Cases by Status</h2>
            <div class="bar-chart">
              @for (s of statusData(); track s.status; let idx = $index) {
                <div class="bar-row" [style.animation-delay]="idx * 40 + 'ms'" style="animation: fadeInUp 0.3s ease backwards">
                  <div class="bar-label"><app-status-badge [status]="s.status" /></div>
                  <div class="bar-track">
                    <div class="bar-fill" [style.width.%]="s.percent" [style.background]="s.color" style="animation: progressGrow 0.8s ease backwards"></div>
                  </div>
                  <span class="bar-value">{{ s.count }}</span>
                </div>
              }
            </div>
          </div>
          <div class="card chart-card">
            <h2><span class="material-icons-outlined card-icon">business</span> Cases by Department</h2>
            <div class="bar-chart">
              @for (d of deptData(); track d.name; let idx = $index) {
                <div class="bar-row" [style.animation-delay]="idx * 40 + 'ms'" style="animation: fadeInUp 0.3s ease backwards">
                  <div class="bar-label dept-label">{{ d.name }}</div>
                  <div class="bar-track">
                    <div class="bar-fill" [style.width.%]="d.percent" style="background: var(--color-primary); animation: progressGrow 0.8s ease backwards"></div>
                  </div>
                  <span class="bar-value">{{ d.count }}</span>
                </div>
              }
            </div>
          </div>
          <div class="card chart-card cost-card">
            <h2><span class="material-icons-outlined card-icon">attach_money</span> Cost Summary</h2>
            @if (costSummary()) {
              <div class="cost-grid">
                <div class="cost-item">
                  <div class="cost-label">Total Estimated</div>
                  <div class="cost-value">\${{ (costSummary().totalEstimated / 1000).toFixed(0) }}K</div>
                </div>
                <div class="cost-item">
                  <div class="cost-label">Total Approved</div>
                  <div class="cost-value approved">\${{ (costSummary().totalApproved / 1000).toFixed(0) }}K</div>
                </div>
                <div class="cost-item">
                  <div class="cost-label">Average per Case</div>
                  <div class="cost-value">\${{ (costSummary().avgPerCase / 1000).toFixed(1) }}K</div>
                </div>
              </div>
            }
          </div>
          <div class="card chart-card">
            <h2><span class="material-icons-outlined card-icon">hourglass_top</span> Aging Report</h2>
            <div class="bar-chart">
              @for (a of agingData(); track a.label; let idx = $index) {
                <div class="bar-row" [style.animation-delay]="idx * 40 + 'ms'" style="animation: fadeInUp 0.3s ease backwards">
                  <div class="bar-label dept-label">{{ a.label }}</div>
                  <div class="bar-track">
                    <div class="bar-fill" [style.width.%]="a.percent" style="background: var(--color-warning); animation: progressGrow 0.8s ease backwards"></div>
                  </div>
                  <span class="bar-value">{{ a.count }}</span>
                </div>
              }
              @if (agingData().length === 0) {
                <div class="empty-state small"><span class="empty-icon material-icons-outlined">hourglass_empty</span><p>No aging data available</p></div>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .reports { animation: fadeIn 0.3s ease; }
    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 28px; }
    .kpi-card { text-align: center; padding: 28px 24px; }
    .kpi-icon { margin-bottom: 8px; .material-icons-outlined { font-size: 28px; } }
    .kpi-value { font-size: 2.2rem; font-weight: 800; line-height: 1.1; letter-spacing: -0.02em; }
    .kpi-label { font-size: 0.786rem; color: var(--text-secondary); margin: 6px 0 10px; font-weight: 500; }
    .charts-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .chart-card h2 { font-size: 1rem; font-weight: 700; margin-bottom: 20px; display: flex; align-items: center; gap: 8px; }
    .card-icon { font-size: 20px; color: var(--color-primary); }
    .bar-chart { display: flex; flex-direction: column; gap: 12px; }
    .bar-row { display: flex; align-items: center; gap: 12px; }
    .bar-label { min-width: 150px; }
    .dept-label { font-size: 0.857rem; font-weight: 600; }
    .bar-track { flex: 1; height: 10px; background: var(--bg-hover); border-radius: var(--radius-full); overflow: hidden; }
    .bar-fill { height: 100%; border-radius: var(--radius-full); transition: width 0.5s ease; min-width: 2px; }
    .bar-value { font-size: 0.857rem; font-weight: 700; min-width: 28px; text-align: right; }
    .cost-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
    .cost-item { text-align: center; padding: 16px; border-radius: var(--radius-md); background: var(--bg-hover); }
    .cost-label { font-size: 0.786rem; color: var(--text-muted); margin-bottom: 4px; }
    .cost-value { font-size: 1.5rem; font-weight: 800; color: var(--text-primary); }
    .cost-value.approved { color: var(--color-success); }
    .empty-state.small { padding: 20px; }
    @media (max-width: 1024px) { .charts-grid { grid-template-columns: 1fr; } .cost-grid { grid-template-columns: 1fr; } }
  `]
})
export class ReportsComponent {
  private api = inject(ApiService);
  loading = signal(true);
  kpis = signal<any[]>([]);
  statusData = signal<any[]>([]);
  deptData = signal<any[]>([]);
  costSummary = signal<any>(null);
  agingData = signal<any[]>([]);

  constructor() { this.load(); }

  async load() {
    this.loading.set(true);
    try {
      const [byStatus, byDept, cost, aging] = await Promise.all([
        this.api.getReportByStatus().catch(() => null),
        this.api.getReportByDepartment().catch(() => null),
        this.api.getReportCostSummary().catch(() => null),
        this.api.getReportAging().catch(() => null),
      ]);

      // KPIs from cost/status data
      const statusMap: Record<string, number> = byStatus ?? {};
      const totalCases = Object.values(statusMap).reduce((s: number, v: any) => s + (v as number), 0);
      const approved = statusMap['APPROVED'] ?? 0;
      const approvalRate = totalCases ? Math.round((approved / totalCases) * 100) : 0;
      const totalEst = cost?.totalEstimated ?? 0;
      this.kpis.set([
        { label: 'Total Cases', value: totalCases.toString(), color: 'var(--color-primary)', icon: 'folder' },
        { label: 'Approval Rate', value: approvalRate + '%', color: 'var(--color-success)', icon: 'check_circle' },
        { label: 'Total Estimated Cost', value: '$' + (totalEst / 1000).toFixed(0) + 'K', color: 'var(--color-info)', icon: 'attach_money' },
        { label: 'SLA Breached', value: (statusMap['SLA_BREACHED'] ?? 0).toString(), color: 'var(--color-danger)', icon: 'warning' },
      ]);

      // Status chart
      const statusEntries = Object.entries(statusMap).filter(([, v]) => (v as number) > 0);
      const maxStatus = Math.max(...statusEntries.map(([, v]) => v as number), 1);
      this.statusData.set(statusEntries.map(([status, count]) => ({
        status: status as CaseStatus,
        count,
        percent: ((count as number) / maxStatus) * 100,
        color: STATUS_CONFIG[status as CaseStatus]?.color ?? 'var(--color-primary)',
      })).sort((a, b) => (b.count as number) - (a.count as number)));

      // Department chart
      const deptMap: Record<string, number> = byDept ?? {};
      const deptEntries = Object.entries(deptMap).filter(([, v]) => (v as number) > 0);
      const maxDept = Math.max(...deptEntries.map(([, v]) => v as number), 1);
      this.deptData.set(deptEntries.map(([name, count]) => ({
        name, count, percent: ((count as number) / maxDept) * 100,
      })).sort((a, b) => (b.count as number) - (a.count as number)));

      // Cost
      this.costSummary.set(cost ?? { totalEstimated: 0, totalApproved: 0, avgPerCase: 0 });

      // Aging
      const agingArr = Array.isArray(aging) ? aging : [];
      const maxAging = Math.max(...agingArr.map((a: any) => a.count ?? 0), 1);
      this.agingData.set(agingArr.map((a: any) => ({
        label: a.bucket ?? a.label ?? 'Unknown',
        count: a.count ?? 0,
        percent: ((a.count ?? 0) / maxAging) * 100,
      })));
    } catch { /* fallback to empty */ }
    this.loading.set(false);
  }
}
