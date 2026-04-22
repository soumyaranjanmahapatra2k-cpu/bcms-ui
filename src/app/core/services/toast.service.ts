import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastAction {
  label: string;
  handler: () => void;
}

export interface ToastOptions {
  title?: string;
  duration?: number;
  action?: ToastAction;
  dismissible?: boolean;
}

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
  title?: string;
  duration: number;
  action?: ToastAction;
  dismissible: boolean;
  createdAt: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private counter = 0;
  readonly toasts = signal<Toast[]>([]);
  private timers = new Map<number, ReturnType<typeof setTimeout>>();

  private readonly defaultDurations: Record<ToastType, number> = {
    success: 3500,
    info: 4000,
    warning: 5500,
    error: 7000,
  };

  show(message: string, type: ToastType = 'info', options: ToastOptions = {}): number {
    const id = ++this.counter;
    const duration = options.duration ?? (options.action ? 8000 : this.defaultDurations[type]);
    const toast: Toast = {
      id, message, type,
      title: options.title,
      duration,
      action: options.action,
      dismissible: options.dismissible ?? true,
      createdAt: Date.now(),
    };
    this.toasts.update(t => [...t, toast]);
    if (duration > 0) {
      this.timers.set(id, setTimeout(() => this.dismiss(id), duration));
    }
    return id;
  }

  success(message: string, options?: ToastOptions) {
    return this.show(message, 'success', { title: options?.title ?? 'Success', ...options });
  }
  error(message: string, options?: ToastOptions) {
    return this.show(message, 'error', { title: options?.title ?? 'Error', ...options });
  }
  warning(message: string, options?: ToastOptions) {
    return this.show(message, 'warning', { title: options?.title ?? 'Warning', ...options });
  }
  info(message: string, options?: ToastOptions) {
    return this.show(message, 'info', options);
  }

  apiError(err: any, fallback = 'Something went wrong. Please try again.') {
    const msg = err?.error?.message || err?.message || fallback;
    return this.error(msg);
  }

  dismiss(id: number) {
    const t = this.timers.get(id);
    if (t) { clearTimeout(t); this.timers.delete(id); }
    this.toasts.update(arr => arr.filter(x => x.id !== id));
  }

  dismissAll() {
    this.timers.forEach(t => clearTimeout(t));
    this.timers.clear();
    this.toasts.set([]);
  }
}