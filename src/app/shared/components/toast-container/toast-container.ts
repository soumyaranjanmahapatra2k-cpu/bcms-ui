import { Component, inject } from '@angular/core';
import { ToastService, Toast } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  template: `
    <div class="toast-container" role="region" aria-label="Notifications">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast" [class]="'toast-' + toast.type" role="alert">
          <div class="toast-accent"></div>
          <div class="toast-icon-wrap">
            <span class="material-icons-outlined">{{ icon(toast) }}</span>
          </div>
          <div class="toast-body">
            @if (toast.title) {
              <div class="toast-title">{{ toast.title }}</div>
            }
            <div class="toast-msg">{{ toast.message }}</div>
            @if (toast.action) {
              <button class="toast-action" (click)="runAction(toast)">{{ toast.action.label }}</button>
            }
          </div>
          @if (toast.dismissible) {
            <button class="toast-close" (click)="toastService.dismiss(toast.id)" aria-label="Close">
              <span class="material-icons-outlined">close</span>
            </button>
          }
          @if (toast.duration > 0) {
            <div class="toast-progress" [style.animation-duration]="toast.duration + 'ms'"></div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed; bottom: 24px; right: 24px;
      z-index: 10000; display: flex; flex-direction: column;
      gap: 12px; max-width: 420px; pointer-events: none;
    }
    .toast {
      pointer-events: auto; position: relative;
      display: flex; align-items: flex-start; gap: 12px;
      padding: 14px 16px 14px 18px;
      min-width: 320px; max-width: 420px;
      background: var(--bg-card); color: var(--text-primary);
      border: 1px solid var(--border-color-card);
      border-radius: var(--radius-lg);
      box-shadow: 0 10px 40px rgba(0,0,0,0.15), 0 4px 12px rgba(0,0,0,0.08);
      overflow: hidden;
      animation: toastSlideIn 0.4s cubic-bezier(0.21, 1.02, 0.73, 1);
    }
    .toast-accent {
      position: absolute; left: 0; top: 0; bottom: 0; width: 4px;
      border-radius: var(--radius-lg) 0 0 var(--radius-lg);
    }
    .toast-success .toast-accent { background: linear-gradient(180deg, #22c55e, #16a34a); }
    .toast-error   .toast-accent { background: linear-gradient(180deg, #ef4444, #dc2626); }
    .toast-warning .toast-accent { background: linear-gradient(180deg, #f59e0b, #d97706); }
    .toast-info    .toast-accent { background: linear-gradient(180deg, #3b82f6, #2563eb); }
    .toast-icon-wrap {
      width: 36px; height: 36px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .toast-success .toast-icon-wrap { background: rgba(34, 197, 94, 0.14); color: #16a34a; }
    .toast-error   .toast-icon-wrap { background: rgba(239, 68, 68, 0.14); color: #dc2626; }
    .toast-warning .toast-icon-wrap { background: rgba(245, 158, 11, 0.16); color: #d97706; }
    .toast-info    .toast-icon-wrap { background: rgba(59, 130, 246, 0.14); color: #2563eb; }
    .toast-icon-wrap .material-icons-outlined { font-size: 20px; }
    .toast-body { flex: 1; min-width: 0; padding-top: 2px; }
    .toast-title {
      font-weight: 700; font-size: 0.875rem; line-height: 1.3;
      color: var(--text-primary); margin-bottom: 2px;
    }
    .toast-msg {
      font-size: 0.813rem; line-height: 1.4;
      color: var(--text-secondary); word-break: break-word;
    }
    .toast-action {
      margin-top: 8px; background: none; border: none;
      font-weight: 700; font-size: 0.786rem;
      color: var(--color-primary); cursor: pointer; padding: 4px 0;
      text-transform: uppercase; letter-spacing: 0.4px;
    }
    .toast-action:hover { text-decoration: underline; }
    .toast-close {
      background: none; border: none; cursor: pointer;
      color: var(--text-muted); padding: 4px;
      border-radius: var(--radius-sm);
      transition: all 0.15s ease; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      align-self: flex-start;
    }
    .toast-close:hover { background: var(--bg-hover); color: var(--text-primary); }
    .toast-close .material-icons-outlined { font-size: 16px; }
    .toast-progress {
      position: absolute; left: 4px; right: 0; bottom: 0;
      height: 2px; background: currentColor; opacity: 0.4;
      animation-name: toastShrink;
      animation-timing-function: linear;
      animation-fill-mode: forwards;
      transform-origin: left;
    }
    .toast-success .toast-progress { color: #22c55e; }
    .toast-error   .toast-progress { color: #ef4444; }
    .toast-warning .toast-progress { color: #f59e0b; }
    .toast-info    .toast-progress { color: #3b82f6; }
    @keyframes toastSlideIn {
      0% { transform: translateX(110%) scale(0.92); opacity: 0; }
      60% { transform: translateX(-4%) scale(1); opacity: 1; }
      100% { transform: translateX(0) scale(1); opacity: 1; }
    }
    @keyframes toastShrink {
      from { transform: scaleX(1); }
      to { transform: scaleX(0); }
    }
  `]
})
export class ToastContainerComponent {
  toastService = inject(ToastService);

  icon(t: Toast): string {
    switch (t.type) {
      case 'success': return 'check_circle';
      case 'error':   return 'error_outline';
      case 'warning': return 'warning_amber';
      default:        return 'info';
    }
  }

  runAction(t: Toast) {
    try { t.action?.handler(); } finally { this.toastService.dismiss(t.id); }
  }
}