import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SlicePipe } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { TooltipDirective } from '../../../shared/directives/tooltip.directive';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader';
import { PaginationComponent } from '../../../shared/components/pagination/pagination';

type Tab = 'departments' | 'businessUnits' | 'caseTypes' | 'categories';
type StatusFilter = 'all' | 'active' | 'inactive';

@Component({
  selector: 'app-master-data',
  standalone: true,
  imports: [FormsModule, SlicePipe, TooltipDirective, SkeletonLoaderComponent, PaginationComponent],
  template: `
    <div class="master-data">
      <div class="page-header">
        <div>
          <h1>Master Data Management</h1>
          <p class="subtitle">Manage reference data for the system</p>
        </div>
      </div>

      <div class="tabs">
        @for (t of tabsList; track t.key) {
          <button class="tab" [class.active]="activeTab() === t.key" (click)="switchTab(t.key)">
            <span class="material-icons-outlined tab-icon">{{ t.icon }}</span> {{ t.label }}
            <span class="tab-count">{{ getCount(t.key) }}</span>
          </button>
        }
      </div>

      <div class="card">
        <div class="table-toolbar">
          <h2><span class="material-icons-outlined card-icon">{{ tabIcon() }}</span> {{ tabLabel() }}</h2>
          <div class="toolbar-actions">
            <select class="filter-select" [(ngModel)]="statusFilter" (ngModelChange)="page.set(1)">
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
            <div class="search-box search-sm">
              <span class="material-icons-outlined search-icon">search</span>
              <input type="text" placeholder="Filter..." [(ngModel)]="searchQuery" (ngModelChange)="page.set(1)" />
            </div>
            <button class="btn btn-primary btn-sm" (click)="openAdd()" appTooltip="Add new item">
              <span class="material-icons-outlined">add</span> Add New
            </button>
          </div>
        </div>

        @if (loading()) {
          <app-skeleton variant="rect" width="100%" height="200px" />
        } @else {
          <table class="data-table">
            <thead>
              <tr>
                <th style="width:50px">#</th>
                <th>Code</th>
                <th>Name</th>
                <th>Description</th>
                @if (activeTab() === 'categories') { <th>Source</th> <th>Keywords</th> }
                <th style="width:100px">Status</th>
                <th style="width:120px">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (item of paged(); track item.id; let idx = $index) {
                <tr [style.animation-delay]="idx * 30 + 'ms'" style="animation: fadeInUp 0.2s ease backwards">
                  <td class="row-num">{{ (page() - 1) * pageSize() + idx + 1 }}</td>
                  <td class="code-cell"><span class="code-badge">{{ item.code || '—' }}</span></td>
                  <td class="name-cell">{{ item.name }}</td>
                  <td class="desc-cell">{{ item.description || '—' }}</td>
                  @if (activeTab() === 'categories') {
                    <td><span class="source-tag" [class.tag-ai]="item.sourceType === 'AI'" [class.tag-manual]="item.sourceType !== 'AI'">{{ item.sourceType || 'Manual' }}</span></td>
                    <td class="kw-cell">{{ item.keywords || '—' }}</td>
                  }
                  <td>
                    <button class="status-toggle" [class.active]="item.active" (click)="toggleActive(item)" [appTooltip]="item.active ? 'Deactivate' : 'Activate'">
                      <span class="material-icons-outlined">{{ item.active ? 'toggle_on' : 'toggle_off' }}</span>
                      {{ item.active ? 'Active' : 'Inactive' }}
                    </button>
                  </td>
                  <td class="actions-cell">
                    <button class="btn-icon" (click)="openEdit(item)" appTooltip="Edit"><span class="material-icons-outlined">edit</span></button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
          @if (filteredData().length === 0) {
            <div class="empty-state">
              <span class="empty-icon material-icons-outlined">inbox</span>
              <h3>No items found</h3>
            </div>
          } @else {
            <app-pagination
              [totalItems]="filteredData().length"
              [pageSize]="pageSize()"
              [currentPage]="page()"
              [showPageSize]="true"
              (pageChange)="page.set($event)"
              (pageSizeChange)="pageSize.set($event); page.set(1)" />
          }
        }
      </div>

      <!-- Add / Edit Modal -->
      @if (showModal()) {
        <div class="overlay" (click)="closeModal()">
          <div class="modal" (click)="$event.stopPropagation()" style="animation: modalIn 0.3s ease">
            <div class="modal-header">
              <h2>{{ editItem() ? 'Edit' : 'Add New' }} {{ tabLabel() | slice:0:-1 }}</h2>
              <button class="btn-icon" (click)="closeModal()"><span class="material-icons-outlined">close</span></button>
            </div>
            <div class="modal-body">
              @if (editItem()?.code) {
                <div class="form-group">
                  <label>Code</label>
                  <input [value]="editItem().code" disabled class="input-disabled" />
                  <small class="hint">Auto-generated. Cannot be changed.</small>
                </div>
              }
              <div class="form-group">
                <label>Name <span class="required">*</span></label>
                <input [(ngModel)]="formName" placeholder="Enter name" (keyup.enter)="saveItem()" />
                @if (formError()) { <span class="field-error">{{ formError() }}</span> }
              </div>
              <div class="form-group">
                <label>Description</label>
                <textarea [(ngModel)]="formDescription" placeholder="Brief description" rows="3"></textarea>
              </div>
              @if (activeTab() === 'categories') {
                <div class="form-group">
                  <label>Keywords</label>
                  <input [(ngModel)]="formKeywords" placeholder="Comma-separated keywords" />
                  <small class="hint">Used for AI auto-categorisation. Comma-separated terms.</small>
                </div>
                <div class="form-group">
                  <label>Source Type</label>
                  <select [(ngModel)]="formSourceType">
                    <option value="Manual">Manual</option>
                    <option value="AI">AI</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>
              }
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="closeModal()">Cancel</button>
              <button class="btn btn-primary" (click)="saveItem()" [disabled]="saving()">
                @if (saving()) { <span class="spinner-sm"></span> }
                {{ editItem() ? 'Update' : 'Create' }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .master-data { animation: fadeIn 0.3s ease; }
    .tab-icon { font-size: 17px; }
    .tab-count { font-size: 0.679rem; background: var(--bg-hover); padding: 1px 8px; border-radius: var(--radius-full); margin-left: 4px; }
    .table-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 12px; }
    .table-toolbar h2 { font-size: 1rem; font-weight: 700; display: flex; align-items: center; gap: 8px; }
    .toolbar-actions { display: flex; gap: 8px; align-items: center; }
    .search-sm { position: relative; }
    .search-sm .search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: var(--text-muted); font-size: 16px; }
    .search-sm input { padding-left: 32px; height: 34px; font-size: 0.786rem; width: 180px; }
    .card-icon { font-size: 20px; color: var(--color-primary); }
    .row-num { color: var(--text-muted); font-size: 0.786rem; text-align: center; }
    .code-cell { white-space: nowrap; }
    .code-badge {
      display: inline-block; padding: 2px 8px; border-radius: var(--radius-sm);
      font-size: 0.714rem; font-weight: 700; font-family: 'Courier New', monospace;
      background: var(--color-primary-light, rgba(37, 99, 235, 0.08)); color: var(--color-primary);
      letter-spacing: 0.5px;
    }
    .name-cell { font-weight: 600; }
    .desc-cell { color: var(--text-secondary); font-size: 0.786rem; max-width: 350px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .kw-cell { font-size: 0.786rem; color: var(--text-secondary); max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .actions-cell { white-space: nowrap; }
    .status-toggle {
      display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: var(--radius-full);
      font-size: 0.714rem; font-weight: 700; border: none; cursor: pointer; transition: all var(--transition-fast);
      background: var(--bg-hover); color: var(--text-muted);
      .material-icons-outlined { font-size: 20px; }
    }
    .status-toggle.active { background: var(--color-success-light); color: var(--color-success); }
    .required { color: var(--color-danger); }
    .field-error { color: var(--color-danger); font-size: 0.714rem; margin-top: 4px; display: block; }
    .hint { color: var(--text-muted); font-size: 0.714rem; margin-top: 4px; display: block; }
    .filter-select { height: 34px; padding: 0 10px; border: 1px solid var(--border-color); border-radius: var(--radius-md); background: var(--bg-card); color: var(--text-primary); font-size: 0.786rem; cursor: pointer; }
    .source-tag { font-size: 0.679rem; font-weight: 700; padding: 2px 8px; border-radius: var(--radius-full); text-transform: uppercase; letter-spacing: 0.4px; }
    .source-tag.tag-ai { background: rgba(139, 92, 246, 0.14); color: #7c3aed; }
    .source-tag.tag-manual { background: var(--bg-hover); color: var(--text-secondary); }
    .input-disabled { background: var(--bg-hover); color: var(--text-muted); cursor: not-allowed; }
    .spinner-sm { width: 14px; height: 14px; border: 2px solid transparent; border-top-color: currentColor; border-radius: 50%; display: inline-block; animation: spin 0.6s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class MasterDataComponent {
  private api = inject(ApiService);
  private toast = inject(ToastService);

  activeTab = signal<Tab>('departments');
  loading = signal(true);
  searchQuery = '';
  statusFilter: StatusFilter = 'all';
  page = signal(1);
  pageSize = signal(10);

  // Data signals per tab
  departments = signal<any[]>([]);
  businessUnits = signal<any[]>([]);
  caseTypes = signal<any[]>([]);
  categories = signal<any[]>([]);

  // Modal state
  showModal = signal(false);
  editItem = signal<any>(null);
  formName = '';
  formKeywords = '';
  formDescription = '';
  formSourceType = 'Manual';
  formError = signal('');
  saving = signal(false);

  tabsList: { key: Tab; label: string; icon: string }[] = [
    { key: 'departments', label: 'Departments', icon: 'business' },
    { key: 'businessUnits', label: 'Business Units', icon: 'account_tree' },
    { key: 'caseTypes', label: 'Case Types', icon: 'category' },
    { key: 'categories', label: 'Categories', icon: 'label' },
  ];

  tabLabel = () => ({ departments: 'Departments', businessUnits: 'Business Units', caseTypes: 'Case Types', categories: 'Categories' }[this.activeTab()]);
  tabIcon = () => ({ departments: 'business', businessUnits: 'account_tree', caseTypes: 'category', categories: 'label' }[this.activeTab()]);

  constructor() { this.loadAll(); }

  getCount(key: Tab): number {
    return ({ departments: this.departments(), businessUnits: this.businessUnits(), caseTypes: this.caseTypes(), categories: this.categories() }[key] ?? []).length;
  }

  filteredData(): any[] {
    const data = { departments: this.departments(), businessUnits: this.businessUnits(), caseTypes: this.caseTypes(), categories: this.categories() }[this.activeTab()] ?? [];
    let filtered = data;
    if (this.statusFilter === 'active') filtered = filtered.filter((d: any) => d.active);
    else if (this.statusFilter === 'inactive') filtered = filtered.filter((d: any) => !d.active);
    if (!this.searchQuery.trim()) return filtered;
    const q = this.searchQuery.toLowerCase();
    return filtered.filter((d: any) =>
      d.name?.toLowerCase().includes(q) ||
      d.code?.toLowerCase().includes(q) ||
      d.description?.toLowerCase().includes(q) ||
      d.keywords?.toLowerCase().includes(q)
    );
  }

  paged(): any[] {
    const all = this.filteredData();
    const start = (this.page() - 1) * this.pageSize();
    return all.slice(start, start + this.pageSize());
  }

  switchTab(tab: Tab) { this.activeTab.set(tab); this.searchQuery = ''; this.page.set(1); }

  async loadAll() {
    this.loading.set(true);
    try {
      const [deps, bus, cts, cats] = await Promise.all([
        this.api.getAllDepartments(), this.api.getAllBusinessUnits(), this.api.getAllCaseTypes(), this.api.getAllCategories()
      ]);
      this.departments.set((deps ?? []).map((d: any) => ({ id: d.id, name: d.name, code: d.code, description: d.description, active: d.active })));
      this.businessUnits.set((bus ?? []).map((d: any) => ({ id: d.id, name: d.name, code: d.code, description: d.description, active: d.active })));
      this.caseTypes.set((cts ?? []).map((d: any) => ({ id: d.id, name: d.name, code: d.code, description: d.description, active: d.active })));
      this.categories.set((cats ?? []).map((d: any) => ({ id: d.id, name: d.name, code: d.code, description: d.description, sourceType: d.sourceType, keywords: d.keywords, active: d.active })));
    } catch { this.toast.error('Failed to load master data'); }
    this.loading.set(false);
  }

  openAdd() {
    this.editItem.set(null);
    this.formName = '';
    this.formKeywords = '';
    this.formDescription = '';
    this.formSourceType = 'Manual';
    this.formError.set('');
    this.showModal.set(true);
  }

  openEdit(item: any) {
    this.editItem.set(item);
    this.formName = item.name;
    this.formKeywords = item.keywords ?? '';
    this.formDescription = item.description ?? '';
    this.formSourceType = item.sourceType ?? 'Manual';
    this.formError.set('');
    this.showModal.set(true);
  }

  closeModal() { this.showModal.set(false); this.editItem.set(null); }

  async saveItem() {
    if (!this.formName.trim()) { this.formError.set('Name is required'); return; }
    this.formError.set('');
    this.saving.set(true);
    try {
      const tab = this.activeTab();
      const existing = this.editItem();
      if (existing) {
        const body: any = { name: this.formName.trim(), description: this.formDescription.trim() || null };
        if (tab === 'categories') {
          body.keywords = this.formKeywords;
          body.sourceType = this.formSourceType;
        }
        if (tab === 'departments') await this.api.updateDepartment(existing.id, body);
        else if (tab === 'businessUnits') await this.api.updateBusinessUnit(existing.id, body);
        else if (tab === 'caseTypes') await this.api.updateCaseType(existing.id, body);
        else if (tab === 'categories') await this.api.updateCategory(existing.id, body);
        this.toast.success(`${this.tabLabel()!.slice(0, -1)} updated`);
      } else {
        if (tab === 'departments') await this.api.createDepartment(this.formName.trim(), this.formDescription.trim() || undefined);
        else if (tab === 'businessUnits') await this.api.createBusinessUnit(this.formName.trim(), this.formDescription.trim() || undefined);
        else if (tab === 'caseTypes') await this.api.createCaseType(this.formName.trim(), this.formDescription.trim() || undefined);
        else if (tab === 'categories') await this.api.createCategory(this.formName.trim(), this.formDescription.trim() || undefined, this.formKeywords || undefined, this.formSourceType);
        this.toast.success(`${this.tabLabel()!.slice(0, -1)} created`);
      }
      this.closeModal();
      await this.loadAll();
    } catch (e: any) {
      const msg = e?.error?.message || e?.message || 'Operation failed';
      this.formError.set(msg);
      this.toast.error(msg);
    }
    this.saving.set(false);
  }

  async toggleActive(item: any) {
    try {
      const tab = this.activeTab();
      const body = { active: !item.active };
      if (tab === 'departments') await this.api.updateDepartment(item.id, body);
      else if (tab === 'businessUnits') await this.api.updateBusinessUnit(item.id, body);
      else if (tab === 'caseTypes') await this.api.updateCaseType(item.id, body);
      else if (tab === 'categories') await this.api.updateCategory(item.id, body);
      this.toast.success(item.active ? `${this.tabLabel()!.slice(0, -1)} deactivated` : `${this.tabLabel()!.slice(0, -1)} activated`);
      await this.loadAll();
    } catch {
      this.toast.error('Failed to update status');
    }
  }
}
