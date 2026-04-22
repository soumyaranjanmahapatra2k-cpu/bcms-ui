import { Injectable, signal, inject, NgZone } from '@angular/core';
import { ApiService } from './api.service';
import { BusinessCase, CaseComment, TimelineEntry, CaseStatus, Attachment } from '../models/case.model';
import { AppNotification } from '../models/notification.model';

@Injectable({ providedIn: 'root' })
export class MockDataService {
  private api = inject(ApiService);
  private zone = inject(NgZone);

  private _version = signal(0);
  readonly version = this._version.asReadonly();
  private bump() { this._version.update(v => v + 1); }

  private cases: BusinessCase[] = [];
  private reviewCases: BusinessCase[] = [];
  private approvalCases: BusinessCase[] = [];
  private notifications: AppNotification[] = [];
  private commentsCache: Record<string, CaseComment[]> = {};
  private timelineCache: Record<string, TimelineEntry[]> = {};
  private _unreadCount = 0;
  private pollingTimer: any = null;

  departments: { id: string; name: string }[] = [];
  businessUnits: { id: string; name: string }[] = [];
  caseTypes: { id: string; name: string }[] = [];
  categories: { id: string; name: string }[] = [];

  private bootstrapped = false;

  constructor() {
    if (typeof localStorage !== 'undefined' && localStorage.getItem('bcms_token')) {
      this.bootstrap();
    }
  }

  async bootstrap() {
    try {
      await Promise.all([
        this.loadMasterData(),
        this.refreshCases(),
        this.refreshQueues(),
        this.refreshNotifications(),
      ]);
      this.bootstrapped = true;
      this.bump();
      this.startPolling();
    } catch (e) {
      console.warn('Bootstrap failed:', e);
    }
  }

  private startPolling() {
    this.stopPolling();
    this.zone.runOutsideAngular(() => {
      this.pollingTimer = setInterval(() => {
        this.zone.run(() => {
          this.refreshNotifications();
        });
      }, 30_000);
    });
  }

  stopPolling() {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
    }
  }

  private async loadMasterData() {
    const [deps, bus, cts, cats] = await Promise.all([
      this.api.getDepartments(),
      this.api.getBusinessUnits(),
      this.api.getCaseTypes(),
      this.api.getCategories(),
    ]);
    this.departments = (deps ?? []).map((d: any) => ({ id: String(d.id ?? d.departmentId), name: d.name ?? d.departmentName }));
    this.businessUnits = (bus ?? []).map((d: any) => ({ id: String(d.id ?? d.businessUnitId), name: d.name ?? d.businessUnitName }));
    this.caseTypes = (cts ?? []).map((d: any) => ({ id: String(d.id ?? d.caseTypeId), name: d.name ?? d.typeName }));
    this.categories = (cats ?? []).map((d: any) => ({ id: String(d.id ?? d.categoryId), name: d.name ?? d.categoryName }));
  }

  async refreshCases() {
    try {
      const res = await this.api.myCases(0, 200);
      const items: any[] = res?.content ?? [];
      this.cases = await Promise.all(items.map(it => this.loadFullCase(it.caseId)));
      this.bump();
    } catch (e) {
      console.warn('refreshCases failed', e);
    }
  }

  async refreshQueues() {
    try {
      const [rev, apr] = await Promise.all([
        this.api.reviewQueue(0, 100).catch(() => ({ content: [] })),
        this.api.approvalQueue(0, 100).catch(() => ({ content: [] })),
      ]);
      const revItems: any[] = rev?.content ?? [];
      const aprItems: any[] = apr?.content ?? [];
      this.reviewCases = await Promise.all(revItems.map(it => this.loadFullCase(it.caseId)));
      this.approvalCases = await Promise.all(aprItems.map(it => this.loadFullCase(it.caseId)));
      this.bump();
    } catch (e) {
      console.warn('refreshQueues failed', e);
    }
  }

  async refreshNotifications() {
    try {
      const res = await this.api.getNotifications(0, 100);
      const items: any[] = res?.content ?? [];
      this.notifications = items.map(n => this.toNotification(n));
      const uc = await this.api.getUnreadCount();
      this._unreadCount = uc?.count ?? 0;
      this.bump();
    } catch (e) {
      console.warn('refreshNotifications failed', e);
    }
  }

  private async loadFullCase(caseId: string): Promise<BusinessCase> {
    const r = await this.api.getCase(caseId);
    return this.toBusinessCase(r);
  }

  /* ────────────── Reads ────────────── */

  getCases(): BusinessCase[] { return [...this.cases]; }
  getCaseById(id: string): BusinessCase | undefined {
    return this.cases.find(c => c.caseId === id)
      ?? this.reviewCases.find(c => c.caseId === id)
      ?? this.approvalCases.find(c => c.caseId === id);
  }
  getCasesByStatus(status: CaseStatus): BusinessCase[] { return this.cases.filter(c => c.status === status); }
  getCasesByRequestor(userId: string): BusinessCase[] { return this.cases.filter(c => c.requestor.userId === userId); }
  getReviewQueue(): BusinessCase[] { return [...this.reviewCases]; }
  getApprovalQueue(): BusinessCase[] { return [...this.approvalCases]; }
  getNotifications(): AppNotification[] { return [...this.notifications]; }
  getUnreadCount(): number { return this._unreadCount; }

  getComments(caseId: string): CaseComment[] {
    if (!this.commentsCache[caseId]) {
      this.commentsCache[caseId] = [];
      this.fetchComments(caseId);
    }
    return this.commentsCache[caseId];
  }

  getTimeline(caseId: string): TimelineEntry[] {
    if (!this.timelineCache[caseId]) {
      this.timelineCache[caseId] = [];
      this.fetchTimeline(caseId);
    }
    return this.timelineCache[caseId];
  }

  invalidateComments(caseId: string) { delete this.commentsCache[caseId]; }
  invalidateTimeline(caseId: string) { delete this.timelineCache[caseId]; }

  private async fetchComments(caseId: string) {
    try {
      const data = await this.api.getComments(caseId);
      this.commentsCache[caseId] = (data ?? []).map((c: any) => ({
        commentId: c.commentId,
        commentText: c.text,
        commentType: c.type ?? 'General',
        visibilityScope: 'AllRoles',
        author: { userId: c.authorId, fullName: c.authorName },
        createdOn: c.createdOn,
      }));
      this.bump();
    } catch { /* empty */ }
  }

  private async fetchTimeline(caseId: string) {
    try {
      const data = await this.api.getTimeline(caseId);
      this.timelineCache[caseId] = (data ?? []).map((t: any) => ({
        entryId: t.entryId,
        actionType: t.actionType,
        actorName: t.actorName,
        fromStatus: t.fromStatus,
        toStatus: t.toStatus,
        comment: t.comment,
        actionOn: t.actionOn,
      }));
      this.bump();
    } catch { /* empty */ }
  }

  /* ────────────── Mutations ────────────── */

  async createDraft(formData: any): Promise<string> {
    const resp = await this.api.createCase(formData);
    await this.refreshCases();
    return resp.caseId;
  }

  async updateDraft(caseId: string, formData: any): Promise<void> {
    await this.api.updateCase(caseId, formData);
    await this.refreshCases();
  }

  async submitCase(caseId: string): Promise<void> {
    await this.api.submitCase(caseId);
    await Promise.all([this.refreshCases(), this.refreshQueues()]);
  }

  async performAction(caseId: string, action: string, comment: string): Promise<void> {
    await this.api.caseAction(caseId, action, comment);
    delete this.timelineCache[caseId];
    await Promise.all([this.refreshCases(), this.refreshQueues()]);
  }

  async addComment(caseId: string, text: string, type = 'General'): Promise<void> {
    await this.api.addComment(caseId, text, type);
    delete this.commentsCache[caseId];
    this.fetchComments(caseId);
  }

  async uploadAttachment(caseId: string, file: File): Promise<any> {
    const result = await this.api.uploadAttachment(caseId, file);
    await this.refreshCases();
    return result;
  }

  async updateCaseStatus(caseId: string, status: CaseStatus | string, reason?: string): Promise<void> {
    if (status === 'CANCELLED') {
      await this.api.cancelCase(caseId, reason);
      this.bump();
      return;
    }
    const map: Record<string, { action?: string; submit?: boolean }> = {
      SUBMITTED: { submit: true },
      PENDING_APPROVAL: { action: 'FORWARD' },
      APPROVED: { action: 'APPROVE' },
      REJECTED: { action: 'REJECT' },
      CLARIFICATION_REQUIRED: { action: 'CLARIFICATION' },
      MORE_INFO_REQUIRED: { action: 'MORE_INFO' },
      REWORK_REQUIRED: { action: 'REWORK' },
    };
    const op = map[status as string];
    if (!op) return;
    if (op.submit) {
      await this.api.submitCase(caseId);
    } else if (op.action) {
      await this.api.caseAction(caseId, op.action, `Status changed to ${status}`);
    }
    delete this.timelineCache[caseId];
    await Promise.all([this.refreshCases(), this.refreshQueues()]);
  }

  async markNotificationRead(id: string): Promise<void> {
    await this.api.markNotificationRead(id);
    const n = this.notifications.find(x => x.notificationId === id);
    if (n) { n.readFlag = true; this._unreadCount = Math.max(0, this._unreadCount - 1); }
    this.bump();
  }

  async markAllRead(): Promise<void> {
    await this.api.markAllNotificationsRead();
    this.notifications.forEach(n => n.readFlag = true);
    this._unreadCount = 0;
    this.bump();
  }

  /* ────────────── Mappers ────────────── */

  private toBusinessCase(r: any): BusinessCase {
    return {
      caseId: r.caseId,
      caseReferenceNo: r.caseReferenceNo,
      title: r.title,
      summary: r.summary,
      caseType: r.caseType ? { id: r.caseType.id, name: r.caseType.name } : { id: '', name: '' },
      requestor: r.requestor ? { userId: r.requestor.id, fullName: r.requestor.name, email: '' } : { userId: '', fullName: '', email: '' },
      department: r.department ? { id: r.department.id, name: r.department.name } : { id: '', name: '' },
      businessUnit: r.businessUnit ? { id: r.businessUnit.id, name: r.businessUnit.name } : { id: '', name: '' },
      category: r.category ? { id: r.category.id, name: r.category.name } : null,
      categorySource: r.categorySource ?? '',
      aiConfidenceScore: r.aiConfidenceScore ?? null,
      inputChannel: 'Form',
      businessJustification: r.businessJustification ?? '',
      estimatedCost: r.estimatedCost ?? null,
      expectedBenefit: r.expectedBenefit ?? '',
      riskAssessment: r.riskAssessment ?? '',
      status: r.status as CaseStatus,
      currentOwnerName: r.currentOwner?.name ?? '',
      currentOwnerId: r.currentOwner?.id ?? '',
      versionNumber: r.versionNumber ?? 1,
      reworkCount: r.reworkCount ?? 0,
      priorityLevel: r.priorityLevel ?? 'NORMAL',
      escalationLevel: r.escalationLevel ?? 0,
      submittedOn: r.submittedOn ?? null,
      lastActionOn: r.updatedOn ?? r.createdOn,
      createdOn: r.createdOn,
      createdByName: r.requestor?.name ?? '',
      attachments: (r.attachments ?? []).map((a: any) => ({
        attachmentId: a.attachmentId,
        caseId: r.caseId,
        fileName: a.fileName,
        fileUri: this.api.downloadAttachmentUrl(r.caseId, a.attachmentId),
        fileType: a.contentType ?? '',
        sourceType: 'Uploaded',
        uploadedByName: '',
        uploadedOn: r.createdOn,
      } as Attachment)),
      slaRemainingHours: r.slaDueOn ? Math.round((new Date(r.slaDueOn).getTime() - Date.now()) / 3600000) : 0,
      slaStatus: r.slaState ?? 'ON_TRACK',
      workflowId: r.workflowId ?? null,
      currentStepId: r.currentStepId ?? null,
      assignments: (r.assignments ?? []).map((a: any) => ({
        assignmentId: a.assignmentId,
        user: a.user ? { id: a.user.id, name: a.user.name } : null,
        stepId: a.stepId,
        role: a.role,
        decision: a.decision,
        decisionOn: a.decisionOn,
      })),
      workflowSteps: (r.workflowSteps ?? []).map((s: any) => ({
        stepId: s.stepId,
        stepName: s.stepName,
        sequenceNo: s.sequenceNo,
        approvalType: s.approvalType,
        isCurrent: s.isCurrent ?? (s.current ?? false),
      })),
    };
  }

  private toNotification(n: any): AppNotification {
    return {
      notificationId: n.notificationId,
      notificationType: this.notifTypeLabel(n.type),
      messageSubject: n.title,
      messageBody: n.message,
      readFlag: n.read,
      isActionRequired: ['ASSIGNMENT', 'CLARIFICATION', 'ESCALATION', 'REWORK', 'MORE_INFO'].includes(n.type),
      actionUrl: n.linkUrl ?? (n.caseId ? `/cases/${n.caseId}` : ''),
      caseId: n.caseId ?? '',
      caseReferenceNo: '',
      sentOn: n.createdOn,
    };
  }

  private notifTypeLabel(type: string): string {
    const m: Record<string, string> = {
      ASSIGNMENT: 'Assignment', APPROVAL: 'Approval', ESCALATION: 'Escalation',
      REWORK: 'Rework', MORE_INFO: 'More Info', CLARIFICATION: 'Clarification', INFO: 'Info',
    };
    return m[type] ?? type;
  }
}
