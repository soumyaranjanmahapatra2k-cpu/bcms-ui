import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { RelativeTimePipe } from '../../shared/pipes/relative-time.pipe';
import { TooltipDirective } from '../../shared/directives/tooltip.directive';
import { SkeletonLoaderComponent } from '../../shared/components/skeleton-loader/skeleton-loader';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [RelativeTimePipe, TooltipDirective, SkeletonLoaderComponent],
  template: `
    <div class="notifications">
      <div class="page-header">
        <div>
          <h1>Notifications</h1>
          <p class="subtitle">{{ unreadCount() }} unread notification{{ unreadCount() !== 1 ? 's' : '' }}</p>
        </div>
        <button class="btn btn-secondary" (click)="markAllRead()" [disabled]="unreadCount() === 0" appTooltip="Mark all notifications as read">
          <span class="material-icons-outlined">done_all</span> Mark All Read
        </button>
      </div>

      <div class="card">
        <div class="tabs">
          <button class="tab" [class.active]="filter() === 'all'" (click)="filter.set('all'); load()">
            <span class="material-icons-outlined tab-icon">notifications</span> All
          </button>
          <button class="tab" [class.active]="filter() === 'unread'" (click)="filter.set('unread'); load()">
            <span class="material-icons-outlined tab-icon">mark_email_unread</span> Unread
            @if (unreadCount() > 0) { <span class="tab-count">{{ unreadCount() }}</span> }
          </button>
          <button class="tab" [class.active]="filter() === 'action'" (click)="filter.set('action'); load()">
            <span class="material-icons-outlined tab-icon">pending_actions</span> Action Required
          </button>
        </div>

        @if (loading()) {
          <app-skeleton variant="rect" width="100%" height="200px" />
        } @else if (notifications().length === 0) {
          <div class="empty-state">
            <span class="empty-icon material-icons-outlined">notifications_none</span>
            <h3>No notifications</h3>
            <p>You are all caught up!</p>
          </div>
        } @else {
          <div class="notif-list">
            @for (n of notifications(); track n.notificationId; let idx = $index) {
              <div class="notif-item" [class.unread]="!n.readFlag" (click)="openNotification(n)" [style.animation-delay]="idx * 40 + 'ms'" style="animation: fadeInUp 0.25s ease backwards">
                <div class="notif-icon-wrap" [class]="'type-' + (n.notificationType || 'info').toLowerCase()">
                  <span class="material-icons-outlined">{{ getIcon(n.notificationType) }}</span>
                </div>
                <div class="notif-content">
                  <div class="notif-subject">{{ n.messageSubject }}</div>
                  <div class="notif-body">{{ n.messageBody }}</div>
                  <div class="notif-meta">
                    <span class="notif-ref">{{ n.caseReferenceNo }}</span>
                    <span>{{ n.sentOn | relativeTime }}</span>
                  </div>
                </div>
                <div class="notif-end">
                  @if (n.isActionRequired) {
                    <span class="action-badge">Action Required</span>
                  }
                  @if (!n.readFlag) {
                    <span class="unread-dot"></span>
                  }
                  <span class="material-icons-outlined notif-arrow">chevron_right</span>
                </div>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .notifications { animation: fadeIn 0.3s ease; }
    .tab-icon { font-size: 17px; }
    .tab-count {
      background: var(--color-primary-light); color: var(--color-primary);
      font-size: 0.679rem; font-weight: 700; padding: 1px 7px;
      border-radius: var(--radius-full); margin-left: 4px;
    }
    .notif-list { display: flex; flex-direction: column; }
    .notif-item {
      display: flex; align-items: flex-start; gap: 14px;
      padding: 18px 0;
      border-bottom: 1px solid var(--border-color-card);
      cursor: pointer;
      transition: all var(--transition-fast);
      border-radius: var(--radius-md);
    }
    .notif-item:last-child { border-bottom: none; }
    .notif-item:hover { background: var(--bg-hover); padding-left: 16px; padding-right: 16px; margin: 0 -16px; }
    .notif-item.unread { background: var(--color-primary-subtle); }
    .notif-icon-wrap {
      width: 44px; height: 44px; border-radius: var(--radius-lg);
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      .material-icons-outlined { font-size: 22px; }
    }
    .type-assignment { background: var(--color-primary-light); color: var(--color-primary); }
    .type-clarification { background: var(--color-warning-light); color: var(--color-warning); }
    .type-approval { background: var(--color-success-light); color: var(--color-success); }
    .type-escalation { background: var(--color-danger-light); color: var(--color-danger); }
    .type-rework { background: var(--status-rework-bg); color: var(--status-rework); }
    .type-rejection { background: var(--color-danger-light); color: var(--color-danger); }
    .type-info { background: var(--color-info-light); color: var(--color-info); }
    .notif-content { flex: 1; min-width: 0; }
    .notif-subject { font-weight: 700; font-size: 0.857rem; margin-bottom: 4px; }
    .notif-body { font-size: 0.857rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: 8px; }
    .notif-meta { display: flex; gap: 12px; font-size: 0.714rem; color: var(--text-muted); }
    .notif-ref { color: var(--color-primary); font-weight: 600; }
    .notif-end { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; flex-shrink: 0; }
    .action-badge {
      font-size: 0.65rem; font-weight: 700; padding: 3px 10px;
      border-radius: var(--radius-full);
      background: var(--color-warning-light); color: var(--color-warning);
    }
    .unread-dot {
      width: 10px; height: 10px; border-radius: 50%;
      background: var(--color-primary);
      animation: pulse 2s ease-in-out infinite;
    }
    .notif-arrow { font-size: 18px; color: var(--text-muted); transition: transform var(--transition-fast); }
    .notif-item:hover .notif-arrow { transform: translateX(3px); color: var(--color-primary); }
  `]
})
export class NotificationsComponent {
  private api = inject(ApiService);
  private router = inject(Router);

  filter = signal<'all' | 'unread' | 'action'>('all');
  notifications = signal<any[]>([]);
  unreadCount = signal(0);
  loading = signal(true);

  constructor() { this.load(); }

  private mapNotification(n: any): any {
    const ACTION_TYPES = ['ASSIGNMENT', 'CLARIFICATION', 'ESCALATION', 'REWORK', 'MORE_INFO'];
    const TYPE_LABELS: Record<string, string> = {
      ASSIGNMENT: 'Assignment', APPROVAL: 'Approval', ESCALATION: 'Escalation',
      REWORK: 'Rework', MORE_INFO: 'More Info', CLARIFICATION: 'Clarification', INFO: 'Info',
    };
    return {
      notificationId: n.notificationId,
      notificationType: TYPE_LABELS[n.type] ?? n.type ?? 'Info',
      messageSubject: n.title ?? '',
      messageBody: n.message ?? '',
      readFlag: !!n.read,
      isActionRequired: ACTION_TYPES.includes(n.type),
      actionUrl: n.linkUrl ?? (n.caseId ? `/cases/${n.caseId}` : ''),
      caseId: n.caseId ?? '',
      caseReferenceNo: n.caseReferenceNo ?? '',
      sentOn: n.createdOn ?? '',
    };
  }

  async load() {
    this.loading.set(true);
    try {
      const res = await this.api.getNotifications(0, 200);
      let list: any[] = (res?.content ?? []).map((n: any) => this.mapNotification(n));
      this.unreadCount.set(list.filter((n: any) => !n.readFlag).length);
      if (this.filter() === 'unread') list = list.filter((n: any) => !n.readFlag);
      if (this.filter() === 'action') list = list.filter((n: any) => n.isActionRequired);
      list.sort((a: any, b: any) => new Date(b.sentOn).getTime() - new Date(a.sentOn).getTime());
      this.notifications.set(list);
    } catch { this.notifications.set([]); }
    this.loading.set(false);
  }

  getIcon(type: string): string {
    const icons: Record<string, string> = {
      ASSIGNMENT: 'assignment_ind', CLARIFICATION: 'help_outline', APPROVAL: 'check_circle',
      ESCALATION: 'priority_high', REWORK: 'replay', REJECTION: 'cancel',
      Assignment: 'assignment_ind', Clarification: 'help_outline', Approval: 'check_circle',
      Escalation: 'priority_high', Rework: 'replay', Rejection: 'cancel',
    };
    return icons[type] || 'notifications';
  }

  async openNotification(n: any) {
    try { await this.api.markNotificationRead(n.notificationId); } catch {}
    n.readFlag = true;
    this.unreadCount.update(c => Math.max(0, c - 1));
    if (n.actionUrl) this.router.navigate([n.actionUrl]);
  }

  async markAllRead() {
    try {
      await this.api.markAllNotificationsRead();
      this.unreadCount.set(0);
      this.notifications.update(list => list.map(n => ({ ...n, readFlag: true })));
    } catch {}
  }
}
