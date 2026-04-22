import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { User, LoginResponse } from '../models/user.model';
import { environment } from '../../../environments/environment';

const TOKEN_KEY = 'bcms_token';
const REFRESH_KEY = 'bcms_refresh';
const USER_KEY = 'bcms_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private currentUser = signal<User | null>(this.loadUser());
  private accessToken = signal<string | null>(localStorage.getItem(TOKEN_KEY));

  readonly user = this.currentUser.asReadonly();
  readonly isAuthenticated = computed(() => !!this.accessToken());
  readonly userRoles = computed(() => this.currentUser()?.roles ?? []);

  private loadUser(): User | null {
    const raw = localStorage.getItem(USER_KEY);
    try { return raw ? JSON.parse(raw) : null; } catch { return null; }
  }

  async login(email: string, password: string): Promise<boolean> {
    try {
      const resp: any = await firstValueFrom(
        this.http.post(`${environment.apiBaseUrl}/auth/login`, { email, password })
      );
      const data: LoginResponse = resp?.data;
      if (!data?.accessToken) return false;
      localStorage.setItem(TOKEN_KEY, data.accessToken);
      localStorage.setItem(REFRESH_KEY, data.refreshToken);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      this.accessToken.set(data.accessToken);
      this.currentUser.set(data.user);
      return true;
    } catch {
      return false;
    }
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
    this.accessToken.set(null);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  token(): string | null { return this.accessToken(); }

  hasRole(role: string): boolean { return this.userRoles().includes(role); }
  hasAnyRole(roles: string[]): boolean { return roles.some(r => this.userRoles().includes(r)); }
}
