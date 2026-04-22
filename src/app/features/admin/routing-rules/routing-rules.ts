import { Component, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { TooltipDirective } from '../../../shared/directives/tooltip.directive';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader';

@Component({
  selector: 'app-routing-rules',
  standalone: true,
  imports: [FormsModule, TooltipDirective, ConfirmDialogComponent, SkeletonLoaderComponent],
  template: `
    <div class="routing-rules">
      <div class="page-header">
        <div>
          <h1>Routing Rules</h1>
          <p class="subtitle">Configure automatic case assignment rules</p>
        </div>
        <button class="btn btn-primary" (click)="openAdd()">
          <span class="material-icons-outlined">add</span> New Rule
        </button>
      </div>
      <div class="card">
        <div class="table-toolbar">
          <h2><span class="material-icons-outlined card-icon">route</span> Routing Rules</h2>
          <span class="rule-count">{{ rules().length }} rule{{ rules().length !== 1 ? 's' : '' }}</span>
        </div>
        @if (loading()) {
          <app-skeleton variant="rect" width="100%" height="200px" />
        } @else {
          <div class="table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th style="width:60px">Priority</th>
                  <th>Rule Name</th>
                  <th>Case Type</th>
                  <th>Category</th>
                  <th>Department</th>
                  <th>Workflow</th>
                  <th>Status</th>
                  <th style="width:100px">Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (rule of rules(); track rule.routingRuleId; let idx = $index) {
                  <tr [style.animation-delay]="idx * 60 + 'ms'" style="animation: fadeInUp 0.25s ease backwards">
                    <td><span class="priority-badge">{{ rule.priorityOrder }}</span></td>
                    <td class="name-cell">{{ rule.ruleName || '—' }}</td>
                    <td>{{ lookupName('caseTypes', rule.caseTypeId) }}</td>
                    <td>{{ lookupName('categories', rule.categoryId) }}</td>
                    <td>{{ lookupName('departments', rule.departmentId) }}</td>
                    <td class="wf-cell">{{ lookupName('workflows', rule.workflowId) }}</td>
                    <td>
                      <button class="status-toggle" [class.active]="rule.activeFlag" (click)="toggleRule(rule)">
                        <span class="material-icons-outlined">{{ rule.activeFlag ? 'toggle_on' : 'toggle_off' }}</span>
                      </button>
                    </td>
                    <td class="actions-cell">
                      <button class="btn-icon" (click)="openEdit(rule)" appTooltip="Edit"><span class="material-icons-outlined">edit</span></button>
                      <button class="btn-icon btn-icon-danger" (click)="confirmDelete.set(rule)" appTooltip="Delete">
                        <span class="material-icons-outlined">delete</span>
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          @if (rules().length === 0) {
            <div class="empty-state"><span class="empty-icon material-icons-outlined">route</span><h3>No routing rules configured</h3></div>
          }
        }
      </div>

      <!-- Add/Edit Modal -->
      @if (showModal()) {
        <div class="overlay" (click)="showModal.set(false)">
          <div class="modal modal-lg" (click)="$event.stopPropagation()" style="animation: modalIn 0.3s ease">
            <div class="modal-header">
              <h2>{{ editRule() ? 'Edit' : 'New' }} Routing Rule</h2>
              <button class="btn-icon" (click)="showModal.set(false)"><span class="material-icons-outlined">close</span></button>
            </div>
            <div class="modal-body">
              <div class="form-group">
                <label>Rule Name</label>
                <input [(ngModel)]="formName" placeholder="e.g. High-cost IT cases" />
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Case Type</label>
                  <select [(ngModel)]="formCaseType">
                    <option value="">Any</option>
                    @for (ct of caseTypes(); track ct.id) { <option [value]="ct.id">{{ ct.name }}</option> }
                  </select>
                </div>
                <div class="form-group">
                  <label>Category</label>
                  <select [(ngModel)]="formCategory">
                    <option value="">Any</option>
                    @for (cat of categories(); track cat.id) { <option [value]="cat.id">{{ cat.name }}</option> }
                  </select>
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Department</label>
                  <select [(ngModel)]="formDept">
                    <option value="">Any</option>
                    @for (d of departments(); track d.id) { <option [value]="d.id">{{ d.name }}</option> }
                  </select>
                </div>
                <div class="form-group">
                  <label>Priority Order</label>
                  <input type="number" [(ngModel)]="formPriority" min="1" />
                </div>
              </div>
              <div class="form-group">
                <label>Workflow <span class="required">*</span></label>
                <select [(ngModel)]="formWorkflow">
                  <option value="">Select workflow</option>
                  @for (wf of workflows(); track wf.id) { <option [value]="wf.id">{{ wf.name }}</option> }
                </select>
              </div>
              @if (formError()) { <div class="field-error">{{ formError() }}</div> }
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="showModal.set(false)">Cancel</button>
              <button class="btn btn-primary" (click)="saveRule()" [disabled]="saving()">
                @if (saving()) { <span class="spinner-sm"></span> }
                {{ editRule() ? 'Update' : 'Create' }}
              </button>
            </div>
          </div>
        </div>
      }

      @if (confirmDelete()) {
        <app-confirm-dialog title="Delete Rule" [message]="'Delete routing rule \\'' + (confirmDelete()!.ruleName || 'Unnamed') + '\\'?'" confirmText="Delete" confirmClass="btn-danger" icon="warning" iconClass="icon-danger"
          (confirmed)="deleteRule()" (cancelled)="confirmDelete.set(null)" />
      }
    </div>
  `,
  styles: [`
    .routing-rules { animation: fadeIn 0.3s ease; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; }
    .table-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .table-toolbar h2 { font-size: 1rem; font-weight: 700; display: flex; align-items: center; gap: 8px; }
    .card-icon { font-size: 20px; color: var(--color-primary); }
    .rule-count { font-size: 0.786rem; color: var(--text-muted); font-weight: 500; }
    .table-wrapper { overflow-x: auto; margin: 0 -24px; padding: 0 24px; }
    .priority-badge { display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 50%; background: var(--color-primary-light); color: var(--color-primary); font-weight: 800; font-size: 0.857rem; }
    .name-cell { font-weight: 600; }
    .wf-cell { font-size: 0.786rem; color: var(--text-secondary); }
    .actions-cell { white-space: nowrap; }
    .btn-icon-danger { color: var(--color-danger); &:hover { background: var(--color-danger-light); } }
    .status-toggle {
      display: inline-flex; align-items: center; gap: 4px; padding: 4px; border-radius: var(--radius-full);
      border: none; cursor: pointer; transition: all var(--transition-fast);
      background: transparent; color: var(--text-muted);
      .material-icons-outlined { font-size: 24px; }
    }
    .status-toggle.active { color: var(--color-success); }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .modal-lg { max-width: 600px; }
    .required { color: var(--color-danger); }
    .field-error { color: var(--color-danger); font-size: 0.786rem; margin-top: 8px; }
    .spinner-sm { width: 14px; height: 14px; border: 2px solid transparent; border-top-color: currentColor; border-radius: 50%; display: inline-block; animation: spin 0.6s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class RoutingRulesComponent {
  private api = inject(ApiService);
  private toast = inject(ToastService);

  rules = signal<any[]>([]);
  loading = signal(true);

  // Lookup data
  caseTypes = signal<any[]>([]);
  categories = signal<any[]>([]);
  departments = signal<any[]>([]);
  workflows = signal<any[]>([]);

  // Modal
  showModal = signal(false);
  editRule = signal<any>(null);
  formName = '';
  formCaseType = '';
  formCategory = '';
  formDept = '';
  formWorkflow = '';
  formPriority = 1;
  formError = signal('');
  saving = signal(false);

  confirmDelete = signal<any>(null);

  constructor() { this.load(); }

  async load() {
    this.loading.set(true);
    try {
      const [rules, cts, cats, deps, wfs] = await Promise.all([
        this.api.getAllRoutingRules(),
        this.api.getAllCaseTypes(),
        this.api.getAllCategories(),
        this.api.getAllDepartments(),
        this.api.getWorkflowDefinitions()
      ]);
      this.rules.set(rules ?? []);
      this.caseTypes.set((cts ?? []).map((c: any) => ({ id: c.id, name: c.name })));
      this.categories.set((cats ?? []).map((c: any) => ({ id: c.id, name: c.name })));
      this.departments.set((deps ?? []).map((d: any) => ({ id: d.id, name: d.name })));
      this.workflows.set((wfs ?? []).map((w: any) => ({ id: w.workflowId, name: w.workflowName })));
    } catch { this.rules.set([]); }
    this.loading.set(false);
  }

  lookupName(type: string, id: string | null): string {
    if (!id) return 'Any';
    const list: any[] = ({ caseTypes: this.caseTypes(), categories: this.categories(), departments: this.departments(), workflows: this.workflows() } as any)[type] ?? [];
    return list.find((x: any) => x.id === id)?.name || id;
  }

  openAdd() {
    this.editRule.set(null);
    this.formName = ''; this.formCaseType = ''; this.formCategory = ''; this.formDept = '';
    this.formWorkflow = ''; this.formPriority = (this.rules().length + 1); this.formError.set('');
    this.showModal.set(true);
  }

  openEdit(rule: any) {
    this.editRule.set(rule);
    this.formName = rule.ruleName ?? '';
    this.formCaseType = rule.caseTypeId ?? '';
    this.formCategory = rule.categoryId ?? '';
    this.formDept = rule.departmentId ?? '';
    this.formWorkflow = rule.workflowId ?? '';
    this.formPriority = rule.priorityOrder ?? 1;
    this.formError.set('');
    this.showModal.set(true);
  }

  async saveRule() {
    if (!this.formWorkflow) { this.formError.set('Workflow is required'); return; }
    this.saving.set(true);
    const body: any = {
      ruleName: this.formName || null,
      caseTypeId: this.formCaseType || null,
      categoryId: this.formCategory || null,
      departmentId: this.formDept || null,
      workflowId: this.formWorkflow,
      priorityOrder: this.formPriority,
    };
    try {
      if (this.editRule()) {
        await this.api.updateRoutingRule(this.editRule().routingRuleId, body);
        this.toast.success('Rule updated');
      } else {
        await this.api.createRoutingRule(body);
        this.toast.success('Rule created');
      }
      this.showModal.set(false);
      await this.load();
    } catch (e: any) { this.formError.set(e?.error?.message || 'Failed'); this.toast.error(e?.error?.message || 'Operation failed'); }
    this.saving.set(false);
  }

  async toggleRule(rule: any) {
    try {
      await this.api.updateRoutingRule(rule.routingRuleId, { activeFlag: !rule.activeFlag });
      this.toast.success(rule.activeFlag ? 'Rule deactivated' : 'Rule activated');
      await this.load();
    } catch { this.toast.error('Failed to update rule'); }
  }

  async deleteRule() {
    const rule = this.confirmDelete();
    if (!rule) return;
    try {
      await this.api.deleteRoutingRule(rule.routingRuleId);
      this.toast.success('Rule deleted');
      this.confirmDelete.set(null);
      await this.load();
    } catch (e: any) { this.toast.error(e?.error?.message || 'Failed to delete'); this.confirmDelete.set(null); }
  }
}
