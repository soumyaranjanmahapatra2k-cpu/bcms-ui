import { Component, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { TooltipDirective } from '../../../shared/directives/tooltip.directive';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader';

@Component({
  selector: 'app-workflows',
  standalone: true,
  imports: [FormsModule, TooltipDirective, ConfirmDialogComponent, SkeletonLoaderComponent],
  template: `
    <div class="workflows">
      <div class="page-header">
        <div>
          <h1>Workflow Configuration</h1>
          <p class="subtitle">Define and manage case processing workflows</p>
        </div>
        <button class="btn btn-primary" (click)="openAddWf()">
          <span class="material-icons-outlined">add</span> New Workflow
        </button>
      </div>

      @if (loading()) {
        <div class="card"><app-skeleton variant="rect" width="100%" height="300px" /></div>
      } @else {
        @for (wf of workflows(); track wf.workflowId; let wi = $index) {
          <div class="card workflow-card" [style.animation-delay]="wi * 100 + 'ms'" style="animation: fadeInUp 0.4s ease backwards">
            <div class="workflow-header">
              <div class="workflow-title-row">
                <span class="material-icons-outlined workflow-icon">account_tree</span>
                <div>
                  <h3>{{ wf.workflowName }}</h3>
                  <div class="wf-meta">
                    <button class="status-toggle" [class.active]="wf.activeFlag" (click)="toggleWf(wf)" [appTooltip]="wf.activeFlag ? 'Deactivate' : 'Activate'">
                      <span class="material-icons-outlined">{{ wf.activeFlag ? 'toggle_on' : 'toggle_off' }}</span>
                      {{ wf.activeFlag ? 'Active' : 'Inactive' }}
                    </button>
                    <span class="wf-version">v{{ wf.version }}</span>
                    <span class="wf-case-type" appTooltip="Case Type ID">{{ getCaseTypeName(wf.caseTypeId) }}</span>
                  </div>
                </div>
              </div>
              <div class="wf-actions">
                <button class="btn-icon" (click)="openEditWf(wf)" appTooltip="Edit"><span class="material-icons-outlined">edit</span></button>
                <button class="btn-icon btn-icon-danger" (click)="confirmDeleteWf.set(wf)" appTooltip="Delete"><span class="material-icons-outlined">delete</span></button>
                <button class="btn btn-secondary btn-sm" (click)="toggleSteps(wf.workflowId)">
                  <span class="material-icons-outlined">{{ expandedWf() === wf.workflowId ? 'expand_less' : 'expand_more' }}</span>
                  {{ expandedWf() === wf.workflowId ? 'Hide Steps' : 'Show Steps' }}
                </button>
              </div>
            </div>
            @if (expandedWf() === wf.workflowId) {
              <div class="workflow-steps">
                @for (step of wfSteps(); track step.stepId; let idx = $index; let last = $last) {
                  <div class="step" [style.animation-delay]="idx * 120 + 'ms'" style="animation: fadeInUp 0.3s ease backwards">
                    <div class="step-number">{{ step.sequenceNo }}</div>
                    <div class="step-info">
                      <strong>{{ step.stepName }}</strong>
                      <span>{{ step.approvalType }} · {{ step.assigneeResolverType || step.approverRole }}@if (step.assigneeResolverValue) { &nbsp;({{ step.assigneeResolverValue }}) }</span>
                      @if (step.parallel) {
                        <span class="parallel-tag">Parallel ({{ step.parallelStrategy }})</span>
                      }
                      @if (step.optional) { <span class="parallel-tag">Optional</span> }
                      @if (step.conditionExpression) {
                        <span class="parallel-tag" [appTooltip]="step.conditionExpression">Conditional</span>
                      }
                    </div>
                    @if (step.slaHours) { <span class="step-sla">{{ step.slaHours }}h SLA</span> }
                    <span class="step-role">{{ step.approverRole }}</span>
                    <div class="step-actions">
                      <button class="btn-icon btn-icon-sm" (click)="openEditStep(step)" appTooltip="Edit step"><span class="material-icons-outlined">edit</span></button>
                      <button class="btn-icon btn-icon-sm btn-icon-danger" (click)="confirmDeleteStep.set(step)" appTooltip="Delete step"><span class="material-icons-outlined">delete</span></button>
                    </div>
                  </div>
                  @if (!last) { <div class="step-connector"><span class="material-icons-outlined">arrow_downward</span></div> }
                }
                @if (wfSteps().length === 0) {
                  <div class="empty-state"><span class="empty-icon material-icons-outlined">layers_clear</span><h3>No steps defined</h3></div>
                }
                <button class="btn btn-secondary btn-sm add-step-btn" (click)="openAddStep(wf.workflowId)">
                  <span class="material-icons-outlined">add</span> Add Step
                </button>
              </div>
            }
          </div>
        }
        @if (workflows().length === 0) {
          <div class="card empty-state"><span class="empty-icon material-icons-outlined">account_tree</span><h3>No workflows configured</h3></div>
        }
      }

      <!-- Workflow Modal -->
      @if (showWfModal()) {
        <div class="overlay" (click)="showWfModal.set(false)">
          <div class="modal" (click)="$event.stopPropagation()" style="animation: modalIn 0.3s ease">
            <div class="modal-header">
              <h2>{{ editWf() ? 'Edit' : 'New' }} Workflow</h2>
              <button class="btn-icon" (click)="showWfModal.set(false)"><span class="material-icons-outlined">close</span></button>
            </div>
            <div class="modal-body">
              <div class="form-group">
                <label>Workflow Name <span class="required">*</span></label>
                <input [(ngModel)]="wfName" placeholder="Enter workflow name" />
              </div>
              <div class="form-group">
                <label>Case Type <span class="required">*</span></label>
                <select [(ngModel)]="wfCaseTypeId">
                  <option value="">Select case type</option>
                  @for (ct of caseTypes(); track ct.id) { <option [value]="ct.id">{{ ct.name }}</option> }
                </select>
              </div>
              @if (wfError()) { <div class="field-error">{{ wfError() }}</div> }
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="showWfModal.set(false)">Cancel</button>
              <button class="btn btn-primary" (click)="saveWf()" [disabled]="savingWf()">
                @if (savingWf()) { <span class="spinner-sm"></span> }
                {{ editWf() ? 'Update' : 'Create' }}
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Step Modal -->
      @if (showStepModal()) {
        <div class="overlay" (click)="showStepModal.set(false)">
          <div class="modal modal-lg" (click)="$event.stopPropagation()" style="animation: modalIn 0.3s ease">
            <div class="modal-header">
              <h2>{{ editStep() ? 'Edit' : 'Add' }} Step</h2>
              <button class="btn-icon" (click)="showStepModal.set(false)"><span class="material-icons-outlined">close</span></button>
            </div>
            <div class="modal-body">
              <div class="form-row">
                <div class="form-group">
                  <label>Step Name <span class="required">*</span></label>
                  <input [(ngModel)]="stepName" placeholder="e.g. Manager Review" />
                </div>
                <div class="form-group">
                  <label>Sequence #</label>
                  <input type="number" [(ngModel)]="stepSeq" min="1" />
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Approval Type</label>
                  <select [(ngModel)]="stepApprovalType">
                    <option value="STANDARD">Standard</option>
                    <option value="MANDATORY">Mandatory</option>
                    <option value="PARALLEL">Parallel</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Approver Role <span class="required">*</span></label>
                  <select [(ngModel)]="stepRole">
                    <option value="">Select role</option>
                    <option value="REVIEWER">Reviewer</option>
                    <option value="APPROVER">Approver</option>
                    <option value="MANAGEMENT">Management</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>SLA (hours)</label>
                  <input type="number" [(ngModel)]="stepSla" min="0" placeholder="e.g. 48" />
                </div>
                <div class="form-group checkbox-group">
                  <label><input type="checkbox" [(ngModel)]="stepParallel" /> Parallel Execution</label>
                </div>
              </div>
              @if (stepParallel) {
                <div class="form-row">
                  <div class="form-group">
                    <label>Parallel Strategy</label>
                    <select [(ngModel)]="stepParallelStrategy">
                      <option value="ALL">ALL — every assignee must approve</option>
                      <option value="ANY">ANY — first approval completes the step</option>
                    </select>
                  </div>
                </div>
              }
              <div class="form-row">
                <div class="form-group">
                  <label>Assignee Resolver</label>
                  <select [(ngModel)]="stepAssigneeType">
                    <option value="REPORTING_MANAGER">Reporting Manager</option>
                    <option value="DEPARTMENT_HEAD">Department Head</option>
                    <option value="BUSINESS_UNIT_HEAD">Business Unit Head</option>
                    <option value="ROLE_IN_DEPARTMENT">Role — in case's department</option>
                    <option value="ROLE_IN_BUSINESS_UNIT">Role — in case's BU</option>
                    <option value="ROLE_GLOBAL">Role — global (legacy)</option>
                    <option value="FUNCTIONAL_TEAM">Functional Team (category/type)</option>
                    <option value="USER_DIRECT">Specific Users (CSV of user-ids)</option>
                  </select>
                  <small class="form-hint">Controls WHO gets assigned. Hierarchy-aware types respect the case's department/BU.</small>
                </div>
                @if (stepAssigneeType === 'ROLE_IN_DEPARTMENT' || stepAssigneeType === 'ROLE_IN_BUSINESS_UNIT' || stepAssigneeType === 'ROLE_GLOBAL' || stepAssigneeType === 'FUNCTIONAL_TEAM' || stepAssigneeType === 'USER_DIRECT') {
                  <div class="form-group">
                    <label>
                      @if (stepAssigneeType === 'USER_DIRECT') { Specific user-ids (comma-separated) }
                      @else if (stepAssigneeType === 'FUNCTIONAL_TEAM') { Fallback role (optional) }
                      @else { Role name }
                    </label>
                    <input [(ngModel)]="stepAssigneeValue"
                           [placeholder]="stepAssigneeType === 'USER_DIRECT' ? 'user-app1,user-mgmt' : 'e.g. REVIEWER'" />
                  </div>
                }
              </div>
              @if (stepAssigneeType === 'REPORTING_MANAGER') {
                <div class="form-row">
                  <div class="form-group checkbox-group">
                    <label><input type="checkbox" [(ngModel)]="stepCascadeManager" />
                      Cascade up the management chain (resolve to previous actor's manager instead of submitter's manager)
                    </label>
                  </div>
                </div>
              }
              <div class="form-row">
                <div class="form-group">
                  <label>Condition Expression (optional)</label>
                  <input [(ngModel)]="stepCondition"
                         placeholder="e.g. estimatedCost >= 50000 AND caseTypeCode == 'CAPITAL'" />
                  <small class="form-hint">Identifiers: estimatedCost, categoryCode, caseTypeCode, departmentCode, businessUnitCode, priorityLevel, status, reworkCount. Operators: ==, !=, &gt;, &lt;, &gt;=, &lt;=, IN. Combine with AND / OR.</small>
                </div>
                <div class="form-group checkbox-group">
                  <label><input type="checkbox" [(ngModel)]="stepOptional" />
                    Optional step — skip silently when condition is false or no assignee
                  </label>
                </div>
              </div>
              @if (stepError()) { <div class="field-error">{{ stepError() }}</div> }
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="showStepModal.set(false)">Cancel</button>
              <button class="btn btn-primary" (click)="saveStep()" [disabled]="savingStep()">
                @if (savingStep()) { <span class="spinner-sm"></span> }
                {{ editStep() ? 'Update' : 'Add' }}
              </button>
            </div>
          </div>
        </div>
      }

      @if (confirmDeleteWf()) {
        <app-confirm-dialog title="Delete Workflow" [message]="'Delete workflow \\'' + confirmDeleteWf()!.workflowName + '\\'? It must be deactivated first. All steps will also be deleted.'" confirmText="Delete" confirmClass="btn-danger" icon="warning" iconClass="icon-danger"
          (confirmed)="deleteWf()" (cancelled)="confirmDeleteWf.set(null)" />
      }
      @if (confirmDeleteStep()) {
        <app-confirm-dialog title="Delete Step" [message]="'Delete step \\'' + confirmDeleteStep()!.stepName + '\\'?'" confirmText="Delete" confirmClass="btn-danger" icon="warning" iconClass="icon-danger"
          (confirmed)="deleteStep()" (cancelled)="confirmDeleteStep.set(null)" />
      }
    </div>
  `,
  styles: [`
    .workflows { animation: fadeIn 0.3s ease; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; }
    .workflow-card { padding: 28px; margin-bottom: 16px; }
    .workflow-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
    .workflow-title-row { display: flex; align-items: center; gap: 14px; }
    .workflow-icon { font-size: 32px; color: var(--color-primary); }
    .workflow-header h3 { font-size: 1.143rem; font-weight: 700; margin-bottom: 6px; }
    .wf-meta { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .wf-version { font-size: 0.714rem; color: var(--text-muted); }
    .wf-case-type { font-size: 0.714rem; padding: 2px 8px; border-radius: var(--radius-full); background: var(--color-primary-subtle); color: var(--color-primary); font-weight: 600; }
    .wf-actions { display: flex; align-items: center; gap: 4px; }
    .status-toggle {
      display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: var(--radius-full);
      font-size: 0.714rem; font-weight: 700; border: none; cursor: pointer; transition: all var(--transition-fast);
      background: var(--bg-hover); color: var(--text-muted);
      .material-icons-outlined { font-size: 20px; }
    }
    .status-toggle.active { background: var(--color-success-light); color: var(--color-success); }
    .workflow-steps { display: flex; flex-direction: column; align-items: center; margin-top: 20px; }
    .step { display: flex; align-items: center; gap: 16px; padding: 20px 24px; border: 1px solid var(--border-color-card); border-radius: var(--radius-lg); width: 100%; max-width: 650px; background: var(--bg-card); transition: all var(--transition-fast); }
    .step:hover { border-color: var(--color-primary); box-shadow: 0 2px 8px rgba(0,0,0,0.06); transform: translateY(-1px); }
    .step-number { width: 36px; height: 36px; border-radius: 50%; background: var(--color-primary); color: var(--bg-card); display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.857rem; flex-shrink: 0; }
    .step-info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
    .step-info strong { font-size: 0.929rem; }
    .step-info span { font-size: 0.786rem; color: var(--text-secondary); }
    .parallel-tag { font-size: 0.679rem; font-weight: 600; color: var(--color-info); background: var(--color-info-light); padding: 1px 8px; border-radius: var(--radius-full); display: inline-block; width: fit-content; }
    .step-sla { font-size: 0.714rem; font-weight: 600; color: var(--color-warning); background: var(--color-warning-light); padding: 2px 8px; border-radius: var(--radius-full); white-space: nowrap; }
    .step-role { font-size: 0.714rem; font-weight: 600; padding: 4px 12px; border-radius: var(--radius-full); background: var(--color-primary-subtle); color: var(--color-primary); }
    .step-actions { display: flex; gap: 2px; }
    .btn-icon-sm { padding: 4px; .material-icons-outlined { font-size: 16px; } }
    .step-connector { padding: 6px 0; color: var(--text-muted); .material-icons-outlined { font-size: 20px; } }
    .add-step-btn { margin-top: 16px; }
    .btn-icon-danger { color: var(--color-danger); &:hover { background: var(--color-danger-light); } }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .modal-lg { max-width: 600px; }
    .required { color: var(--color-danger); }
    .field-error { color: var(--color-danger); font-size: 0.786rem; margin-top: 8px; }
    .checkbox-group { display: flex; align-items: center; padding-top: 24px; label { display: flex; align-items: center; gap: 8px; cursor: pointer; } }
    .spinner-sm { width: 14px; height: 14px; border: 2px solid transparent; border-top-color: currentColor; border-radius: 50%; display: inline-block; animation: spin 0.6s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class WorkflowsComponent {
  private api = inject(ApiService);
  private toast = inject(ToastService);

  workflows = signal<any[]>([]);
  wfSteps = signal<any[]>([]);
  caseTypes = signal<any[]>([]);
  expandedWf = signal<string | null>(null);
  loading = signal(true);

  // Workflow modal
  showWfModal = signal(false);
  editWf = signal<any>(null);
  wfName = '';
  wfCaseTypeId = '';
  wfError = signal('');
  savingWf = signal(false);

  // Step modal
  showStepModal = signal(false);
  editStep = signal<any>(null);
  currentWfId = '';
  stepName = '';
  stepSeq = 1;
  stepApprovalType = 'STANDARD';
  stepRole = '';
  stepSla: number | null = null;
  stepParallel = false;
  stepParallelStrategy = 'ALL';
  stepAssigneeType = 'ROLE_GLOBAL';
  stepAssigneeValue = '';
  stepCondition = '';
  stepOptional = false;
  stepCascadeManager = false;
  stepError = signal('');
  savingStep = signal(false);

  // Confirm dialogs
  confirmDeleteWf = signal<any>(null);
  confirmDeleteStep = signal<any>(null);

  constructor() { this.load(); }

  async load() {
    this.loading.set(true);
    try {
      const [defs, cts] = await Promise.all([
        this.api.getWorkflowDefinitions(),
        this.api.getAllCaseTypes()
      ]);
      this.workflows.set(defs ?? []);
      this.caseTypes.set((cts ?? []).map((c: any) => ({ id: c.id, name: c.name })));
    } catch { this.workflows.set([]); }
    this.loading.set(false);
  }

  getCaseTypeName(id: string): string {
    return this.caseTypes().find(c => c.id === id)?.name || id || 'N/A';
  }

  async toggleSteps(wfId: string) {
    if (this.expandedWf() === wfId) { this.expandedWf.set(null); return; }
    this.expandedWf.set(wfId);
    try { this.wfSteps.set(await this.api.getWorkflowSteps(wfId) ?? []); }
    catch { this.wfSteps.set([]); }
  }

  /* ──── Workflow CRUD ──── */
  openAddWf() { this.editWf.set(null); this.wfName = ''; this.wfCaseTypeId = ''; this.wfError.set(''); this.showWfModal.set(true); }

  openEditWf(wf: any) {
    this.editWf.set(wf);
    this.wfName = wf.workflowName;
    this.wfCaseTypeId = wf.caseTypeId ?? '';
    this.wfError.set('');
    this.showWfModal.set(true);
  }

  async saveWf() {
    if (!this.wfName.trim()) { this.wfError.set('Workflow name is required'); return; }
    if (!this.wfCaseTypeId) { this.wfError.set('Case type is required'); return; }
    this.savingWf.set(true);
    try {
      if (this.editWf()) {
        await this.api.updateWorkflowDef(this.editWf().workflowId, { workflowName: this.wfName.trim(), caseTypeId: this.wfCaseTypeId });
        this.toast.success('Workflow updated');
      } else {
        await this.api.createWorkflowDef({ workflowName: this.wfName.trim(), caseTypeId: this.wfCaseTypeId });
        this.toast.success('Workflow created');
      }
      this.showWfModal.set(false);
      await this.load();
    } catch (e: any) { this.wfError.set(e?.error?.message || 'Failed'); this.toast.error(e?.error?.message || 'Operation failed'); }
    this.savingWf.set(false);
  }

  async toggleWf(wf: any) {
    try {
      await this.api.updateWorkflowDef(wf.workflowId, { activeFlag: !wf.activeFlag });
      this.toast.success(wf.activeFlag ? 'Deactivated' : 'Activated');
      await this.load();
    } catch (e: any) { this.toast.error(e?.error?.message || 'Failed'); }
  }

  async deleteWf() {
    const wf = this.confirmDeleteWf();
    if (!wf) return;
    try {
      await this.api.deleteWorkflowDef(wf.workflowId);
      this.toast.success('Workflow deleted');
      this.confirmDeleteWf.set(null);
      if (this.expandedWf() === wf.workflowId) this.expandedWf.set(null);
      await this.load();
    } catch (e: any) { this.toast.error(e?.error?.message || 'Failed to delete'); this.confirmDeleteWf.set(null); }
  }

  /* ──── Step CRUD ──── */
  openAddStep(wfId: string) {
    this.editStep.set(null); this.currentWfId = wfId;
    this.stepName = ''; this.stepSeq = (this.wfSteps().length + 1); this.stepApprovalType = 'STANDARD';
    this.stepRole = ''; this.stepSla = null; this.stepParallel = false; this.stepError.set('');
    this.stepParallelStrategy = 'ALL';
    this.stepAssigneeType = 'ROLE_GLOBAL';
    this.stepAssigneeValue = '';
    this.stepCondition = '';
    this.stepOptional = false;
    this.stepCascadeManager = false;
    this.showStepModal.set(true);
  }

  openEditStep(step: any) {
    this.editStep.set(step);
    this.stepName = step.stepName;
    this.stepSeq = step.sequenceNo;
    this.stepApprovalType = step.approvalType ?? 'STANDARD';
    this.stepRole = step.approverRole ?? '';
    this.stepSla = step.slaHours;
    this.stepParallel = step.parallel ?? false;
    this.stepParallelStrategy = step.parallelStrategy ?? 'ALL';
    this.stepAssigneeType = step.assigneeResolverType ?? 'ROLE_GLOBAL';
    this.stepAssigneeValue = step.assigneeResolverValue ?? '';
    this.stepCondition = step.conditionExpression ?? '';
    this.stepOptional = step.optional ?? false;
    this.stepCascadeManager = step.cascadeManager ?? false;
    this.stepError.set('');
    this.showStepModal.set(true);
  }

  async saveStep() {
    if (!this.stepName.trim()) { this.stepError.set('Step name is required'); return; }
    // Resolver types that don't need a value: REPORTING_MANAGER, DEPARTMENT_HEAD, BUSINESS_UNIT_HEAD
    const needsValue = ['ROLE_IN_DEPARTMENT', 'ROLE_IN_BUSINESS_UNIT', 'ROLE_GLOBAL', 'USER_DIRECT'];
    if (needsValue.includes(this.stepAssigneeType) && !this.stepAssigneeValue.trim()) {
      this.stepError.set('This resolver requires a role name or user-id list');
      return;
    }
    this.savingStep.set(true);
    const body: any = {
      stepName: this.stepName.trim(), sequenceNo: this.stepSeq, approvalType: this.stepApprovalType,
      approverRole: this.stepRole || this.stepAssigneeValue.trim() || null,
      slaHours: this.stepSla, parallel: this.stepParallel,
      parallelStrategy: this.stepParallel ? this.stepParallelStrategy : null,
      assigneeResolverType: this.stepAssigneeType,
      assigneeResolverValue: this.stepAssigneeValue.trim() || null,
      conditionExpression: this.stepCondition.trim() || null,
      optional: this.stepOptional,
      cascadeManager: this.stepCascadeManager,
    };
    try {
      if (this.editStep()) {
        await this.api.updateWorkflowStep(this.editStep().stepId, body);
        this.toast.success('Step updated');
      } else {
        await this.api.addWorkflowStep(this.currentWfId, body);
        this.toast.success('Step added');
      }
      this.showStepModal.set(false);
      // Reload steps
      this.wfSteps.set(await this.api.getWorkflowSteps(this.expandedWf()!) ?? []);
    } catch (e: any) { this.stepError.set(e?.error?.message || 'Failed'); this.toast.error(e?.error?.message || 'Operation failed'); }
    this.savingStep.set(false);
  }

  async deleteStep() {
    const step = this.confirmDeleteStep();
    if (!step) return;
    try {
      await this.api.deleteWorkflowStep(step.stepId);
      this.toast.success('Step deleted');
      this.confirmDeleteStep.set(null);
      this.wfSteps.set(await this.api.getWorkflowSteps(this.expandedWf()!) ?? []);
    } catch (e: any) { this.toast.error(e?.error?.message || 'Failed'); this.confirmDeleteStep.set(null); }
  }
}
