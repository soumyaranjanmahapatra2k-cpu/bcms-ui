import { Component, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MockDataService } from '../../../core/services/mock-data.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { RelativeTimePipe } from '../../../shared/pipes/relative-time.pipe';
import { TooltipDirective } from '../../../shared/directives/tooltip.directive';
import { BusinessCase, CaseComment, TimelineEntry, STATUS_CONFIG, WorkflowStepInfo } from '../../../core/models/case.model';

@Component({
  selector: 'app-case-detail',
  standalone: true,
  imports: [RouterLink, FormsModule, StatusBadgeComponent, ConfirmDialogComponent, RelativeTimePipe, TooltipDirective],
  template: `
    @if (caseData(); as c) {
      <div class="case-detail">
        <div class="page-header">
          <div>
            <h1>{{ c.title }}</h1>
            <p class="subtitle">{{ c.caseReferenceNo }}</p>
          </div>
          <div class="header-actions">
            @if (c.status === 'DRAFT' || c.status === 'REWORK_REQUIRED' || c.status === 'CLARIFICATION_REQUIRED' || c.status === 'MORE_INFO_REQUIRED') {
              <button class="btn btn-secondary" [routerLink]="['/cases', 'edit', c.caseId]" appTooltip="Edit this case">
                <span class="material-icons-outlined">edit</span> Edit
              </button>
            }
            @if (c.status === 'REWORK_REQUIRED' || c.status === 'CLARIFICATION_REQUIRED' || c.status === 'MORE_INFO_REQUIRED') {
              <button class="btn btn-primary" (click)="showResubmitConfirm.set(true)" appTooltip="Resubmit for review after making changes">
                <span class="material-icons-outlined">replay</span> Resubmit
              </button>
            }
            @if (c.status === 'DRAFT') {
              <button class="btn btn-primary" (click)="showSubmitConfirm.set(true)" appTooltip="Submit for review">
                <span class="material-icons-outlined">send</span> Submit
              </button>
              <button class="btn btn-danger btn-sm" (click)="showCancelConfirm.set(true)" appTooltip="Cancel this case">Cancel Case</button>
            }
          </div>
        </div>

        <div class="detail-grid">
          <div class="detail-main">
            <div class="card">
              <div class="tabs">
                <button class="tab" [class.active]="activeTab() === 'details'" (click)="activeTab.set('details')">
                  <span class="material-icons-outlined tab-icon">info</span> Details
                </button>
                <button class="tab" [class.active]="activeTab() === 'comments'" (click)="activeTab.set('comments')">
                  <span class="material-icons-outlined tab-icon">chat</span> Comments
                  @if (comments().length) { <span class="tab-count">{{ comments().length }}</span> }
                </button>
                <button class="tab" [class.active]="activeTab() === 'timeline'" (click)="activeTab.set('timeline')">
                  <span class="material-icons-outlined tab-icon">timeline</span> Timeline
                </button>
                <button class="tab" [class.active]="activeTab() === 'attachments'" (click)="activeTab.set('attachments')">
                  <span class="material-icons-outlined tab-icon">attach_file</span> Attachments
                  @if (c.attachments.length) { <span class="tab-count">{{ c.attachments.length }}</span> }
                </button>
              </div>

              <div class="tab-content" style="animation: fadeIn 0.2s ease">
                @if (activeTab() === 'details') {
                  <div class="detail-section">
                    <h3>Summary</h3>
                    <p>{{ c.summary }}</p>
                  </div>
                  <div class="detail-section">
                    <h3>Business Justification</h3>
                    <p>{{ c.businessJustification }}</p>
                  </div>
                  <div class="detail-fields">
                    <div class="field"><label>Estimated Cost</label><span class="field-value">{{ c.estimatedCost ? ('$' + c.estimatedCost.toLocaleString()) : 'N/A' }}</span></div>
                    <div class="field"><label>Expected Benefit</label><span class="field-value">{{ c.expectedBenefit }}</span></div>
                    <div class="field"><label>Risk Assessment</label><span class="field-value">{{ c.riskAssessment }}</span></div>
                    <div class="field"><label>Input Channel</label><span class="field-value">{{ c.inputChannel }}</span></div>
                    <div class="field"><label>Version</label><span class="field-value">v{{ c.versionNumber }}</span></div>
                    <div class="field"><label>Rework Count</label><span class="field-value">{{ c.reworkCount }}</span></div>
                  </div>
                  @if (c.category) {
                    <div class="detail-section" style="margin-top: 20px">
                      <h3>Category</h3>
                      <div class="category-info">
                        <span class="badge" style="background: var(--color-primary-light); color: var(--color-primary)">{{ c.category.name }}</span>
                        @if (c.categorySource === 'AI' && c.aiConfidenceScore) {
                          <span class="ai-tag">
                            <span class="material-icons-outlined" style="font-size:14px">smart_toy</span>
                            AI ({{ c.aiConfidenceScore }}%)
                          </span>
                        } @else {
                          <span class="manual-tag">Manual</span>
                        }
                      </div>
                    </div>
                  }
                }

                @if (activeTab() === 'comments') {
                  <div class="comments-section">
                    <div class="add-comment">
                      <div class="comment-input-row">
                        <div class="comment-input-avatar">{{ userInitials() }}</div>
                        <textarea [(ngModel)]="newComment" placeholder="Write a comment..." rows="3"></textarea>
                      </div>
                      <button class="btn btn-primary btn-sm" (click)="addComment()" [disabled]="!newComment.trim()" appTooltip="Post your comment">
                        <span class="material-icons-outlined">send</span> Post
                      </button>
                    </div>
                    @for (comment of comments(); track comment.commentId; let idx = $index) {
                      <div class="comment" [style.animation-delay]="idx * 50 + 'ms'" style="animation: fadeInUp 0.3s ease backwards">
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
                      <div class="empty-state">
                        <span class="empty-icon material-icons-outlined">chat_bubble_outline</span>
                        <h3>No comments yet</h3>
                        <p>Be the first to comment on this case.</p>
                      </div>
                    }
                  </div>
                }

                @if (activeTab() === 'timeline') {
                  <div class="timeline-section">
                    @for (entry of timeline(); track entry.entryId; let idx = $index) {
                      <div class="tl-item" [style.animation-delay]="idx * 60 + 'ms'" style="animation: fadeInUp 0.3s ease backwards">
                        <div class="tl-line"></div>
                        <div class="tl-dot"></div>
                        <div class="tl-content">
                          <div class="tl-header">
                            <strong>{{ entry.actionType }}</strong>
                            <span class="tl-time">{{ entry.actionOn | relativeTime }}</span>
                          </div>
                          <p>{{ entry.comment }}</p>
                          <span class="tl-actor">by {{ entry.actorName }}</span>
                          @if (entry.fromStatus && entry.toStatus) {
                            <div class="tl-transition">
                              {{ entry.fromStatus }} <span class="material-icons-outlined" style="font-size:14px">arrow_forward</span> {{ entry.toStatus }}
                            </div>
                          }
                        </div>
                      </div>
                    }
                    @if (timeline().length === 0) {
                      <div class="empty-state">
                        <span class="empty-icon material-icons-outlined">timeline</span>
                        <h3>No timeline entries</h3>
                      </div>
                    }
                  </div>
                }

                @if (activeTab() === 'attachments') {
                  @if (c.attachments.length === 0) {
                    <div class="empty-state">
                      <span class="empty-icon material-icons-outlined">attach_file</span>
                      <h3>No attachments</h3>
                      <p>No files have been uploaded for this case.</p>
                    </div>
                  } @else {
                    <div class="attachments-list">
                      @for (att of c.attachments; track att.attachmentId) {
                        <div class="attachment-item">
                          <div class="att-icon-wrap">
                            <span class="material-icons-outlined att-icon">description</span>
                          </div>
                          <div class="att-info">
                            <strong>{{ att.fileName }}</strong>
                            <span>Uploaded by {{ att.uploadedByName }} &middot; {{ att.uploadedOn | relativeTime }}</span>
                          </div>
                          <button class="btn btn-ghost btn-sm" appTooltip="Download file">
                            <span class="material-icons-outlined">download</span>
                          </button>
                        </div>
                      }
                    </div>
                  }
                }
              </div>
            </div>
          </div>

          <div class="detail-sidebar">
            <div class="card sidebar-card">
              <h3 class="sidebar-title">
                <span class="material-icons-outlined" style="font-size:18px">info</span>
                Case Information
              </h3>
              <div class="info-rows">
                <div class="info-row"><label>Status</label><app-status-badge [status]="c.status" /></div>
                <div class="info-row"><label>Reference</label><span class="info-value mono">{{ c.caseReferenceNo }}</span></div>
                <div class="info-row"><label>Type</label><span class="info-value">{{ c.caseType.name }}</span></div>
                <div class="info-row"><label>Department</label><span class="info-value">{{ c.department.name }}</span></div>
                <div class="info-row"><label>Business Unit</label><span class="info-value">{{ c.businessUnit.name }}</span></div>
                <div class="info-row"><label>Requestor</label><span class="info-value">{{ c.requestor.fullName }}</span></div>
                <div class="info-row"><label>Current Owner</label><span class="info-value">{{ c.currentOwnerName || '\u2014' }}</span></div>
                <div class="info-row"><label>Created</label><span class="info-value">{{ c.createdOn | relativeTime }}</span></div>
                <div class="info-row"><label>Submitted</label><span class="info-value">{{ c.submittedOn ? (c.submittedOn | relativeTime) : '\u2014' }}</span></div>
              </div>
            </div>
            @if (c.slaRemainingHours !== undefined && c.slaRemainingHours !== 0) {
              <div class="card sidebar-card sla-card" [class.sla-breached]="c.slaStatus === 'BREACHED'" [class.sla-at-risk]="c.slaStatus === 'AT_RISK'">
                <h3 class="sidebar-title">
                  <span class="material-icons-outlined" style="font-size:18px">schedule</span>
                  SLA Status
                </h3>
                <div class="sla-info">
                  @if (c.slaStatus === 'BREACHED') {
                    <span class="sla-indicator sla-breached-indicator">
                      <span class="material-icons-outlined" style="font-size:16px">warning</span>
                      Breached by {{ Math.abs(c.slaRemainingHours!) }}h
                    </span>
                  } @else if (c.slaStatus === 'AT_RISK') {
                    <span class="sla-indicator sla-risk-indicator">
                      <span class="material-icons-outlined" style="font-size:16px">schedule</span>
                      {{ c.slaRemainingHours }}h remaining (At Risk)
                    </span>
                  } @else {
                    <span class="sla-indicator sla-ok-indicator">{{ c.slaRemainingHours }}h remaining</span>
                  }
                </div>
              </div>
            }
            @if (c.assignments && c.assignments.length > 0) {
              <div class="card sidebar-card">
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
                        <span class="assign-decision" [class.approved]="a.decision === 'APPROVED'" [class.rejected]="a.decision === 'REJECTED'">
                          {{ a.decision }}
                        </span>
                      } @else {
                        <span class="assign-pending">Pending</span>
                      }
                    </div>
                  }
                </div>
              </div>
            }
            @if (c.workflowSteps && c.workflowSteps.length > 0) {
              <div class="card sidebar-card">
                <h3 class="sidebar-title">
                  <span class="material-icons-outlined" style="font-size:18px">linear_scale</span>
                  Workflow Progress
                </h3>
                <div class="workflow-steps">
                  @for (step of c.workflowSteps; track step.stepId; let idx = $index) {
                    <div class="wf-step" [class.wf-current]="step.isCurrent" [class.wf-done]="isStepDone(c, step)" [class.wf-pending]="!step.isCurrent && !isStepDone(c, step)">
                      <div class="wf-step-num">
                        @if (isStepDone(c, step)) {
                          <span class="material-icons-outlined" style="font-size:16px">check</span>
                        } @else {
                          {{ idx + 1 }}
                        }
                      </div>
                      <div class="wf-step-info">
                        <strong>{{ step.stepName }}</strong>
                        <span>{{ step.approvalType }}</span>
                      </div>
                      @if (step.isCurrent) {
                        <span class="wf-current-badge">Current</span>
                      }
                    </div>
                    @if (idx < c.workflowSteps!.length - 1) {
                      <div class="wf-connector" [class.wf-connector-done]="isStepDone(c, step)"></div>
                    }
                  }
                </div>
                <div class="wf-summary">
                  {{ completedSteps(c) }} of {{ c.workflowSteps.length }} steps completed
                  @if (remainingSteps(c) > 0) {
                    &middot; {{ remainingSteps(c) }} remaining
                  }
                </div>
              </div>
            }
          </div>
        </div>

        @if (showSubmitConfirm()) {
          <app-confirm-dialog title="Submit Case" message="Are you sure you want to submit this case for review? Once submitted, you won't be able to edit it until review is complete." confirmText="Submit" confirmClass="btn-primary" (confirmed)="submitCase()" (cancelled)="showSubmitConfirm.set(false)" />
        }
        @if (showResubmitConfirm()) {
          <app-confirm-dialog title="Resubmit Case" message="Are you sure you want to resubmit this case? It will go back into the review/approval workflow." confirmText="Resubmit" confirmClass="btn-primary" (confirmed)="resubmitCase()" (cancelled)="showResubmitConfirm.set(false)" />
        }
        @if (showCancelConfirm()) {
          <app-confirm-dialog title="Cancel Case" message="Are you sure you want to cancel this case? This action cannot be undone." confirmText="Cancel Case" confirmClass="btn-danger" (confirmed)="cancelCase()" (cancelled)="showCancelConfirm.set(false)" />
        }
      </div>
    } @else {
      <div class="empty-state">
        <span class="empty-icon material-icons-outlined">error_outline</span>
        <h3>Case not found</h3>
        <p>The case you are looking for does not exist.</p>
        <button class="btn btn-primary" routerLink="/cases" style="margin-top:16px">Back to Cases</button>
      </div>
    }
  `,
  styles: [`
    .case-detail { animation: fadeIn 0.3s ease; }
    .subtitle { font-size: 0.786rem; color: var(--text-muted); font-weight: 600; font-family: 'JetBrains Mono', monospace; }
    .header-actions { display: flex; gap: 8px; flex-wrap: wrap; }
    .detail-grid { display: grid; grid-template-columns: 1fr 340px; gap: 24px; }
    .tab-icon { font-size: 17px; }
    .tab-count {
      background: var(--color-primary-light); color: var(--color-primary);
      font-size: 0.679rem; font-weight: 700; padding: 1px 7px;
      border-radius: var(--radius-full); margin-left: 4px;
    }
    .tab-content { animation: fadeIn 0.2s ease; }
    .detail-section { margin-bottom: 24px; }
    .detail-section h3 {
      font-size: 0.786rem; font-weight: 700; color: var(--text-secondary);
      text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 8px;
    }
    .detail-section p { line-height: 1.7; color: var(--text-primary); }
    .detail-fields { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 20px; }
    .field label { display: block; font-size: 0.75rem; color: var(--text-muted); margin-bottom: 2px; font-weight: 500; }
    .field-value { font-weight: 600; font-size: 0.857rem; }
    .category-info { display: flex; align-items: center; gap: 8px; }
    .ai-tag, .manual-tag {
      font-size: 0.714rem; display: inline-flex; align-items: center; gap: 3px;
      padding: 2px 8px; border-radius: var(--radius-full); font-weight: 600;
    }
    .ai-tag { background: var(--status-review-bg); color: var(--status-review); }
    .manual-tag { background: var(--bg-hover); color: var(--text-secondary); }
    .comments-section { display: flex; flex-direction: column; gap: 16px; }
    .add-comment { display: flex; flex-direction: column; gap: 8px; align-items: flex-end; }
    .comment-input-row { display: flex; gap: 12px; width: 100%; align-items: flex-start; }
    .comment-input-avatar {
      width: 36px; height: 36px; border-radius: var(--radius-md);
      background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
      color: var(--text-inverse); display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 0.75rem; flex-shrink: 0;
    }
    .comment-input-row textarea { flex: 1; }
    .comment {
      border: 1px solid var(--border-color-card); border-radius: var(--radius-lg);
      padding: 16px; transition: border-color var(--transition-fast);
    }
    .comment:hover { border-color: var(--border-color-strong); }
    .comment-header { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
    .comment-avatar {
      width: 32px; height: 32px; border-radius: var(--radius-md);
      background: var(--color-primary-light); color: var(--color-primary);
      display: flex; align-items: center; justify-content: center;
      font-size: 0.714rem; font-weight: 700;
    }
    .comment-meta { flex: 1; display: flex; flex-direction: column; }
    .comment-meta strong { font-size: 0.857rem; }
    .comment-meta span { font-size: 0.714rem; color: var(--text-secondary); }
    .comment-type-badge {
      font-size: 0.679rem; font-weight: 600;
      padding: 2px 8px; border-radius: var(--radius-full);
      background: var(--bg-hover); color: var(--text-secondary);
    }
    .comment-text { font-size: 0.857rem; line-height: 1.7; }
    .timeline-section { position: relative; padding-left: 28px; }
    .tl-item { position: relative; margin-bottom: 24px; }
    .tl-line {
      position: absolute; left: -21px; top: 16px; bottom: -24px;
      width: 2px; background: var(--border-color);
    }
    .tl-item:last-child .tl-line { display: none; }
    .tl-dot {
      position: absolute; left: -25px; top: 4px;
      width: 10px; height: 10px; border-radius: 50%;
      background: var(--color-primary);
      box-shadow: 0 0 0 3px var(--bg-card);
    }
    .tl-content {
      background: var(--bg-hover); padding: 14px 18px;
      border-radius: var(--radius-lg);
      border: 1px solid var(--border-color-card);
    }
    .tl-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
    .tl-header strong { font-size: 0.857rem; }
    .tl-time { font-size: 0.714rem; color: var(--text-secondary); }
    .tl-content p { font-size: 0.857rem; margin-bottom: 4px; line-height: 1.5; }
    .tl-actor { font-size: 0.714rem; color: var(--text-secondary); }
    .tl-transition {
      display: inline-flex; align-items: center; gap: 4px;
      font-size: 0.714rem; color: var(--color-primary);
      margin-top: 6px; font-weight: 600;
      padding: 2px 8px; border-radius: var(--radius-full);
      background: var(--color-primary-subtle);
    }
    .attachments-list { display: flex; flex-direction: column; gap: 10px; }
    .attachment-item {
      display: flex; align-items: center; gap: 14px; padding: 14px;
      border: 1px solid var(--border-color-card); border-radius: var(--radius-lg);
      transition: all var(--transition-fast);
    }
    .attachment-item:hover { border-color: var(--border-color-strong); background: var(--bg-hover); }
    .att-icon-wrap {
      width: 40px; height: 40px; border-radius: var(--radius-md);
      background: var(--color-primary-light); display: flex; align-items: center; justify-content: center;
    }
    .att-icon { color: var(--color-primary); font-size: 22px; }
    .att-info { flex: 1; display: flex; flex-direction: column; }
    .att-info strong { font-size: 0.857rem; }
    .att-info span { font-size: 0.714rem; color: var(--text-secondary); }
    .sidebar-card { margin-bottom: 16px; }
    .sidebar-title {
      font-size: 0.857rem; font-weight: 700; margin-bottom: 16px;
      display: flex; align-items: center; gap: 6px;
    }
    .info-rows { display: flex; flex-direction: column; gap: 14px; }
    .info-row { display: flex; justify-content: space-between; align-items: center; }
    .info-row label { font-size: 0.786rem; color: var(--text-secondary); font-weight: 500; }
    .info-value { font-size: 0.857rem; font-weight: 600; }
    .mono { font-family: 'JetBrains Mono', 'Fira Code', monospace; letter-spacing: 0.02em; }
    .sla-card { border-left: 3px solid var(--color-success); }
    .sla-card.sla-breached { border-left-color: var(--color-danger); }
    .sla-card.sla-at-risk { border-left-color: var(--color-warning); }
    .sla-indicator { font-weight: 700; font-size: 0.857rem; display: flex; align-items: center; gap: 8px; }
    .sla-breached-indicator { color: var(--color-danger); }
    .sla-ok-indicator { color: var(--color-success); }
    .sla-risk-indicator { color: var(--color-warning); }
    .assignment-list { display: flex; flex-direction: column; gap: 10px; }
    .assignment-item { display: flex; align-items: center; gap: 10px; padding: 8px; border-radius: var(--radius-md); border: 1px solid var(--border-color-card); }
    .assignment-item.decided { opacity: 0.8; }
    .assign-avatar {
      width: 32px; height: 32px; border-radius: 50%;
      background: var(--color-primary-light); color: var(--color-primary);
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 0.786rem; flex-shrink: 0;
    }
    .assign-info { flex: 1; display: flex; flex-direction: column; }
    .assign-info strong { font-size: 0.786rem; }
    .assign-info span { font-size: 0.679rem; color: var(--text-secondary); }
    .assign-decision { font-size: 0.679rem; font-weight: 700; padding: 2px 8px; border-radius: var(--radius-full); }
    .assign-decision.approved { background: var(--color-success-light); color: var(--color-success); }
    .assign-decision.rejected { background: var(--color-danger-light); color: var(--color-danger); }
    .assign-pending { font-size: 0.679rem; color: var(--color-warning); font-weight: 600; }
    .workflow-steps { display: flex; flex-direction: column; }
    .wf-step { display: flex; align-items: center; gap: 10px; padding: 8px; border-radius: var(--radius-md); }
    .wf-step-num { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.714rem; font-weight: 700; flex-shrink: 0; border: 2px solid var(--border-color); color: var(--text-muted); background: var(--bg-card); }
    .wf-current .wf-step-num { border-color: var(--color-primary); background: var(--color-primary); color: var(--text-inverse); }
    .wf-done .wf-step-num { border-color: var(--color-success); background: var(--color-success); color: var(--text-inverse); }
    .wf-step-info { flex: 1; display: flex; flex-direction: column; }
    .wf-step-info strong { font-size: 0.786rem; }
    .wf-step-info span { font-size: 0.643rem; color: var(--text-muted); text-transform: capitalize; }
    .wf-current-badge { font-size: 0.607rem; font-weight: 700; padding: 2px 8px; border-radius: var(--radius-full); background: var(--color-primary-light); color: var(--color-primary); }
    .wf-connector { width: 2px; height: 16px; margin-left: 21px; background: var(--border-color); }
    .wf-connector-done { background: var(--color-success); }
    .wf-summary { font-size: 0.714rem; color: var(--text-secondary); font-weight: 600; margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border-color-card); }
    @media (max-width: 1024px) { .detail-grid { grid-template-columns: 1fr; } .detail-sidebar { order: -1; } }
    @media (max-width: 768px) { .detail-fields { grid-template-columns: 1fr; } }
  `]
})
export class CaseDetailComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private mockData = inject(MockDataService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  Math = Math;
  activeTab = signal<'details' | 'comments' | 'timeline' | 'attachments'>('details');
  showSubmitConfirm = signal(false);
  showResubmitConfirm = signal(false);
  showCancelConfirm = signal(false);
  newComment = '';

  userInitials = computed(() => {
    const name = this.auth.user()?.fullName || '';
    return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  });

  caseData = computed(() => {
    this.mockData.version();
    const id = this.route.snapshot.paramMap.get('id');
    return id ? this.mockData.getCaseById(id) : undefined;
  });

  comments = computed(() => {
    this.mockData.version();
    const c = this.caseData();
    return c ? this.mockData.getComments(c.caseId) : [];
  });

  timeline = computed(() => {
    this.mockData.version();
    const c = this.caseData();
    return c ? this.mockData.getTimeline(c.caseId).sort((a, b) => new Date(b.actionOn).getTime() - new Date(a.actionOn).getTime()) : [];
  });

  addComment() {
    const c = this.caseData();
    if (!c || !this.newComment.trim()) return;
    this.mockData.addComment(c.caseId, this.newComment.trim(), 'General').then(() => {
      this.newComment = '';
      this.toast.success('Comment added');
    }).catch(() => this.toast.error('Failed to add comment'));
  }

  submitCase() {
    const c = this.caseData();
    if (c) {
      this.mockData.submitCase(c.caseId).then(() => {
        this.showSubmitConfirm.set(false);
        this.toast.success('Case submitted for review');
      }).catch((e: any) => this.toast.error(e?.error?.message ?? 'Submit failed'));
    }
  }

  resubmitCase() {
    const c = this.caseData();
    if (c) {
      this.mockData.submitCase(c.caseId).then(() => {
        this.showResubmitConfirm.set(false);
        this.toast.success('Case resubmitted for review');
      }).catch((e: any) => this.toast.error(e?.error?.message ?? 'Resubmit failed'));
    }
  }

  cancelCase() {
    const c = this.caseData();
    if (c) {
      this.mockData.updateCaseStatus(c.caseId, 'CANCELLED').then(() => {
        this.showCancelConfirm.set(false);
        this.toast.success('Case cancelled');
        this.router.navigate(['/cases']);
      }).catch((e: any) => this.toast.error(e?.error?.message ?? 'Cancel failed'));
    }
  }

  isStepDone(c: BusinessCase, step: WorkflowStepInfo): boolean {
    if (!c.workflowSteps || !c.currentStepId) return false;
    const currentIdx = c.workflowSteps.findIndex(s => s.isCurrent);
    const stepIdx = c.workflowSteps.indexOf(step);
    if (currentIdx < 0) {
      // No current step means workflow completed (APPROVED/REJECTED/CANCELLED)
      return ['APPROVED', 'REJECTED', 'CANCELLED', 'CLOSED'].includes(c.status);
    }
    return stepIdx < currentIdx;
  }

  completedSteps(c: BusinessCase): number {
    return (c.workflowSteps ?? []).filter(s => this.isStepDone(c, s)).length;
  }

  remainingSteps(c: BusinessCase): number {
    return (c.workflowSteps ?? []).length - this.completedSteps(c) - ((c.workflowSteps ?? []).some(s => s.isCurrent) ? 1 : 0);
  }
}
