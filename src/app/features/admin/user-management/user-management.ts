import { Component, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { TooltipDirective } from '../../../shared/directives/tooltip.directive';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader';

const ALL_ROLES = ['ADMIN', 'SUBMITTER', 'REVIEWER', 'APPROVER', 'AUDITOR', 'MANAGEMENT'];

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [FormsModule, TooltipDirective, SkeletonLoaderComponent],
  template: `
    <div class="user-management">
      <div class="page-header">
        <div>
          <h1>User Management</h1>
          <p class="subtitle">Manage system users and their roles</p>
        </div>
        <button class="btn btn-primary" (click)="openAdd()">
          <span class="material-icons-outlined">person_add</span> New User
        </button>
      </div>
      <div class="card">
        <div class="filters-row">
          <div class="search-box">
            <span class="material-icons-outlined search-icon">search</span>
            <input type="text" placeholder="Search users..." [(ngModel)]="search" (ngModelChange)="loadUsers()" />
          </div>
          <select [(ngModel)]="roleFilter" (ngModelChange)="loadUsers()" class="filter-select">
            <option value="">All Roles</option>
            @for (r of roles; track r) { <option [value]="r">{{ r }}</option> }
          </select>
          <select [(ngModel)]="statusFilter" (ngModelChange)="loadUsers()" class="filter-select">
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>

        @if (loading()) {
          <app-skeleton variant="rect" width="100%" height="200px" />
        } @else {
          <div class="results-info">
            <span>{{ filteredUsers().length }} user{{ filteredUsers().length !== 1 ? 's' : '' }}</span>
          </div>

          <div class="table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Roles</th>
                  <th>Status</th>
                  <th style="width:100px">Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (user of filteredUsers(); track user.userId; let idx = $index) {
                  <tr [style.animation-delay]="idx * 50 + 'ms'" style="animation: fadeInUp 0.25s ease backwards">
                    <td>
                      <div class="user-cell">
                        <div class="user-avatar">{{ getInitials(user.fullName) }}</div>
                        <div>
                          <strong class="user-name">{{ user.fullName }}</strong>
                          <span class="emp-code">{{ user.employeeCode }}</span>
                        </div>
                      </div>
                    </td>
                    <td class="email-cell">{{ user.email }}</td>
                    <td>{{ user.departmentName }}</td>
                    <td>
                      @for (r of user.roles; track r) {
                        <span class="badge badge-role">{{ r }}</span>
                      }
                    </td>
                    <td>
                      <button class="status-toggle" [class.active]="user.status === 'ACTIVE'" (click)="toggleStatus(user)" [appTooltip]="user.status === 'ACTIVE' ? 'Deactivate' : 'Activate'">
                        <span class="material-icons-outlined">{{ user.status === 'ACTIVE' ? 'toggle_on' : 'toggle_off' }}</span>
                        {{ user.status }}
                      </button>
                    </td>
                    <td class="actions-cell">
                      <button class="btn-icon" (click)="openEdit(user)" appTooltip="Edit"><span class="material-icons-outlined">edit</span></button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          @if (filteredUsers().length === 0) {
            <div class="empty-state">
              <span class="empty-icon material-icons-outlined">person_search</span>
              <h3>No users found</h3>
              <p>Try adjusting your search or filter criteria.</p>
            </div>
          }
        }
      </div>

      <!-- Add/Edit User Modal -->
      @if (showModal()) {
        <div class="overlay" (click)="showModal.set(false)">
          <div class="modal modal-lg" (click)="$event.stopPropagation()" style="animation: modalIn 0.3s ease">
            <div class="modal-header">
              <h2>{{ editUser() ? 'Edit' : 'New' }} User</h2>
              <button class="btn-icon" (click)="showModal.set(false)"><span class="material-icons-outlined">close</span></button>
            </div>
            <div class="modal-body">
              <div class="form-row">
                <div class="form-group">
                  <label>Full Name <span class="required">*</span></label>
                  <input [(ngModel)]="formName" placeholder="John Doe" />
                </div>
                <div class="form-group">
                  <label>Employee Code</label>
                  <input [(ngModel)]="formEmpCode" placeholder="EMP001" />
                </div>
              </div>
              <div class="form-group">
                <label>Email <span class="required">*</span></label>
                <input type="email" [(ngModel)]="formEmail" placeholder="john.doe&#64;company.com" [disabled]="!!editUser()" />
              </div>
              @if (!editUser()) {
                <div class="form-group">
                  <label>Password <span class="required">*</span></label>
                  <input type="password" [(ngModel)]="formPassword" placeholder="Min 8 characters" />
                </div>
              }
              <div class="form-row">
                <div class="form-group">
                  <label>Department <span class="required">*</span></label>
                  <select [(ngModel)]="formDept">
                    <option value="">Select department</option>
                    @for (d of departments(); track d.id) { <option [value]="d.id">{{ d.name }}</option> }
                  </select>
                </div>
                <div class="form-group">
                  <label>Business Unit <span class="required">*</span></label>
                  <select [(ngModel)]="formBu">
                    <option value="">Select business unit</option>
                    @for (b of businessUnits(); track b.id) { <option [value]="b.id">{{ b.name }}</option> }
                  </select>
                </div>
              </div>
              <div class="form-group">
                <label>Roles <span class="required">*</span></label>
                <div class="roles-grid">
                  @for (r of roles; track r) {
                    <label class="role-check" [class.checked]="formRoles.includes(r)">
                      <input type="checkbox" [checked]="formRoles.includes(r)" (change)="toggleRole(r)" /> {{ r }}
                    </label>
                  }
                </div>
              </div>
              @if (formError()) { <div class="field-error">{{ formError() }}</div> }
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="showModal.set(false)">Cancel</button>
              <button class="btn btn-primary" (click)="saveUser()" [disabled]="saving()">
                @if (saving()) { <span class="spinner-sm"></span> }
                {{ editUser() ? 'Update' : 'Create' }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .user-management { animation: fadeIn 0.3s ease; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; }
    .filters-row { display: flex; gap: 12px; margin-bottom: 12px; flex-wrap: wrap; }
    .search-box { position: relative; flex: 1; min-width: 220px; }
    .search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-muted); font-size: 18px; }
    .search-box input { padding-left: 38px; }
    .filter-select { width: auto; min-width: 140px; }
    .results-info { font-size: 0.786rem; color: var(--text-muted); margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid var(--border-color-card); }
    .table-wrapper { overflow-x: auto; margin: 0 -24px; padding: 0 24px; }
    .user-cell { display: flex; align-items: center; gap: 12px; }
    .user-avatar { width: 40px; height: 40px; border-radius: 50%; background: var(--color-primary-light); color: var(--color-primary); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.857rem; flex-shrink: 0; }
    .user-name { display: block; font-size: 0.857rem; font-weight: 700; }
    .emp-code { font-size: 0.714rem; color: var(--text-muted); }
    .email-cell { font-size: 0.857rem; color: var(--text-secondary); }
    .badge-role { background: var(--color-primary-light); color: var(--color-primary); margin-right: 4px; }
    .status-toggle {
      display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: var(--radius-full);
      font-size: 0.714rem; font-weight: 700; border: none; cursor: pointer; transition: all var(--transition-fast);
      background: var(--bg-hover); color: var(--text-muted);
      .material-icons-outlined { font-size: 20px; }
    }
    .status-toggle.active { background: var(--color-success-light); color: var(--color-success); }
    .actions-cell { white-space: nowrap; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .modal-lg { max-width: 600px; }
    .roles-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
    .role-check {
      display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-radius: var(--radius-md);
      border: 1px solid var(--border-color-card); cursor: pointer; transition: all var(--transition-fast);
      font-size: 0.786rem; font-weight: 600;
      input { accent-color: var(--color-primary); }
    }
    .role-check.checked { background: var(--color-primary-light); border-color: var(--color-primary); color: var(--color-primary); }
    .required { color: var(--color-danger); }
    .field-error { color: var(--color-danger); font-size: 0.786rem; margin-top: 8px; }
    .spinner-sm { width: 14px; height: 14px; border: 2px solid transparent; border-top-color: currentColor; border-radius: 50%; display: inline-block; animation: spin 0.6s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class UserManagementComponent {
  private api = inject(ApiService);
  private toast = inject(ToastService);

  roles = ALL_ROLES;
  search = '';
  roleFilter = '';
  statusFilter = '';
  users = signal<any[]>([]);
  loading = signal(true);

  // Lookup data
  departments = signal<any[]>([]);
  businessUnits = signal<any[]>([]);

  // Modal
  showModal = signal(false);
  editUser = signal<any>(null);
  formName = '';
  formEmpCode = '';
  formEmail = '';
  formPassword = '';
  formDept = '';
  formBu = '';
  formRoles: string[] = [];
  formError = signal('');
  saving = signal(false);

  constructor() { this.init(); }

  async init() {
    const [deps, bus] = await Promise.all([
      this.api.getAllDepartments().catch(() => []),
      this.api.getAllBusinessUnits().catch(() => []),
    ]);
    this.departments.set((deps ?? []).map((d: any) => ({ id: d.id, name: d.name })));
    this.businessUnits.set((bus ?? []).map((b: any) => ({ id: b.id, name: b.name })));
    await this.loadUsers();
  }

  async loadUsers() {
    this.loading.set(true);
    try {
      const params: Record<string, string> = {};
      if (this.search) params['q'] = this.search;
      if (this.statusFilter) params['status'] = this.statusFilter;
      const res = await this.api.getUsers(params);
      let list: any[] = res?.content ?? res ?? [];
      if (this.roleFilter) {
        list = list.filter((u: any) => u.roles?.includes(this.roleFilter));
      }
      this.users.set(list);
    } catch { this.users.set([]); }
    this.loading.set(false);
  }

  filteredUsers(): any[] { return this.users(); }

  getInitials(name: string): string {
    return name?.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() || '?';
  }

  toggleRole(role: string) {
    if (this.formRoles.includes(role)) {
      this.formRoles = this.formRoles.filter(r => r !== role);
    } else {
      this.formRoles = [...this.formRoles, role];
    }
  }

  openAdd() {
    this.editUser.set(null);
    this.formName = ''; this.formEmpCode = ''; this.formEmail = ''; this.formPassword = '';
    this.formDept = ''; this.formBu = ''; this.formRoles = ['SUBMITTER']; this.formError.set('');
    this.showModal.set(true);
  }

  openEdit(user: any) {
    this.editUser.set(user);
    this.formName = user.fullName;
    this.formEmpCode = user.employeeCode ?? '';
    this.formEmail = user.email;
    this.formDept = user.departmentId ?? '';
    this.formBu = user.businessUnitId ?? '';
    this.formRoles = [...(user.roles ?? [])];
    this.formError.set('');
    this.showModal.set(true);
  }

  async saveUser() {
    if (!this.formName.trim()) { this.formError.set('Full name is required'); return; }
    if (!this.formEmail.trim()) { this.formError.set('Email is required'); return; }
    if (!this.formDept) { this.formError.set('Department is required'); return; }
    if (!this.formBu) { this.formError.set('Business unit is required'); return; }
    if (this.formRoles.length === 0) { this.formError.set('At least one role is required'); return; }
    if (!this.editUser() && !this.formPassword) { this.formError.set('Password is required'); return; }

    this.saving.set(true);
    try {
      if (this.editUser()) {
        await this.api.updateUser(this.editUser().userId, {
          fullName: this.formName.trim(),
          employeeCode: this.formEmpCode || null,
          departmentId: this.formDept,
          businessUnitId: this.formBu,
          roles: this.formRoles,
        });
        this.toast.success('User updated');
      } else {
        await this.api.createUser({
          fullName: this.formName.trim(),
          email: this.formEmail.trim(),
          password: this.formPassword,
          employeeCode: this.formEmpCode || null,
          departmentId: this.formDept,
          businessUnitId: this.formBu,
          roles: this.formRoles,
          status: 'ACTIVE',
        });
        this.toast.success('User created');
      }
      this.showModal.set(false);
      await this.loadUsers();
    } catch (e: any) {
      const msg = e?.error?.message || e?.message || 'Operation failed';
      this.formError.set(msg);
      this.toast.error(msg);
    }
    this.saving.set(false);
  }

  async toggleStatus(user: any) {
    const newStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await this.api.toggleUserStatus(user.userId, newStatus);
      this.toast.success(`User ${newStatus.toLowerCase()}`);
      await this.loadUsers();
    } catch { this.toast.error('Failed to update status'); }
  }
}
