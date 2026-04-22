import { Component, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-search-filter',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="search-filter">
      <div class="search-box" [class.focused]="isFocused">
        <span class="material-icons-outlined search-icon">search</span>
        <input type="text" [placeholder]="placeholder()" [ngModel]="searchTerm()"
          (ngModelChange)="onSearch($event)" (focus)="isFocused = true" (blur)="isFocused = false" />
        @if (searchTerm()) {
          <button class="clear-btn" (click)="onSearch('')">
            <span class="material-icons-outlined">close</span>
          </button>
        }
      </div>
    </div>
  `,
  styles: [`
    .search-filter { display: flex; gap: 8px; }
    .search-box {
      position: relative; flex: 1; min-width: 220px;
      transition: all var(--transition-fast);
    }
    .search-box.focused { .search-icon { color: var(--color-primary); } }
    .search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-muted); font-size: 18px; transition: color var(--transition-fast); }
    .search-box input { padding-left: 38px; padding-right: 36px; }
    .clear-btn {
      position: absolute; right: 8px; top: 50%; transform: translateY(-50%);
      background: none; border: none; cursor: pointer; padding: 4px;
      color: var(--text-muted); display: flex; border-radius: 50%;
      transition: all var(--transition-fast);
    }
    .clear-btn:hover { background: var(--bg-hover); color: var(--text-primary); }
    .clear-btn .material-icons-outlined { font-size: 16px; }
  `]
})
export class SearchFilterComponent {
  placeholder = input('Search...');
  searchTerm = signal('');
  searchChange = output<string>();
  isFocused = false;

  onSearch(value: string) {
    this.searchTerm.set(value);
    this.searchChange.emit(value);
  }
}
