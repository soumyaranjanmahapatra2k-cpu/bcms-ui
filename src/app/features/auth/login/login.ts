import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';
import { MockDataService } from '../../../core/services/mock-data.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="login-page">
      <div class="login-bg">
        <div class="bg-shape shape-1"></div>
        <div class="bg-shape shape-2"></div>
        <div class="bg-shape shape-3"></div>
      </div>
      <div class="login-container">
        <div class="login-card">
          <div class="login-header">
            <div class="login-logo">
              <span class="material-icons-outlined">business_center</span>
            </div>
            <h1>BCMS</h1>
            <p>Business Case Management System</p>
          </div>
          <form (ngSubmit)="onLogin()" class="login-form">
            <div class="form-group">
              <label for="email">
                <span class="material-icons-outlined form-label-icon">mail</span>
                Email Address
              </label>
              <input id="email" type="email" [(ngModel)]="email" name="email" placeholder="you&#64;company.com" required autocomplete="username" />
            </div>
            <div class="form-group">
              <label for="password">
                <span class="material-icons-outlined form-label-icon">lock</span>
                Password
              </label>
              <input id="password" type="password" [(ngModel)]="password" name="password" placeholder="Enter your password" required autocomplete="current-password" />
            </div>
            @if (error()) {
              <div class="login-error">
                <span class="material-icons-outlined">error_outline</span>
                {{ error() }}
              </div>
            }
            <button type="submit" class="btn btn-primary login-btn" [disabled]="loading()">
              @if (loading()) {
                <span class="spinner spinner-sm"></span>
              }
              Sign In
              <span class="material-icons-outlined" style="font-size:18px">arrow_forward</span>
            </button>
          </form>
          <div class="demo-section">
            <div class="demo-label">
              <span class="demo-line"></span>
              <span>Quick Access</span>
              <span class="demo-line"></span>
            </div>
            <div class="demo-grid">
              @for (acc of demoAccounts; track acc.email) {
                <button class="demo-chip" (click)="email = acc.email; password = 'Welcome@123'; onLogin()">
                  <div class="demo-chip-icon" [style.background]="acc.color">
                    <span class="material-icons-outlined">{{ acc.icon }}</span>
                  </div>
                  <div class="demo-chip-info">
                    <strong>{{ acc.role }}</strong>
                    <span>{{ acc.email }}</span>
                  </div>
                </button>
              }
            </div>
          </div>
        </div>
        <p class="login-footer">&copy; 2026 BCMS. Enterprise Business Case Management.</p>
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg-primary);
      padding: 20px;
      position: relative;
      overflow: hidden;
    }
    .login-bg {
      position: absolute; inset: 0;
      overflow: hidden;
    }
    .bg-shape {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);
      opacity: 0.15;
      animation: pulse 8s ease-in-out infinite;
    }
    .shape-1 {
      width: 600px; height: 600px;
      background: var(--color-primary);
      top: -200px; right: -100px;
      animation-delay: 0s;
    }
    .shape-2 {
      width: 400px; height: 400px;
      background: var(--color-info);
      bottom: -100px; left: -50px;
      animation-delay: 2s;
    }
    .shape-3 {
      width: 300px; height: 300px;
      background: var(--color-success);
      top: 50%; left: 60%;
      animation-delay: 4s;
    }
    .login-container {
      position: relative; z-index: 1;
      display: flex; flex-direction: column; align-items: center;
      animation: fadeInUp 0.5s ease;
    }
    .login-card {
      background: var(--bg-card);
      border-radius: var(--radius-2xl);
      box-shadow: var(--shadow-xl);
      border: 1px solid var(--border-color-card);
      padding: 44px 40px 36px;
      width: 100%;
      max-width: 460px;
      backdrop-filter: blur(20px);
    }
    .login-header { text-align: center; margin-bottom: 36px; }
    .login-logo {
      width: 56px; height: 56px;
      margin: 0 auto 16px;
      background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
      border-radius: var(--radius-xl);
      display: flex; align-items: center; justify-content: center;
      color: var(--text-inverse);
      box-shadow: 0 8px 24px rgba(var(--color-primary-rgb), 0.3);
      .material-icons-outlined { font-size: 28px; }
    }
    .login-header h1 {
      font-size: 1.8rem; font-weight: 800;
      letter-spacing: -0.03em;
      color: var(--text-primary);
      margin: 0 0 4px;
    }
    .login-header p {
      color: var(--text-secondary);
      font-size: 0.857rem;
    }
    .login-form { margin-bottom: 24px; }
    .form-label-icon {
      font-size: 16px;
      vertical-align: text-bottom;
      margin-right: 4px;
      color: var(--text-muted);
    }
    .login-error {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 14px;
      background: var(--color-danger-light);
      color: var(--color-danger);
      border-radius: var(--radius-md);
      font-size: 0.857rem; font-weight: 500;
      margin-bottom: 16px;
      animation: fadeInUp 0.2s ease;
    }
    .login-btn {
      width: 100%;
      padding: 13px;
      font-size: 1rem;
      justify-content: center;
      border-radius: var(--radius-lg);
      font-weight: 700;
    }
    .demo-section { padding-top: 4px; }
    .demo-label {
      display: flex; align-items: center; gap: 12px;
      margin-bottom: 16px;
      font-size: 0.75rem; color: var(--text-muted);
      font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em;
    }
    .demo-line { flex: 1; height: 1px; background: var(--border-color); }
    .demo-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }
    .demo-chip {
      display: flex; align-items: center; gap: 10px;
      padding: 10px 12px;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      cursor: pointer; text-align: left;
      background: var(--bg-card);
      transition: all var(--transition-fast);
    }
    .demo-chip:hover {
      border-color: var(--color-primary);
      background: var(--color-primary-subtle);
      transform: translateY(-1px);
      box-shadow: var(--shadow-sm);
    }
    .demo-chip:active { transform: translateY(0); }
    .demo-chip-icon {
      width: 32px; height: 32px;
      border-radius: var(--radius-md);
      display: flex; align-items: center; justify-content: center;
      color: #fff; flex-shrink: 0;
      .material-icons-outlined { font-size: 16px; }
    }
    .demo-chip-info { display: flex; flex-direction: column; overflow: hidden; }
    .demo-chip-info strong { font-size: 0.786rem; color: var(--text-primary); }
    .demo-chip-info span { font-size: 0.679rem; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .login-footer {
      margin-top: 24px;
      font-size: 0.714rem;
      color: var(--text-muted);
    }
    @media (max-width: 480px) {
      .login-card { padding: 32px 24px 28px; }
      .demo-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class LoginComponent {
  private auth = inject(AuthService);
  private data = inject(MockDataService);
  private router = inject(Router);

  email = '';
  password = '';
  error = signal('');
  loading = signal(false);

  demoAccounts = [
    { role: 'Admin',      email: 'admin@bcms.local',      icon: 'shield',      color: '#7C3AED' },
    { role: 'Requestor',  email: 'submitter@bcms.local',  icon: 'person',      color: '#00C2FF' },
    { role: 'Reviewer',   email: 'reviewer@bcms.local',   icon: 'rate_review', color: '#0891B2' },
    { role: 'Approver',   email: 'approver@bcms.local',   icon: 'verified',    color: '#16A34A' },
    { role: 'Auditor',    email: 'auditor@bcms.local',    icon: 'policy',      color: '#E5A00D' },
    { role: 'Management', email: 'mgmt@bcms.local',       icon: 'trending_up', color: '#DC2626' },
  ];

  onLogin() {
    this.error.set('');
    this.loading.set(true);
    this.auth.login(this.email, this.password).then(async success => {
      if (success) {
        try { await this.data.bootstrap(); } catch {}
        this.router.navigate(['/dashboard']);
      } else {
        this.error.set('Invalid credentials. Use a demo account with password "Welcome@123".');
      }
      this.loading.set(false);
    });
  }
}
