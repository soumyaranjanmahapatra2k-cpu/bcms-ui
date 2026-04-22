import { Component, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MockDataService } from '../../../core/services/mock-data.service';
import { ToastService } from '../../../core/services/toast.service';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { RelativeTimePipe } from '../../../shared/pipes/relative-time.pipe';
import { TooltipDirective } from '../../../shared/directives/tooltip.directive';
import { VoiceInputComponent } from '../../../shared/components/voice-input/voice-input';

@Component({
  selector: 'app-approval-workspace',
  standalone: true,
  imports: [FormsModule, StatusBadgeComponent, ConfirmDialogComponent, RelativeTimePipe, TooltipDirective, VoiceInputComponent],
  template: `
    @if (caseData(); as c) {
      <div class="approval-workspace">
        <div class="page-header">
          <div>
            <h1>Approve: {{ c.title }}</h1>
            <p class="subtitle">{{ c.caseReferenceNo }}</p>
          </div>
        </div>
        <div class="workspace-grid">
          <div class="workspace-main">
            <div class="card">
              <div class="tabs">
                <button class="tab" [class.active]="activeTab() === 'details'" (click)="activeTab.set('details')">
                  <span class="material-icons-outlined tab-icon">description</span> Case Details
                </button>
                <button class="tab" [class.active]="activeTab() === 'comments'" (click)="activeTab.set('comments')">
                  <span class="material-icons-outlined tab-icon">chat</span> Comments
                  @if (comments().length) { <span class="tab-count">{{ comments().length }}</span> }
                </button>
                <button class="tab" [class.active]="activeTab() === 'history'" (click)="activeTab.set('history')">
                  <span class="material-icons-outlined tab-icon">history</span> History
                </button>
              </div>
              @if (activeTab() === 'details') {
                <div class="detail-section"><h3>Summary</h3><p>{{ c.summary }}</p></div>
                <div class="detail-section"><h3>Business Justification</h3><p>{{ c.businessJustification }}</p></div>
                <div class="detail-fields">
                  <div class="field"><label>Type</label><span>{{ c.caseType.name }}</span></div>
                  <div class="field"><label>Department</label><span>{{ c.department.name }}</span></div>
                  <div class="field"><label>Estimated Cost</label><span class="cost-value">{{ c.estimatedCost ? ('$' + c.estimatedCost.toLocaleString()) : 'N/A' }}</span></div>
                  <div class="field"><label>Expected Benefit</label><span>{{ c.expectedBenefit }}</span></div>
                  <div class="field"><label>Risk</label><span>{{ c.riskAssessment }}</span></div>
                  <div class="field"><label>Requestor</label><span>{{ c.requestor.fullName }}</span></div>
                </div>
                @if (c.attachments.length > 0) {
                  <div class="detail-section" style="margin-top:20px">
                    <h3>Attachments</h3>
                    @for (att of c.attachments; track att.attachmentId) {
                      <div class="att-item"><span class="material-icons-outlined">description</span> {{ att.fileName }}</div>
                    }
                  </div>
                }
              }
              @if (activeTab() === 'comments') {
                <div class="comments-section">
                  @for (comment of comments(); track comment.commentId; let idx = $index) {
                    <div class="comment-entry" [style.animation-delay]="idx * 50 + 'ms'" style="animation: fadeInUp 0.25s ease backwards">
                      <div class="comment-header">
                        <div class="comment-avatar">{{ comment.author.fullName.split(' ').map(w => w[0]).join('') }}</div>
                        <div class="comment-meta">
                          <strong>{{ comment.author.fullName }}</strong>
                          <span>{{ comment.createdOn | relativeTime }}</span>
                        </div>
                        <span class="comment-type-badge">{{ comment.commentType }}</span>
                      </div>
                      <p class="comment-text">{{ comment.commentText }}</p>
                    </div>
                  }
                  @if (comments().length === 0) {
                    <div class="empty-state"><span class="empty-icon material-icons-outlined">chat_bubble_outline</span><h3>No comments yet</h3></div>
                  }
                </div>
              }
              @if (activeTab() === 'history') {
                @for (entry of timeline(); track entry.entryId; let idx = $index) {
                  <div class="timeline-entry" [style.animation-delay]="idx * 50 + 'ms'" style="animation: fadeInUp 0.25s ease backwards">
                    <div class="tl-dot-small"></div>
                    <div class="tl-entry-content">
                      <strong>{{ entry.actionType }}</strong> by {{ entry.actorName }}
                      <span class="time">{{ entry.actionOn | relativeTime }}</span>
                      <p>{{ entry.comment }}</p>
                    </div>
                  </div>
                }
                @if (timeline().length === 0) {
                  <div class="empty-state"><span class="empty-icon material-icons-outlined">history</span><h3>No history</h3></div>
                }
              }
            </div>
          </div>
          <div class="workspace-sidebar">
            <div class="card decision-card">
              <h3 class="sidebar-title">
                <span class="material-icons-outlined" style="font-size:18px">gavel</span>
                Approval Decision
              </h3>
              <div class="form-group">
                <label>Decision Comments <span style="color:var(--color-danger)">*</span></label>
                <div class="textarea-voice-wrap">
                  <textarea [(ngModel)]="decisionComment" rows="4" placeholder="Provide your decision rationale..."></textarea>
                  <app-voice-input class="voice-pos" (transcribed)="appendComment($event)" />
                </div>
              </div>
              <div class="decision-btns">
                <button class="btn btn-success full-width" (click)="pendingAction.set('approve')" [disabled]="!decisionComment.trim()" appTooltip="Approve this business case">
                  <span class="material-icons-outlined">check_circle</span> Approve
                </button>
                <button class="btn btn-danger full-width" (click)="pendingAction.set('reject')" [disabled]="!decisionComment.trim()" appTooltip="Reject this business case">
                  <span class="material-icons-outlined">cancel</span> Reject
                </button>
                <button class="btn btn-warning full-width" (click)="pendingAction.set('moreinfo')" [disabled]="!decisionComment.trim()" appTooltip="Request additional information">
                  <span class="material-icons-outlined">info</span> Request More Info
                </button>
              </div>
            </div>
            <div class="card">
              <h3 class="sidebar-title">
                <span class="material-icons-outlined" style="font-size:18px">info</span>
                Case Info
              </h3>
              <div class="info-rows">
                <div class="info-row"><label>Status</label><app-status-badge [status]="c.status" /></div>
                <div class="info-row"><label>Requestor</label><span class="info-value">{{ c.requestor.fullName }}</span></div>
                <div class="info-row"><label>Department</label><span class="info-value">{{ c.department.name }}</span></div>
                <div class="info-row"><label>Submitted</label><span class="info-value">{{ c.submittedOn | relativeTime }}</span></div>
                <div class="info-row"><label>Version</label><span class="info-value">v{{ c.versionNumber }}</span></div>
              </div>
            </div>
            @if (c.slaRemainingHours !== undefined && c.slaRemainingHours !== 0) {
              <div class="card sla-card" [class.sla-breached]="c.slaStatus === 'BREACHED'" [class.sla-at-risk]="c.slaStatus === 'AT_RISK'">
                <h3 class="sidebar-title">
                  <span class="material-icons-outlined" style="font-size:18px">schedule</span>
                  SLA Status
                </h3>
                @if (c.slaStatus === 'BREACHED') {
                  <span class="sla-indicator sla-breached-text">
                    <span class="material-icons-outlined" style="font-size:16px">warning</span>
                    Breached by {{ Math.abs(c.slaRemainingHours!) }}h
                  </span>
                } @else if (c.slaStatus === 'AT_RISK') {
                  <span class="sla-indicator sla-risk-text">
                    <span class="material-icons-outlined" style="font-size:16px">schedule</span>
                    {{ c.slaRemainingHours }}h remaining (At Risk)
                  </span>
                } @else {
                  <span class="sla-indicator sla-ok-text">{{ c.slaRemainingHours }}h remaining</span>
                }
              </div>
            }
            @if (c.assignments && c.assignments!.length > 0) {
              <div class="card">
                <h3 class="sidebar-title">
                  <span class="material-icons-outlined" style="font-size:18px">group</span>
                  Assignments
                </h3>
                <div class="assignment-list">
                  @for (a of c.assignments; track a.assignmentId) {
                    <div class="assignment-item" [class.decided]="a.decision">
                      <div class="assign-avatar">{{ a.user?.name?.charAt(0) || '?' }}</div>
                      <div class="assign-info">
                        <strong>{{ a.user?.name || 'Unassigned' }}</strong>
                        <span>{{ a.role }}</span>
                      </div>
                      @if (a.decision) {
                        <span class="assign-decision" [class.approved]="a.decision === 'APPROVED'" [class.rejected]="a.decision === 'REJECTED'">{{ a.decision }}</span>
                      } @else {
                        <span class="assign-pending">Pending</span>
                      }
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        </div>
        @if (pendingAction()) {
          <app-confirm-dialog
            [title]="pendingAction() === 'approve' ? 'Approve Case' : pendingAction() === 'reject' ? 'Reject Case' : 'Request More Info'"
            [message]="'Proceed with this decision on case ' + c.caseReferenceNo + '?'"
            [confirmText]="pendingAction() === 'approve' ? 'Approve' : pendingAction() === 'reject' ? 'Reject' : 'Request'"
            [confirmClass]="pendingAction() === 'approve' ? 'btn-success' : pendingAction() === 'reject' ? 'btn-danger' : 'btn-warning'"
            (confirmed)="executeDecision()"
            (cancelled)="pendingAction.set(null)"
          />
        }
      </div>
    }
  `,
  styles: [`
    .approval-workspace { animation: fadeIn 0.3s ease; }
    .subtitle { font-size: 0.786rem; color: var(--text-muted); font-weight: 600; font-family: 'JetBrains Mono', monospace; }
    .workspace-grid { display: grid; grid-template-columns: 1fr 360px; gap: 24px; }
    .detail-section { margin-bottom: 24px; }
    .detail-section h3 { font-size: 0.786rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 8px; }
    .detail-section p { line-height: 1.7; }
    .detail-fields { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .field label { display: block; font-size: 0.75rem; color: var(--text-muted); margin-bottom: 2px; font-weight: 500; }
    .field span { font-weight: 600; font-size: 0.857rem; }
    .cost-value { color: var(--color-primary); font-weight: 700; }
    .decision-card { border-top: 3px solid var(--color-primary); }
    .sidebar-title { font-size: 0.857rem; font-weight: 700; margin-bottom: 16px; display: flex; align-items: center; gap: 6px; }
    .decision-btns { display: flex; flex-direction: column; gap: 10px; margin-top: 12px; }
    .full-width { width: 100%; justify-content: center; }
    .info-rows { display: flex; flex-direction: column; gap: 14px; }
    .info-row { display: flex; justify-content: space-between; align-items: center; }
    .info-row label { font-size: 0.786rem; color: var(--text-secondary); font-weight: 500; }
    .info-value { font-size: 0.857rem; font-weight: 600; }
    .card + .card { margin-top: 16px; }
    .sla-card { border-left: 3px solid var(--color-success); }
    .sla-card.sla-breached { border-left-color: var(--color-danger); }
    .sla-card.sla-at-risk { border-left-color: var(--color-warning); }
    .sla-indicator { font-weight: 700; font-size: 0.857rem; display: flex; align-items: center; gap: 8px; }
    .sla-breached-text { color: var(--color-danger); }
    .sla-ok-text { color: var(--color-success); }
    .sla-risk-text { color: var(--color-warning); }
    .assignment-list { display: flex; flex-direction: column; gap: 10px; }
    .assignment-item { display: flex; align-items: center; gap: 10px; padding: 8px; border-radius: var(--radius-md); border: 1px solid var(--border-color-card); }
    .assignment-item.decided { opacity: 0.8; }
    .assign-avatar { width: 32px; height: 32px; border-radius: 50%; background: var(--color-primary-light); color: var(--color-primary); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.786rem; flex-shrink: 0; }
    .assign-info { flex: 1; display: flex; flex-direction: column; }
    .assign-info strong { font-size: 0.786rem; }
    .assign-info span { font-size: 0.679rem; color: var(--text-secondary); }
    .assign-decision { font-size: 0.679rem; font-weight: 700; padding: 2px 8px; border-radius: var(--radius-full); }
    .assign-decision.approved { background: var(--color-success-light); color: var(--color-success); }
    .assign-decision.rejected { background: var(--color-danger-light); color: var(--color-danger); }
    .assign-pending { font-size: 0.679rem; color: var(--color-warning); font-weight: 600; }
    .tab-icon { font-size: 17px; }
    .att-item { display: flex; align-items: center; gap: 8px; padding: 8px 0; font-size: 0.857rem; }
    .timeline-entry { display: flex; gap: 12px; padding: 14px 0; border-bottom: 1px solid var(--border-color-card); font-size: 0.857rem; }
    .timeline-entry:last-child { border-bottom: none; }
    .tl-dot-small { width: 8px; height: 8px; border-radius: 50%; background: var(--color-primary); flex-shrink: 0; margin-top: 6px; }
    .tl-entry-content { flex: 1; }
    .timeline-entry .time { color: var(--text-muted); font-size: 0.714rem; margin-left: 8px; }
    .timeline-entry p { margin-top: 4px; color: var(--text-secondary); line-height: 1.5; }
    .tab-count { background: var(--color-primary-light); color: var(--color-primary); font-size: 0.679rem; font-weight: 700; padding: 1px 7px; border-radius: var(--radius-full); margin-left: 4px; }
    .comments-section { display: flex; flex-direction: column; gap: 16px; }
    .comment-entry { border: 1px solid var(--border-color-card); border-radius: var(--radius-lg); padding: 16px; }
    .comment-entry:hover { border-color: var(--border-color-strong); }
    .comment-header { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
    .comment-avatar { width: 32px; height: 32px; border-radius: var(--radius-md); background: var(--color-primary-light); color: var(--color-primary); display: flex; align-items: center; justify-content: center; font-size: 0.714rem; font-weight: 700; }
    .comment-meta { flex: 1; display: flex; flex-direction: column; }
    .comment-meta strong { font-size: 0.857rem; }
    .comment-meta span { font-size: 0.714rem; color: var(--text-secondary); }
    .comment-type-badge { font-size: 0.679rem; font-weight: 600; padding: 2px 8px; border-radius: var(--radius-full); background: var(--bg-hover); color: var(--text-secondary); }
    .comment-text { font-size: 0.857rem; line-height: 1.7; }
    .textarea-voice-wrap { position: relative; }
    .textarea-voice-wrap textarea { padding-right: 42px; }
    .voice-pos { position: absolute; top: 8px; right: 8px; }
    @media (max-width: 1024px) { .workspace-grid { grid-template-columns: 1fr; } }
  `]
})
export class ApprovalWorkspaceComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private mockData = inject(MockDataService);
  private toast = inject(ToastService);

  Math = Math;
  activeTab = signal<'details' | 'comments' | 'history'>('details');
  pendingAction = signal<'approve' | 'reject' | 'moreinfo' | null>(null);
  processing = signal(false);
  decisionComment = '';

  appendComment(text: string) {
    this.decisionComment = this.decisionComment ? this.decisionComment + ' ' + text : text;
  }

  caseData = computed(() => {
    this.mockData.version();
    const id = this.route.snapshot.paramMap.get('id');
    return id ? this.mockData.getCaseById(id) : undefined;
  });

  timeline = computed(() => {
    this.mockData.version();
    const c = this.caseData();
    return c ? this.mockData.getTimeline(c.caseId) : [];
  });

  comments = computed(() => {
    this.mockData.version();
    const c = this.caseData();
    return c ? this.mockData.getComments(c.caseId) : [];
  });

  executeDecision() {
    const c = this.caseData();
    if (!c) return;
    const a = this.pendingAction();
    const comment = this.decisionComment.trim();
    this.processing.set(true);
    const actionMap: Record<string, string> = { approve: 'APPROVE', reject: 'REJECT', moreinfo: 'MORE_INFO' };
    const msgMap: Record<string, string> = { approve: 'Case approved', reject: 'Case rejected', moreinfo: 'More information requested' };
    this.mockData.performAction(c.caseId, actionMap[a!], comment).then(() => {
      this.toast.success(msgMap[a!]);
      this.pendingAction.set(null);
      this.router.navigate(['/approval']);
    }).catch((e: any) => {
      this.toast.error(e?.error?.message ?? 'Action failed');
    }).finally(() => this.processing.set(false));
  }
}
