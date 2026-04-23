import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

/** Thin HTTP wrapper. Every public method returns the unwrapped `data` field. */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private base = environment.apiBaseUrl;

  /* ──── generic helpers ──── */

  private async get<T>(path: string, params?: Record<string, string | number>): Promise<T> {
    let hp = new HttpParams();
    if (params) Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') hp = hp.set(k, String(v)); });
    const res: any = await firstValueFrom(this.http.get(`${this.base}${path}`, { params: hp }));
    return res?.data as T;
  }

  private async post<T>(path: string, body: any = {}): Promise<T> {
    const res: any = await firstValueFrom(this.http.post(`${this.base}${path}`, body));
    return res?.data as T;
  }

  private async put<T>(path: string, body: any = {}): Promise<T> {
    const res: any = await firstValueFrom(this.http.put(`${this.base}${path}`, body));
    return res?.data as T;
  }

  private async del<T>(path: string): Promise<T> {
    const res: any = await firstValueFrom(this.http.delete(`${this.base}${path}`));
    return res?.data as T;
  }

  /* ──── Auth ──── */
  login(email: string, password: string) { return this.post<any>('/auth/login', { email, password }); }

  /* ──── Cases ──── */
  listCases(params?: Record<string, string | number>) { return this.get<any>('/cases', params); }
  myCases(page = 0, size = 50) { return this.get<any>('/cases/my', { page, size }); }
  reviewQueue(page = 0, size = 50) { return this.get<any>('/cases/queue/review', { page, size }); }
  approvalQueue(page = 0, size = 50) { return this.get<any>('/cases/queue/approval', { page, size }); }
  getCase(id: string) { return this.get<any>(`/cases/${id}`); }
  createCase(body: any) {
    const payload = { ...body };
    if (payload.caseTypeId) payload.caseTypeId = Number(payload.caseTypeId);
    if (payload.departmentId) payload.departmentId = Number(payload.departmentId);
    if (payload.businessUnitId) payload.businessUnitId = Number(payload.businessUnitId);
    if (payload.categoryId) payload.categoryId = Number(payload.categoryId);
    return this.post<any>('/cases', payload);
  }
  updateCase(id: string, body: any) {
    const payload = { ...body };
    if (payload.caseTypeId) payload.caseTypeId = Number(payload.caseTypeId);
    if (payload.departmentId) payload.departmentId = Number(payload.departmentId);
    if (payload.businessUnitId) payload.businessUnitId = Number(payload.businessUnitId);
    if (payload.categoryId) payload.categoryId = Number(payload.categoryId);
    return this.put<any>(`/cases/${id}`, payload);
  }
  submitCase(id: string) { return this.post<any>(`/cases/${id}/submit`); }
  caseAction(id: string, action: string, comment: string) { return this.post<any>(`/cases/${id}/action`, { action, comment }); }
  reassignCase(id: string, toUserId: string, reason: string) { return this.post<any>(`/cases/${id}/reassign`, { toUserId, reason }); }
  cancelCase(id: string, reason?: string) { return this.post<any>(`/cases/${id}/cancel`, { reason }); }
  duplicateCheck(body: any) { return this.post<any>('/cases/duplicate-check', body); }

  /* ──── Comments & Timeline ──── */
  getComments(caseId: string) { return this.get<any[]>(`/cases/${caseId}/comments`); }
  addComment(caseId: string, text: string, type = 'General') { return this.post<any>(`/cases/${caseId}/comments`, { text, type }); }
  getTimeline(caseId: string) { return this.get<any[]>(`/cases/${caseId}/timeline`); }

  /* ──── Attachments ──── */
  listAttachments(caseId: string) { return this.get<any[]>(`/cases/${caseId}/attachments`); }
  uploadAttachment(caseId: string, file: File) {
    const fd = new FormData();
    fd.append('file', file, file.name);
    return firstValueFrom(this.http.post(`${this.base}/cases/${caseId}/attachments`, fd)).then((r: any) => r?.data);
  }
  downloadAttachmentUrl(caseId: string, attachmentId: string) {
    return `${this.base}/cases/${caseId}/attachments/${attachmentId}/download`;
  }
  deleteAttachment(caseId: string, attId: string) { return this.del(`/cases/${caseId}/attachments/${attId}`); }

  /* ──── Notifications ──── */
  getNotifications(page = 0, size = 100) { return this.get<any>('/notifications', { page, size }); }
  getUnreadCount() { return this.get<any>('/notifications/unread-count'); }
  markNotificationRead(id: string) { return this.post<any>(`/notifications/${id}/read`); }
  markAllNotificationsRead() { return this.post<any>('/notifications/read-all'); }

  /* ──── Dashboard ──── */
  getDashboardSummary() { return this.get<any>('/dashboard/summary'); }

  /* ──── Reports ──── */
  getReportAging() { return this.get<any[]>('/reports/aging'); }
  getReportByStatus() { return this.get<any>('/reports/by-status'); }
  getReportByDepartment() { return this.get<any>('/reports/by-department'); }
  getReportCostSummary() { return this.get<any>('/reports/cost-summary'); }

  /* ──── Audit ──── */
  getAuditLogs(params?: Record<string, string | number>) { return this.get<any>('/audit', params); }

  /* ──── Master Data: Departments ──── */
  getDepartments() { return this.get<any[]>('/master-data/departments'); }
  getAllDepartments() { return this.get<any[]>('/master-data/departments/all'); }
  getDepartmentById(id: number) { return this.get<any>(`/master-data/departments/${id}`); }
  createDepartment(name: string, description?: string) { return this.post<any>('/master-data/departments', { name, description }); }
  updateDepartment(id: number, body: any) { return this.put<any>(`/master-data/departments/${id}`, body); }

  /* ──── Master Data: Business Units ──── */
  getBusinessUnits() { return this.get<any[]>('/master-data/business-units'); }
  getAllBusinessUnits() { return this.get<any[]>('/master-data/business-units/all'); }
  getBusinessUnitById(id: number) { return this.get<any>(`/master-data/business-units/${id}`); }
  createBusinessUnit(name: string, description?: string) { return this.post<any>('/master-data/business-units', { name, description }); }
  updateBusinessUnit(id: number, body: any) { return this.put<any>(`/master-data/business-units/${id}`, body); }

  /* ──── Master Data: Case Types ──── */
  getCaseTypes() { return this.get<any[]>('/master-data/case-types'); }
  getAllCaseTypes() { return this.get<any[]>('/master-data/case-types/all'); }
  getCaseTypeById(id: number) { return this.get<any>(`/master-data/case-types/${id}`); }
  createCaseType(name: string, description?: string) { return this.post<any>('/master-data/case-types', { name, description }); }
  updateCaseType(id: number, body: any) { return this.put<any>(`/master-data/case-types/${id}`, body); }

  /* ──── Master Data: Categories ──── */
  getCategories() { return this.get<any[]>('/master-data/categories'); }
  getAllCategories() { return this.get<any[]>('/master-data/categories/all'); }
  getCategoryById(id: number) { return this.get<any>(`/master-data/categories/${id}`); }
  createCategory(name: string, description?: string, keywords?: string, sourceType?: string) {
    return this.post<any>('/master-data/categories', { name, description, keywords, sourceType });
  }
  updateCategory(id: number, body: any) { return this.put<any>(`/master-data/categories/${id}`, body); }

  /* ──── Master Data: Statuses ──── */
  getStatuses() { return this.get<any[]>('/master-data/statuses'); }
  getAllStatuses() { return this.get<any[]>('/master-data/statuses/all'); }
  /* ──── Users ──── */
  getUsers(params?: Record<string, string | number>) { return this.get<any>('/users', params); }
  getUser(id: string) { return this.get<any>(`/users/${id}`); }
  getUsersByRole(role: string) { return this.get<any[]>(`/users/by-role/${role}`); }
  createUser(body: any) {
    const payload = { ...body };
    if (payload.departmentId) payload.departmentId = Number(payload.departmentId);
    if (payload.businessUnitId) payload.businessUnitId = Number(payload.businessUnitId);
    return this.post<any>('/users', payload);
  }
  updateUser(id: string, body: any) {
    const payload = { ...body };
    if (payload.departmentId) payload.departmentId = Number(payload.departmentId);
    if (payload.businessUnitId) payload.businessUnitId = Number(payload.businessUnitId);
    return this.put<any>(`/users/${id}`, payload);
  }
  toggleUserStatus(id: string, status: string) { return this.put<any>(`/users/${id}/status`, { status }); }

  /* ──── Workflow Admin ──── */
  getWorkflowDefinitions() { return this.get<any[]>('/admin/workflow/definitions'); }
  getWorkflowSteps(wfId: string) { return this.get<any[]>(`/admin/workflow/definitions/${wfId}/steps`); }
  createWorkflowDef(body: any) {
    const payload = { ...body };
    if (payload.caseTypeId) payload.caseTypeId = Number(payload.caseTypeId);
    return this.post<any>('/admin/workflow/definitions', payload);
  }
  addWorkflowStep(wfId: string, body: any) { return this.post<any>(`/admin/workflow/definitions/${wfId}/steps`, body); }
  updateWorkflowDef(id: string, body: any) {
    const payload = { ...body };
    if (payload.caseTypeId) payload.caseTypeId = Number(payload.caseTypeId);
    return this.put<any>(`/admin/workflow/definitions/${id}`, payload);
  }
  deleteWorkflowDef(id: string) { return this.del(`/admin/workflow/definitions/${id}`); }
  updateWorkflowStep(stepId: string, body: any) { return this.put<any>(`/admin/workflow/steps/${stepId}`, body); }
  deleteWorkflowStep(stepId: string) { return this.del(`/admin/workflow/steps/${stepId}`); }
  getRoutingRules() { return this.get<any[]>('/admin/workflow/routing-rules'); }
  getAllRoutingRules() { return this.get<any[]>('/admin/workflow/routing-rules/all'); }
  createRoutingRule(body: any) {
    const payload = { ...body };
    if (payload.caseTypeId) payload.caseTypeId = Number(payload.caseTypeId);
    if (payload.departmentId) payload.departmentId = Number(payload.departmentId);
    if (payload.businessUnitId) payload.businessUnitId = Number(payload.businessUnitId);
    if (payload.categoryId) payload.categoryId = Number(payload.categoryId);
    return this.post<any>('/admin/workflow/routing-rules', payload);
  }
  updateRoutingRule(id: string, body: any) {
    const payload = { ...body };
    if (payload.caseTypeId) payload.caseTypeId = Number(payload.caseTypeId);
    if (payload.departmentId) payload.departmentId = Number(payload.departmentId);
    if (payload.businessUnitId) payload.businessUnitId = Number(payload.businessUnitId);
    if (payload.categoryId) payload.categoryId = Number(payload.categoryId);
    return this.put<any>(`/admin/workflow/routing-rules/${id}`, payload);
  }
  deleteRoutingRule(id: string) { return this.del(`/admin/workflow/routing-rules/${id}`); }

  /* ──── AI ──── */
  aiCategorize(title: string, summary: string) { return this.post<any[]>('/ai/categorize', { title, summary }); }

  /* ──── Search ──── */
  searchCases(params?: Record<string, string | number>) { return this.get<any>('/search/cases', params); }
  globalSearch(q: string) { return this.get<any>('/search', { q }); }
}
