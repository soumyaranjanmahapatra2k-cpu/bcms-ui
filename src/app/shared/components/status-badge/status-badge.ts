import { Component, input } from '@angular/core';
import { CaseStatus, STATUS_CONFIG } from '../../../core/models/case.model';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  template: `
    @if (config(); as cfg) {
      <span class="status-badge" [style.background]="cfg.bg" [style.color]="cfg.color">
        <span class="material-icons-outlined badge-icon">{{ cfg.icon }}</span>
        {{ cfg.label }}
      </span>
    }
  `,
  styles: [`
    .status-badge {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 4px 12px; border-radius: var(--radius-full);
      font-size: 0.714rem; font-weight: 700;
      letter-spacing: 0.02em;
      white-space: nowrap;
      transition: all var(--transition-fast);
    }
    .status-badge:hover { filter: brightness(0.95); transform: scale(1.02); }
    .badge-icon { font-size: 14px; }
  `]
})
export class StatusBadgeComponent {
  status = input.required<CaseStatus>();
  config = () => STATUS_CONFIG[this.status()];
}
