import { Component, inject, signal, HostListener, ElementRef, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';

interface SearchGroup {
  label: string;
  icon: string;
  items: SearchItem[];
}
interface SearchItem {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-global-search',
  standalone: true,
  template: `
    <div class="search-wrapper" [class.focused]="focused()">
      <div class="search-input-row">
        <span class="material-icons-outlined search-icon">search</span>
        <input #searchInput
               type="text"
               [value]="query()"
               (input)="onInput($event)"
               (focus)="onFocus()"
               (keydown)="onKeydown($event)"
               placeholder="Search cases, users, workflows..."
               autocomplete="off"
               spellcheck="false" />
        @if (query()) {
          <button class="clear-btn" (click)="clear(); $event.stopPropagation()">
            <span class="material-icons-outlined">close</span>
          </button>
        }
        <div class="kbd-hint">
          <kbd>Ctrl</kbd><kbd>K</kbd>
        </div>
      </div>

      @if (showDropdown()) {
        <div class="search-dropdown">
          @if (loading()) {
            <div class="search-loading">
              <span class="spinner spinner-sm"></span>
              <span>Searching...</span>
            </div>
          } @else if (groups().length === 0 && query().length >= 2) {
            <div class="search-empty">
              <span class="material-icons-outlined empty-icon">search_off</span>
              <p>No results for "{{ query() }}"</p>
              <span class="empty-hint">Try different keywords or check spelling</span>
            </div>
          } @else {
            @for (group of groups(); track group.label) {
              <div class="search-group">
                <div class="group-header">
                  <span class="material-icons-outlined group-icon">{{ group.icon }}</span>
                  <span class="group-label">{{ group.label }}</span>
                  <span class="group-count">{{ group.items.length }}</span>
                </div>
                @for (item of group.items; track item.id; let i = $index) {
                  <button class="search-result"
                          [class.highlighted]="highlightedIndex() === getGlobalIndex(group, i)"
                          (click)="navigateTo(item)"
                          (mouseenter)="highlightedIndex.set(getGlobalIndex(group, i))">
                    <span class="material-icons-outlined result-icon">{{ item.icon }}</span>
                    <div class="result-text">
                      <span class="result-title" [innerHTML]="highlight(item.title)"></span>
                      <span class="result-subtitle">{{ item.subtitle }}</span>
                    </div>
                    <span class="material-icons-outlined result-arrow">arrow_forward</span>
                  </button>
                }
              </div>
            }
          }

          @if (recentSearches().length > 0 && !query()) {
            <div class="search-group">
              <div class="group-header">
                <span class="material-icons-outlined group-icon">history</span>
                <span class="group-label">Recent Searches</span>
              </div>
              @for (recent of recentSearches(); track recent) {
                <button class="search-result recent-item" (click)="searchRecent(recent)">
                  <span class="material-icons-outlined result-icon">history</span>
                  <div class="result-text"><span class="result-title">{{ recent }}</span></div>
                </button>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .search-wrapper {
      position: relative;
      width: 400px;
      max-width: 100%;
    }
    .search-input-row {
      display: flex;
      align-items: center;
      gap: 8px;
      background: var(--bg-hover);
      border: 1px solid var(--border-color-card);
      border-radius: var(--radius-xl);
      padding: 0 14px;
      height: 38px;
      transition: all var(--transition-fast);
    }
    .focused .search-input-row {
      border-color: var(--color-primary);
      background: var(--bg-card);
      box-shadow: 0 0 0 3px var(--color-primary-subtle);
    }
    .search-icon { font-size: 18px; color: var(--text-muted); flex-shrink: 0; }
    input {
      flex: 1;
      border: none;
      background: none;
      outline: none;
      font-size: 0.857rem;
      color: var(--text-primary);
      font-family: inherit;
      min-width: 0;
    }
    input::placeholder { color: var(--text-muted); }
    .clear-btn {
      display: flex; align-items: center; justify-content: center;
      background: none; border: none; cursor: pointer; padding: 2px;
      color: var(--text-muted); border-radius: var(--radius-sm);
      transition: color var(--transition-fast);
    }
    .clear-btn:hover { color: var(--text-primary); }
    .clear-btn .material-icons-outlined { font-size: 16px; }
    .kbd-hint {
      display: flex; gap: 3px; flex-shrink: 0;
    }
    .focused .kbd-hint { display: none; }
    kbd {
      font-size: 0.607rem;
      font-family: inherit;
      padding: 1px 5px;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      background: var(--bg-card);
      color: var(--text-muted);
      line-height: 1.4;
    }
    .search-dropdown {
      position: absolute;
      top: calc(100% + 6px);
      left: 0; right: 0;
      background: var(--bg-card);
      border: 1px solid var(--border-color-card);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-dropdown);
      max-height: 420px;
      overflow-y: auto;
      z-index: 300;
      animation: fadeInDown 0.15s ease;
      padding: 6px 0;
    }
    .search-loading {
      display: flex; align-items: center; gap: 10px;
      padding: 24px 16px; color: var(--text-secondary); font-size: 0.857rem;
    }
    .search-empty {
      padding: 32px 16px; text-align: center; color: var(--text-secondary);
    }
    .empty-icon { font-size: 36px; color: var(--text-muted); display: block; margin-bottom: 8px; }
    .search-empty p { font-size: 0.857rem; font-weight: 600; margin-bottom: 4px; }
    .empty-hint { font-size: 0.714rem; color: var(--text-muted); }
    .search-group { margin-bottom: 4px; }
    .group-header {
      display: flex; align-items: center; gap: 6px;
      padding: 8px 16px 4px;
      font-size: 0.679rem; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.06em;
      color: var(--text-muted);
    }
    .group-icon { font-size: 14px; }
    .group-count {
      font-size: 0.607rem; font-weight: 700;
      background: var(--bg-hover); padding: 0 6px;
      border-radius: var(--radius-full); margin-left: auto;
    }
    .search-result {
      display: flex; align-items: center; gap: 10px;
      padding: 8px 16px; width: 100%;
      background: none; border: none; cursor: pointer;
      font-size: 0.857rem; color: var(--text-primary);
      text-align: left; font-family: inherit;
      transition: background var(--transition-fast);
    }
    .search-result:hover, .search-result.highlighted {
      background: var(--bg-hover);
    }
    .result-icon { font-size: 18px; color: var(--text-secondary); flex-shrink: 0; }
    .result-text { flex: 1; display: flex; flex-direction: column; min-width: 0; }
    .result-title {
      font-weight: 500; font-size: 0.857rem;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .result-subtitle {
      font-size: 0.714rem; color: var(--text-secondary);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .result-arrow { font-size: 14px; color: var(--text-muted); opacity: 0; transition: opacity var(--transition-fast); }
    .search-result:hover .result-arrow, .search-result.highlighted .result-arrow { opacity: 1; }
    :host ::ng-deep .hl { background: var(--color-primary-subtle); color: var(--color-primary); font-weight: 700; border-radius: 2px; padding: 0 1px; }
    @media (max-width: 768px) {
      .search-wrapper { width: 100%; }
      .kbd-hint { display: none; }
    }
  `]
})
export class GlobalSearchComponent implements OnDestroy {
  private api = inject(ApiService);
  private router = inject(Router);
  private elRef = inject(ElementRef);

  query = signal('');
  focused = signal(false);
  loading = signal(false);
  showDropdown = signal(false);
  groups = signal<SearchGroup[]>([]);
  highlightedIndex = signal(-1);
  recentSearches = signal<string[]>(this.loadRecent());

  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  @HostListener('document:keydown', ['$event'])
  onGlobalKey(e: KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      const input = this.elRef.nativeElement.querySelector('input');
      input?.focus();
    }
    if (e.key === 'Escape' && this.focused()) {
      this.close();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocClick(e: Event) {
    if (!this.elRef.nativeElement.contains(e.target)) {
      this.close();
    }
  }

  ngOnDestroy() {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
  }

  onFocus() {
    this.focused.set(true);
    this.showDropdown.set(true);
  }

  close() {
    this.focused.set(false);
    this.showDropdown.set(false);
    this.highlightedIndex.set(-1);
  }

  clear() {
    this.query.set('');
    this.groups.set([]);
    this.highlightedIndex.set(-1);
  }

  onInput(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.query.set(value);
    this.highlightedIndex.set(-1);

    if (this.debounceTimer) clearTimeout(this.debounceTimer);

    if (value.length < 2) {
      this.groups.set([]);
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.debounceTimer = setTimeout(() => this.performSearch(value), 300);
  }

  onKeydown(event: KeyboardEvent) {
    const total = this.totalItems();
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.highlightedIndex.set((this.highlightedIndex() + 1) % Math.max(total, 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.highlightedIndex.set((this.highlightedIndex() - 1 + total) % Math.max(total, 1));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const item = this.getItemByGlobalIndex(this.highlightedIndex());
      if (item) this.navigateTo(item);
    }
  }

  navigateTo(item: SearchItem) {
    this.saveRecent(this.query());
    this.close();
    this.query.set('');
    this.groups.set([]);
    this.router.navigateByUrl(item.route);
  }

  searchRecent(term: string) {
    this.query.set(term);
    this.performSearch(term);
  }

  highlight(text: string): string {
    const q = this.query();
    if (!q || q.length < 2) return text;
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return text.replace(new RegExp(`(${escaped})`, 'gi'), '<span class="hl">$1</span>');
  }

  getGlobalIndex(group: SearchGroup, itemIndex: number): number {
    let idx = 0;
    for (const g of this.groups()) {
      if (g === group) return idx + itemIndex;
      idx += g.items.length;
    }
    return idx + itemIndex;
  }

  private totalItems(): number {
    return this.groups().reduce((sum, g) => sum + g.items.length, 0);
  }

  private getItemByGlobalIndex(index: number): SearchItem | null {
    let idx = 0;
    for (const g of this.groups()) {
      if (index < idx + g.items.length) return g.items[index - idx];
      idx += g.items.length;
    }
    return null;
  }

  private async performSearch(q: string) {
    try {
      const data = await this.api.globalSearch(q);
      const groups: SearchGroup[] = [];

      if (data?.cases?.length) {
        groups.push({
          label: 'Cases', icon: 'folder_open',
          items: data.cases.map((c: any) => ({
            id: c.caseId, title: c.title,
            subtitle: `${c.caseReferenceNo} · ${c.status} · ${c.departmentName || ''}`,
            icon: 'description', route: `/cases/${c.caseId}`
          }))
        });
      }
      if (data?.users?.length) {
        groups.push({
          label: 'Users', icon: 'people',
          items: data.users.map((u: any) => ({
            id: u.userId, title: u.fullName,
            subtitle: `${u.email} · ${u.departmentName || ''} · ${u.roles?.join(', ') || ''}`,
            icon: 'person', route: '/admin/users'
          }))
        });
      }
      if (data?.workflows?.length) {
        groups.push({
          label: 'Workflows', icon: 'account_tree',
          items: data.workflows.map((w: any) => ({
            id: w.id, title: w.name,
            subtitle: w.active ? 'Active' : 'Inactive',
            icon: 'account_tree', route: '/admin/workflows'
          }))
        });
      }
      if (data?.masterData?.length) {
        groups.push({
          label: 'Master Data', icon: 'dataset',
          items: data.masterData.map((m: any) => ({
            id: m.id, title: m.name,
            subtitle: this.masterDataTypeLabel(m.type),
            icon: this.masterDataIcon(m.type), route: '/admin/master-data'
          }))
        });
      }

      this.groups.set(groups);
    } catch {
      this.groups.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  private masterDataTypeLabel(type: string): string {
    const map: Record<string, string> = { department: 'Department', 'business-unit': 'Business Unit', 'case-type': 'Case Type', category: 'Category' };
    return map[type] || type;
  }

  private masterDataIcon(type: string): string {
    const map: Record<string, string> = { department: 'business', 'business-unit': 'domain', 'case-type': 'category', category: 'label' };
    return map[type] || 'dataset';
  }

  private loadRecent(): string[] {
    try {
      return JSON.parse(localStorage.getItem('bcms_recent_searches') || '[]').slice(0, 5);
    } catch { return []; }
  }

  private saveRecent(term: string) {
    if (!term || term.length < 2) return;
    const recent = this.loadRecent().filter(r => r !== term);
    recent.unshift(term);
    const trimmed = recent.slice(0, 5);
    localStorage.setItem('bcms_recent_searches', JSON.stringify(trimmed));
    this.recentSearches.set(trimmed);
  }
}
