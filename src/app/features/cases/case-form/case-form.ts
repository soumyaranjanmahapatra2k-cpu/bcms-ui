import { Component, inject, signal, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MockDataService } from '../../../core/services/mock-data.service';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { TooltipDirective } from '../../../shared/directives/tooltip.directive';
import { VoiceInputComponent } from '../../../shared/components/voice-input/voice-input';
import { CaseStatus } from '../../../core/models/case.model';

@Component({
  selector: 'app-case-form',
  standalone: true,
  imports: [RouterLink, FormsModule, TooltipDirective, VoiceInputComponent],
  template: `
    <div class="case-form">
      <div class="page-header">
        <div>
          <h1>{{ isResubmit() ? 'Resubmit Case' : isEdit() ? 'Edit Case' : 'Create New Case' }}</h1>
          <p class="subtitle">{{ isResubmit() ? 'Make changes and resubmit for review' : isEdit() ? 'Update your draft case' : 'Submit a new business case for review' }}</p>
        </div>
      </div>

      <form (ngSubmit)="onSave()" #caseForm="ngForm">
        <div class="form-grid">
          <div class="form-main">
            <div class="card form-card">
              <div class="section-header">
                <span class="material-icons-outlined section-icon">info</span>
                <h2 class="section-title">Case Information</h2>
              </div>
              <div class="form-group">
                <label for="title">Title <span class="required">*</span></label>
                <input id="title" [(ngModel)]="form.title" name="title" required placeholder="Enter case title" (blur)="onTitleBlur()" />
              </div>
              <div class="form-group">
                <label for="summary">Summary <span class="required">*</span></label>
                <div class="textarea-voice-wrap">
                  <textarea id="summary" [(ngModel)]="form.summary" name="summary" required rows="3" placeholder="Brief description of the business case" (blur)="onTitleBlur()"></textarea>
                  <app-voice-input class="voice-pos" (transcribed)="appendTo('summary', $event)" />
                </div>
              </div>

              @if (aiSuggestions().length > 0) {
                <div class="ai-suggestion-bar">
                  <span class="material-icons-outlined ai-icon">smart_toy</span>
                  <span class="ai-label">AI Suggested Categories:</span>
                  @for (s of aiSuggestions(); track s.categoryId) {
                    <button type="button" class="ai-chip" [class.selected]="form.categoryId === s.categoryId" (click)="form.categoryId = s.categoryId">
                      {{ s.categoryName }} <span class="ai-conf">{{ s.confidence }}%</span>
                    </button>
                  }
                </div>
              }

              <div class="form-row">
                <div class="form-group">
                  <label for="caseType">Case Type <span class="required">*</span></label>
                  <select id="caseType" [(ngModel)]="form.caseTypeId" name="caseType" required>
                    <option value="">Select type</option>
                    @for (t of mockData.caseTypes; track t.id) {
                      <option [value]="t.id">{{ t.name }}</option>
                    }
                  </select>
                </div>
                <div class="form-group">
                  <label for="department">Department <span class="required">*</span></label>
                  <select id="department" [(ngModel)]="form.departmentId" name="department" required>
                    <option value="">Select department</option>
                    @for (d of mockData.departments; track d.id) {
                      <option [value]="d.id">{{ d.name }}</option>
                    }
                  </select>
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label for="bu">Business Unit <span class="required">*</span></label>
                  <select id="bu" [(ngModel)]="form.businessUnitId" name="bu" required>
                    <option value="">Select business unit</option>
                    @for (b of mockData.businessUnits; track b.id) {
                      <option [value]="b.id">{{ b.name }}</option>
                    }
                  </select>
                </div>
                <div class="form-group">
                  <label for="category">Category</label>
                  <select id="category" [(ngModel)]="form.categoryId" name="category">
                    <option value="">Select category (optional)</option>
                    @for (c of mockData.categories; track c.id) {
                      <option [value]="c.id">{{ c.name }}</option>
                    }
                  </select>
                </div>
              </div>
            </div>

            <div class="card form-card">
              <div class="section-header">
                <span class="material-icons-outlined section-icon">business</span>
                <h2 class="section-title">Business Details</h2>
              </div>
              <div class="form-group">
                <label for="justification">Business Justification <span class="required">*</span></label>
                <div class="textarea-voice-wrap">
                  <textarea id="justification" [(ngModel)]="form.businessJustification" name="justification" required rows="4" placeholder="Why is this case important?"></textarea>
                  <app-voice-input class="voice-pos" (transcribed)="appendTo('businessJustification', $event)" />
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label for="cost">Estimated Cost ($)</label>
                  <input id="cost" type="number" [(ngModel)]="form.estimatedCost" name="cost" placeholder="0" min="0" />
                </div>
                <div class="form-group">
                  <label for="benefit">Expected Benefit <span class="required">*</span></label>
                  <input id="benefit" [(ngModel)]="form.expectedBenefit" name="benefit" required placeholder="Key benefits" />
                </div>
              </div>
              <div class="form-group">
                <label for="risk">Risk Assessment</label>
                <div class="textarea-voice-wrap">
                  <textarea id="risk" [(ngModel)]="form.riskAssessment" name="risk" rows="3" placeholder="Identify potential risks"></textarea>
                  <app-voice-input class="voice-pos" (transcribed)="appendTo('riskAssessment', $event)" />
                </div>
              </div>
            </div>

            <div class="card form-card">
              <div class="section-header">
                <span class="material-icons-outlined section-icon">attach_file</span>
                <h2 class="section-title">Attachments</h2>
              </div>
              <div class="upload-area" (click)="fileInput.click()" (dragover)="$event.preventDefault()" (drop)="onDrop($event)">
                <input #fileInput type="file" multiple hidden (change)="onFilesSelected($event)" accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.png,.jpg,.jpeg,.txt" />
                <div class="upload-icon-wrap">
                  <span class="material-icons-outlined">cloud_upload</span>
                </div>
                <p>Drag & drop files here or click to browse</p>
                <span class="upload-hint">PDF, DOC, XLS, PNG, JPG up to 25MB each</span>
              </div>
              @if (pendingFiles.length > 0) {
                <div class="pending-files">
                  @for (f of pendingFiles; track f.name; let i = $index) {
                    <div class="pending-file">
                      <span class="material-icons-outlined">description</span>
                      <span class="pf-name">{{ f.name }}</span>
                      <span class="pf-size">{{ (f.size / 1024).toFixed(0) }} KB</span>
                      <button type="button" class="btn-icon" (click)="pendingFiles.splice(i, 1)">
                        <span class="material-icons-outlined">close</span>
                      </button>
                    </div>
                  }
                </div>
              }
            </div>
          </div>

          <div class="form-sidebar">
            <div class="card sidebar-sticky">
              <h3 class="sidebar-title">
                <span class="material-icons-outlined" style="font-size:18px">flash_on</span>
                Actions
              </h3>
              @if (autoSavedAt()) {
                <div class="auto-save-indicator">
                  <span class="material-icons-outlined" style="font-size:14px">cloud_done</span>
                  Auto-saved {{ autoSavedAt() }}
                </div>
              }
              <div class="action-btns">
                @if (isResubmit()) {
                  <button type="submit" class="btn btn-secondary full-width" [disabled]="saving()" appTooltip="Save changes without resubmitting">
                    @if (saving()) { <span class="spinner spinner-sm"></span> }
                    <span class="material-icons-outlined">save</span> Save Changes
                  </button>
                  <button type="button" class="btn btn-primary full-width" (click)="onSubmit()" [disabled]="saving()" appTooltip="Save changes and resubmit for review">
                    @if (saving()) { <span class="spinner spinner-sm"></span> }
                    <span class="material-icons-outlined">replay</span> Save & Resubmit
                  </button>
                } @else {
                  <button type="submit" class="btn btn-secondary full-width" [disabled]="saving()" appTooltip="Save without submitting">
                    @if (saving()) { <span class="spinner spinner-sm"></span> }
                    <span class="material-icons-outlined">save</span> Save as Draft
                  </button>
                  <button type="button" class="btn btn-primary full-width" (click)="onSubmit()" [disabled]="saving()" appTooltip="Save and submit for review">
                    @if (saving()) { <span class="spinner spinner-sm"></span> }
                    <span class="material-icons-outlined">send</span> Save & Submit
                  </button>
                }
                <div class="action-divider"></div>
                <button type="button" class="btn btn-ghost full-width" routerLink="/cases">
                  <span class="material-icons-outlined">close</span> Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .case-form { animation: fadeIn 0.3s ease; }
    .subtitle { font-size: 0.857rem; color: var(--text-secondary); }
    .form-grid { display: grid; grid-template-columns: 1fr 300px; gap: 24px; }
    .form-card { margin-bottom: 20px; }
    .section-header { display: flex; align-items: center; gap: 10px; margin-bottom: 24px; }
    .section-icon { font-size: 22px; color: var(--color-primary); }
    .section-title { font-size: 1rem; font-weight: 700; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .required { color: var(--color-danger); }
    .sidebar-sticky { position: sticky; top: calc(var(--navbar-height) + 28px); }
    .sidebar-title { font-size: 0.857rem; font-weight: 700; margin-bottom: 20px; display: flex; align-items: center; gap: 6px; }
    .action-btns { display: flex; flex-direction: column; gap: 10px; }
    .action-divider { height: 1px; background: var(--border-color); margin: 4px 0; }
    .full-width { width: 100%; justify-content: center; }
    .upload-area {
      border: 2px dashed var(--border-color); border-radius: var(--radius-xl);
      padding: 48px 24px; text-align: center; cursor: pointer;
      transition: all var(--transition-fast); background: var(--bg-hover);
    }
    .upload-area:hover { border-color: var(--color-primary); background: var(--color-primary-subtle); }
    .upload-icon-wrap {
      width: 56px; height: 56px; border-radius: var(--radius-xl);
      background: var(--color-primary-light); color: var(--color-primary);
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 12px;
      .material-icons-outlined { font-size: 28px; }
    }
    .upload-area p { font-size: 0.857rem; font-weight: 500; margin-bottom: 4px; }
    .upload-hint { font-size: 0.714rem; color: var(--text-muted); }
    .pending-files { display: flex; flex-direction: column; gap: 8px; margin-top: 16px; }
    .pending-file { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border: 1px solid var(--border-color-card); border-radius: var(--radius-md); font-size: 0.857rem; }
    .pf-name { flex: 1; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .pf-size { font-size: 0.714rem; color: var(--text-muted); }
    .ai-suggestion-bar {
      display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
      padding: 12px 16px; border-radius: var(--radius-lg); margin-bottom: 20px;
      background: var(--color-primary-subtle); border: 1px solid var(--color-primary-light);
    }
    .ai-icon { font-size: 20px; color: var(--color-primary); }
    .ai-label { font-size: 0.786rem; font-weight: 600; color: var(--color-primary); }
    .ai-chip {
      font-size: 0.75rem; font-weight: 600; padding: 4px 12px; border-radius: var(--radius-full);
      background: var(--bg-card); color: var(--text-primary); border: 1px solid var(--border-color);
      cursor: pointer; transition: all var(--transition-fast);
    }
    .ai-chip:hover { border-color: var(--color-primary); }
    .ai-chip.selected { background: var(--color-primary); color: var(--text-inverse); border-color: var(--color-primary); }
    .ai-conf { font-size: 0.65rem; opacity: 0.7; margin-left: 2px; }
    .auto-save-indicator {
      display: flex; align-items: center; gap: 6px; font-size: 0.714rem;
      color: var(--color-success); font-weight: 500; margin-bottom: 14px;
      padding: 6px 10px; border-radius: var(--radius-md);
      background: var(--color-success-light); animation: fadeIn 0.3s ease;
    }
    .textarea-voice-wrap { position: relative; }
    .textarea-voice-wrap textarea { padding-right: 42px; }
    .voice-pos { position: absolute; top: 8px; right: 8px; }
    @media (max-width: 1024px) { .form-grid { grid-template-columns: 1fr; } .form-row { grid-template-columns: 1fr; } }
  `]
})
export class CaseFormComponent implements OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private apiService = inject(ApiService);
  mockData = inject(MockDataService);

  isEdit = signal(false);
  isResubmit = signal(false);
  saving = signal(false);
  aiSuggestions = signal<any[]>([]);
  autoSavedAt = signal('');
  private editCaseId = '';
  private editCaseStatus: CaseStatus | '' = '';
  pendingFiles: File[] = [];
  private autoSaveTimer: ReturnType<typeof setInterval> | null = null;
  private formSnapshot = '';

  private readonly RESUBMIT_STATUSES: CaseStatus[] = ['REWORK_REQUIRED', 'CLARIFICATION_REQUIRED', 'MORE_INFO_REQUIRED'];

  form = {
    title: '', summary: '', caseTypeId: '', departmentId: '', businessUnitId: '',
    categoryId: '', businessJustification: '', estimatedCost: null as number | null,
    expectedBenefit: '', riskAssessment: '',
  };

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit.set(true);
      this.editCaseId = id;
      const c = this.mockData.getCaseById(id);
      if (c) {
        this.editCaseStatus = c.status;
        this.isResubmit.set(this.RESUBMIT_STATUSES.includes(c.status));
        this.form = {
          title: c.title, summary: c.summary, caseTypeId: c.caseType.id,
          departmentId: c.department.id, businessUnitId: c.businessUnit.id,
          categoryId: c.category?.id || '', businessJustification: c.businessJustification,
          estimatedCost: c.estimatedCost, expectedBenefit: c.expectedBenefit, riskAssessment: c.riskAssessment,
        };
      }
    } else {
      const user = this.auth.user();
      if (user) {
        this.form.departmentId = user.departmentId ? String(user.departmentId) : '';
        this.form.businessUnitId = user.businessUnitId ? String(user.businessUnitId) : '';
      }
    }
    this.formSnapshot = JSON.stringify(this.form);
    this.startAutoSave();
  }

  ngOnDestroy() {
    this.stopAutoSave();
  }

  private startAutoSave() {
    this.autoSaveTimer = setInterval(() => this.autoSaveDraft(), 10000);
  }

  private stopAutoSave() {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }

  private async autoSaveDraft() {
    const current = JSON.stringify(this.form);
    if (current === this.formSnapshot || this.saving() || !this.form.title.trim()) return;
    try {
      if (this.editCaseId) {
        await this.apiService.updateCase(this.editCaseId, this.form);
      } else {
        const resp = await this.apiService.createCase(this.form);
        this.editCaseId = resp.caseId;
        this.isEdit.set(true);
      }
      this.formSnapshot = current;
      const now = new Date();
      this.autoSavedAt.set(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch { /* silent auto-save failure */ }
  }

  appendTo(field: 'summary' | 'businessJustification' | 'riskAssessment', text: string) {
    const current = this.form[field] || '';
    this.form[field] = current ? current + ' ' + text : text;
  }

  onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.pendingFiles.push(...Array.from(input.files));
    }
    input.value = '';
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer?.files) {
      this.pendingFiles.push(...Array.from(event.dataTransfer.files));
    }
  }

  private aiDebounce: any = null;
  onTitleBlur() {
    if (this.aiDebounce) clearTimeout(this.aiDebounce);
    this.aiDebounce = setTimeout(() => {
      if (this.form.title.length > 5 || this.form.summary.length > 10) {
        this.apiService.aiCategorize(this.form.title, this.form.summary).then(suggestions => {
          this.aiSuggestions.set(suggestions ?? []);
        }).catch(() => {});
      }
    }, 600);
  }

  async onSave() {
    this.saving.set(true);
    try {
      let caseId: string;
      if (this.isEdit()) {
        await this.mockData.updateDraft(this.editCaseId, this.form);
        caseId = this.editCaseId;
      } else {
        caseId = await this.mockData.createDraft(this.form);
        this.editCaseId = caseId;
        this.isEdit.set(true);
      }
      this.formSnapshot = JSON.stringify(this.form);
      await this.uploadPendingFiles(caseId);
      this.toast.success(this.isResubmit() ? 'Changes saved' : (this.isEdit() ? 'Case updated as draft' : 'Case saved as draft'));
      this.router.navigate(['/cases', caseId]);
    } catch (e: any) {
      this.toast.error(e?.error?.message ?? 'Failed to save case');
    } finally {
      this.saving.set(false);
    }
  }

  async onSubmit() {
    this.saving.set(true);
    try {
      let caseId: string;
      if (this.isEdit()) {
        await this.mockData.updateDraft(this.editCaseId, this.form);
        caseId = this.editCaseId;
      } else {
        caseId = await this.mockData.createDraft(this.form);
        this.editCaseId = caseId;
        this.isEdit.set(true);
      }
      this.formSnapshot = JSON.stringify(this.form);
      await this.uploadPendingFiles(caseId);
      await this.mockData.submitCase(caseId);
      const msg = this.isResubmit() ? 'Case resubmitted for review' : (this.isEdit() ? 'Case updated and submitted' : 'Case created and submitted');
      this.toast.success(msg);
      this.router.navigate(['/cases', caseId]);
    } catch (e: any) {
      this.toast.error(e?.error?.message ?? 'Failed to submit case');
    } finally {
      this.saving.set(false);
    }
  }

  private async uploadPendingFiles(caseId: string) {
    for (const file of this.pendingFiles) {
      try {
        await this.mockData.uploadAttachment(caseId, file);
      } catch {
        this.toast.warning('Failed to upload: ' + file.name);
      }
    }
    this.pendingFiles = [];
  }
}
