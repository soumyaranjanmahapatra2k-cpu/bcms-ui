import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  template: `
    <div class="overlay" (click)="cancelled.emit()">
      <div class="modal" (click)="$event.stopPropagation()" style="animation: modalIn 0.3s ease">
        <div class="modal-header">
          <h2>{{ title() }}</h2>
          <button class="btn-icon" (click)="cancelled.emit()">
            <span class="material-icons-outlined">close</span>
          </button>
        </div>
        <div class="modal-body">
          <div class="confirm-icon-wrap" [class]="iconClass()">
            <span class="material-icons-outlined">{{ icon() }}</span>
          </div>
          <p class="confirm-message">{{ message() }}</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="cancelled.emit()">Cancel</button>
          <button class="btn" [class]="confirmClass()" (click)="confirmed.emit()">{{ confirmText() }}</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .confirm-icon-wrap {
      width: 52px; height: 52px; border-radius: 50%; margin: 0 auto 16px;
      display: flex; align-items: center; justify-content: center;
      animation: bounceIn 0.4s ease;
    }
    .confirm-icon-wrap .material-icons-outlined { font-size: 28px; }
    .icon-warning { background: var(--color-warning-light); color: var(--color-warning); }
    .icon-danger { background: var(--color-danger-light); color: var(--color-danger); }
    .icon-info { background: var(--color-primary-light); color: var(--color-primary); }
    .confirm-message { text-align: center; font-size: 0.929rem; color: var(--text-secondary); line-height: 1.6; }
  `]
})
export class ConfirmDialogComponent {
  title = input('Confirm Action');
  message = input('Are you sure you want to proceed?');
  confirmText = input('Confirm');
  confirmClass = input('btn-primary');
  icon = input('help_outline');
  iconClass = input('icon-warning');
  confirmed = output<void>();
  cancelled = output<void>();
}
