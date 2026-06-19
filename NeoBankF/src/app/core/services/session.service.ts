import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';

export interface SessionUser {
  email: string;
  fullName: string;
  role: 'CUSTOMER' | 'ADMIN';
}

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly browser: boolean;
  private readonly userSubject = new BehaviorSubject<SessionUser | null>(null);
  user$ = this.userSubject.asObservable();

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.browser = isPlatformBrowser(platformId);
    if (this.browser) this.hydrate();
  }

  private hydrate() {
    const token = sessionStorage.getItem('token');
    if (!token) return;
    const decoded = this.decodeToken(token);
    if (!decoded) return;
    this.userSubject.next({
      email: decoded.sub || sessionStorage.getItem('email') || '',
      fullName: sessionStorage.getItem('userName') || decoded.fullName || decoded.sub || 'User',
      role: (decoded.role || sessionStorage.getItem('role') || 'CUSTOMER').toUpperCase() as 'CUSTOMER' | 'ADMIN',
    });
  }

  /** Save the session after a successful login */
  setSession(token: string, fullName: string, role: string, email: string) {
    if (!this.browser) return;
    sessionStorage.setItem('token', token);
    sessionStorage.setItem('role', role.toUpperCase());
    sessionStorage.setItem('userName', fullName);
    sessionStorage.setItem('email', email);
    this.userSubject.next({
      email,
      fullName,
      role: role.toUpperCase() as 'CUSTOMER' | 'ADMIN',
    });
  }

  clear() {
    if (!this.browser) return;
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('role');
    sessionStorage.removeItem('userName');
    sessionStorage.removeItem('email');
    this.userSubject.next(null);
  }

  getToken(): string | null {
    return this.browser ? sessionStorage.getItem('token') : null;
  }

  getRole(): string | null {
    if (!this.browser) return null;
    return (sessionStorage.getItem('role') || '').toUpperCase() || null;
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;
    const decoded = this.decodeToken(token);
    if (!decoded?.exp) return true;
    return decoded.exp * 1000 > Date.now();
  }

  private decodeToken(token: string): any | null {
    try {
      const payload = token.split('.')[1];
      if (!payload) return null;
      const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(json);
    } catch {
      return null;
    }
  }
}
