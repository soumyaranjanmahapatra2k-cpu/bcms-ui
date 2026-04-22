import { Component, input } from '@angular/core';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  template: `
    <div class="skeleton-wrapper" [style.animation-delay]="delay()">
      @switch (variant()) {
        @case ('text') {
          @for (i of lines(); track i) {
            <div class="skeleton skeleton-text" [style.width]="i === lines().length - 1 ? '60%' : width()"></div>
          }
        }
        @case ('heading') {
          <div class="skeleton skeleton-heading" [style.width]="width()"></div>
        }
        @case ('avatar') {
          <div class="skeleton skeleton-avatar" [style.width]="size()" [style.height]="size()"></div>
        }
        @case ('card') {
          <div class="skeleton skeleton-card" [style.height]="height()"></div>
        }
        @case ('row') {
          @for (i of lines(); track i) {
            <div class="skeleton skeleton-row"></div>
          }
        }
        @case ('badge') {
          <div class="skeleton skeleton-badge"></div>
        }
        @case ('rect') {
          <div class="skeleton" [style.width]="width()" [style.height]="height()" [style.border-radius]="radius()"></div>
        }
        @default {
          <div class="skeleton" [style.width]="width()" [style.height]="height()"></div>
        }
      }
    </div>
  `,
  styles: [`
    .skeleton-wrapper {
      animation: fadeIn 0.3s ease;
    }
  `]
})
export class SkeletonLoaderComponent {
  variant = input<'text' | 'heading' | 'avatar' | 'card' | 'row' | 'badge' | 'rect'>('text');
  width = input('100%');
  height = input('120px');
  size = input('40px');
  radius = input('var(--radius-sm)');
  delay = input('0ms');
  count = input(3);

  lines = () => Array.from({ length: this.count() }, (_, i) => i);
}
