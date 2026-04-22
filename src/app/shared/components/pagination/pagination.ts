import { Component, input, output, computed, signal, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';

/**
 * Reusable pagination component supporting both client-side (slice) and
 * server-side modes. Emits (pageChange) when user clicks; (pageSizeChange) when
 * page-size dropdown changes. Exposes `paginate(items)` helper for client mode.
 *
 * Use `[serverSide]="true"` and bind `[totalItems]` from the server response.
 * Use `[showPageSize]="true"` to enable the rows-per-page selector.
 */
@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [FormsModule],
  template: `
    @if (totalItems() > 0) {
      <div class="pagination-bar">
        <div class="pagination-info">
          Showing <strong>{{ rangeStart() }}</strong>–<strong>{{ rangeEnd() }}</strong>
          of <strong>{{ totalItems() }}</strong> {{ totalItems() === 1 ? 'item' : 'items' }}
        </div>

        @if (totalPages() > 1) {
          <div class="pagination-controls">
            <button class="page-btn nav-btn" [disabled]="currentPage() <= 1"
                    (click)="goTo(1)" title="First page" aria-label="First page">
              <span class="material-icons-outlined">first_page</span>
            </button>
            <button class="page-btn nav-btn" [disabled]="currentPage() <= 1"
                    (click)="goTo(currentPage() - 1)" title="Previous" aria-label="Previous">
              <span class="material-icons-outlined">chevron_left</span>
            </button>
            @for (p of pages(); track $index) {
              @if (p === '…') {
                <span class="page-ellipsis">…</span>
              } @else {
                <button class="page-btn" [class.active]="p === currentPage()"
                        (click)="goTo(+p)">{{ p }}</button>
              }
            }
            <button class="page-btn nav-btn" [disabled]="currentPage() >= totalPages()"
                    (click)="goTo(currentPage() + 1)" title="Next" aria-label="Next">
              <span class="material-icons-outlined">chevron_right</span>
            </button>
            <button class="page-btn nav-btn" [disabled]="currentPage() >= totalPages()"
                    (click)="goTo(totalPages())" title="Last page" aria-label="Last page">
              <span class="material-icons-outlined">last_page</span>
            </button>
          </div>
        }

        @if (showPageSize()) {
          <div class="page-size-wrap">
            <label>Rows:</label>
            <select [ngModel]="pageSize()" (ngModelChange)="onPageSizeChange($event)">
              @for (s of pageSizeOptions(); track s) {
                <option [ngValue]="s">{{ s }}</option>
              }
            </select>
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .pagination-bar {
      display: flex; align-items: center; justify-content: space-between;
      padding: 16px 4px 4px; gap: 16px; flex-wrap: wrap;
      border-top: 1px solid var(--border-color-card);
      margin-top: 8px;
    }
    .pagination-info { font-size: 0.786rem; color: var(--text-muted); }
    .pagination-info strong { color: var(--text-primary); font-weight: 700; }
    .pagination-controls { display: flex; align-items: center; gap: 4px; }
    .page-btn {
      min-width: 34px; height: 34px; padding: 0 10px;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-color);
      background: var(--bg-card);
      color: var(--text-secondary);
      font-weight: 600; font-size: 0.813rem;
      cursor: pointer;
      display: inline-flex; align-items: center; justify-content: center;
      transition: all 0.15s ease;
    }
    .page-btn:hover:not(:disabled):not(.active) {
      border-color: var(--color-primary);
      color: var(--color-primary);
      background: var(--color-primary-subtle);
      transform: translateY(-1px);
    }
    .page-btn.active {
      background: var(--color-primary);
      color: white;
      border-color: var(--color-primary);
      box-shadow: 0 2px 8px rgba(59,130,246,0.3);
    }
    .page-btn:disabled { opacity: 0.35; cursor: not-allowed; }
    .nav-btn .material-icons-outlined { font-size: 18px; }
    .page-ellipsis { color: var(--text-muted); padding: 0 4px; user-select: none; }
    .page-size-wrap { display: flex; align-items: center; gap: 8px; }
    .page-size-wrap label { font-size: 0.786rem; color: var(--text-muted); font-weight: 600; }
    .page-size-wrap select {
      width: auto; min-width: 70px; height: 34px;
      padding: 0 28px 0 10px; font-size: 0.813rem; font-weight: 600;
      border-radius: var(--radius-md);
    }
  `]
})
export class PaginationComponent {
  /** 1-based current page */
  currentPage = input(1);
  totalItems = input(0);
  pageSize = input(10);
  showPageSize = input(false);
  pageSizeOptions = input<number[]>([10, 25, 50, 100]);

  pageChange = output<number>();
  pageSizeChange = output<number>();

  totalPages = computed(() => Math.max(1, Math.ceil(this.totalItems() / this.pageSize())));

  rangeStart = computed(() => this.totalItems() === 0 ? 0 : (this.currentPage() - 1) * this.pageSize() + 1);
  rangeEnd = computed(() => Math.min(this.totalItems(), this.currentPage() * this.pageSize()));

  /** Smart pagination: 1 … (cur-1) cur (cur+1) … last */
  pages = computed<(number | '…')[]>(() => {
    const total = this.totalPages();
    const cur = this.currentPage();
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const out: (number | '…')[] = [1];
    if (cur > 3) out.push('…');
    const start = Math.max(2, cur - 1);
    const end = Math.min(total - 1, cur + 1);
    for (let i = start; i <= end; i++) out.push(i);
    if (cur < total - 2) out.push('…');
    out.push(total);
    return out;
  });

  goTo(page: number) {
    const p = Math.max(1, Math.min(this.totalPages(), page));
    if (p !== this.currentPage()) this.pageChange.emit(p);
  }

  onPageSizeChange(size: number) {
    this.pageSizeChange.emit(size);
  }
}
