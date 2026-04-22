import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NavigationService } from '../../core/services/navigation.service';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="not-found">
      <div class="nf-content">
        <div class="nf-code">404</div>
        <div class="nf-icon-wrap">
          <span class="material-icons-outlined nf-icon">explore_off</span>
        </div>
        <h1>Page Not Found</h1>
        <p>The page you're looking for doesn't exist or has been moved.</p>
        <div class="nf-actions">
          @if (nav.canGoBack) {
            <button class="btn btn-secondary" (click)="nav.goBack()">
              <span class="material-icons-outlined">arrow_back</span> Go Back
            </button>
          }
          <a class="btn btn-primary" routerLink="/dashboard">
            <span class="material-icons-outlined">home</span> Dashboard
          </a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .not-found {
      display: flex; align-items: center; justify-content: center;
      min-height: calc(100vh - var(--navbar-height) - 56px);
      animation: fadeIn 0.3s ease;
    }
    .nf-content { text-align: center; max-width: 420px; }
    .nf-code {
      font-size: 6rem; font-weight: 900; letter-spacing: -0.04em;
      background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      background-clip: text; line-height: 1;
    }
    .nf-icon-wrap {
      width: 72px; height: 72px; border-radius: var(--radius-xl);
      background: var(--color-primary-subtle); color: var(--color-primary);
      display: flex; align-items: center; justify-content: center;
      margin: 16px auto 24px;
    }
    .nf-icon { font-size: 36px; }
    h1 { font-size: 1.5rem; font-weight: 800; margin-bottom: 8px; }
    p { color: var(--text-secondary); font-size: 0.929rem; margin-bottom: 28px; line-height: 1.6; }
    .nf-actions { display: flex; gap: 12px; justify-content: center; }
  `]
})
export class NotFoundComponent {
  nav = inject(NavigationService);
}
