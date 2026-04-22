import { Directive, ElementRef, HostListener, input, OnDestroy } from '@angular/core';

@Directive({
  selector: '[appTooltip]',
  standalone: true,
})
export class TooltipDirective implements OnDestroy {
  appTooltip = input.required<string>();
  tooltipPosition = input<'top' | 'bottom' | 'left' | 'right'>('top');

  private tooltipEl: HTMLElement | null = null;

  @HostListener('mouseenter')
  onMouseEnter() {
    const text = this.appTooltip();
    if (!text) return;
    this.tooltipEl = document.createElement('div');
    this.tooltipEl.className = 'bcms-tooltip';
    this.tooltipEl.textContent = text;
    document.body.appendChild(this.tooltipEl);
    this.positionTooltip();
  }

  @HostListener('mouseleave')
  onMouseLeave() {
    this.removeTooltip();
  }

  ngOnDestroy() {
    this.removeTooltip();
  }

  private positionTooltip() {
    if (!this.tooltipEl) return;
    const el = this.elRef.nativeElement as HTMLElement;
    const rect = el.getBoundingClientRect();
    const tt = this.tooltipEl.getBoundingClientRect();
    const gap = 8;
    let top: number, left: number;

    switch (this.tooltipPosition()) {
      case 'bottom':
        top = rect.bottom + gap;
        left = rect.left + (rect.width - tt.width) / 2;
        break;
      case 'left':
        top = rect.top + (rect.height - tt.height) / 2;
        left = rect.left - tt.width - gap;
        break;
      case 'right':
        top = rect.top + (rect.height - tt.height) / 2;
        left = rect.right + gap;
        break;
      default: // top
        top = rect.top - tt.height - gap;
        left = rect.left + (rect.width - tt.width) / 2;
    }

    left = Math.max(8, Math.min(left, window.innerWidth - tt.width - 8));
    top = Math.max(8, top);

    this.tooltipEl.style.top = `${top}px`;
    this.tooltipEl.style.left = `${left}px`;
  }

  private removeTooltip() {
    if (this.tooltipEl) {
      this.tooltipEl.remove();
      this.tooltipEl = null;
    }
  }

  constructor(private elRef: ElementRef) {}
}
