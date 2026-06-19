import { Component, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
<div class="al-shell">

  <div class="al-backdrop" *ngIf="mobileOpen()" (click)="mobileOpen.set(false)"></div>

  <aside class="al-sidebar" [class.collapsed]="collapsed()" [class.mobile-open]="mobileOpen()">
    <div class="al-brand-row">
      <div class="al-brand" *ngIf="!collapsed()">
        <div class="al-logo">
          <span class="material-icons-outlined">admin_panel_settings</span>
        </div>
        <div class="al-brand-text">
          <span>Neo<span class="hl">Bank</span></span>
          <small>Admin Console</small>
        </div>
      </div>
      <button class="al-collapse" (click)="toggle()" [title]="collapsed() ? 'Expand sidebar' : 'Collapse sidebar'">
        <span class="material-icons-outlined">{{ collapsed() ? 'chevron_right' : 'chevron_left' }}</span>
      </button>
    </div>

    <nav class="al-nav">
      <a routerLink="/admin/dashboard" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}" [attr.data-tip]="collapsed() ? 'Dashboard' : null">
        <span class="material-icons-outlined">dashboard</span>
        <span class="lbl" *ngIf="!collapsed()">Dashboard</span>
      </a>

      <div class="al-section" *ngIf="!collapsed()">Loan Module</div>
      <a routerLink="/admin/loan-dashboard" routerLinkActive="active" [attr.data-tip]="collapsed() ? 'Loan Dashboard' : null">
        <span class="material-icons-outlined">dashboard_customize</span>
        <span class="lbl" *ngIf="!collapsed()">Loan Dashboard</span>
      </a>
      <a routerLink="/admin/loan-products" routerLinkActive="active" [attr.data-tip]="collapsed() ? 'Loan Products' : null">
        <span class="material-icons-outlined">inventory_2</span>
        <span class="lbl" *ngIf="!collapsed()">Loan Products</span>
      </a>
      <a routerLink="/admin/loan-decisions" routerLinkActive="active" [attr.data-tip]="collapsed() ? 'Loan Decisions' : null">
        <span class="material-icons-outlined">gavel</span>
        <span class="lbl" *ngIf="!collapsed()">Loan Decisions</span>
      </a>
      <a routerLink="/admin/pending-approvals" routerLinkActive="active" [attr.data-tip]="collapsed() ? 'Pending Approvals' : null">
        <span class="material-icons-outlined">pending_actions</span>
        <span class="lbl" *ngIf="!collapsed()">Pending Approvals</span>
      </a>

      <div class="al-section" *ngIf="!collapsed()">Operations</div>
      <a routerLink="/admin/user-management" routerLinkActive="active" [attr.data-tip]="collapsed() ? 'User Management' : null">
        <span class="material-icons-outlined">manage_accounts</span>
        <span class="lbl" *ngIf="!collapsed()">User Management</span>
      </a>
      <a routerLink="/admin/advanced-analytics" routerLinkActive="active" [attr.data-tip]="collapsed() ? 'Advanced Analytics' : null">
        <span class="material-icons-outlined">insights</span>
        <span class="lbl" *ngIf="!collapsed()">Advanced Analytics</span>
      </a>
      <a routerLink="/admin/system-logs" routerLinkActive="active" [attr.data-tip]="collapsed() ? 'System Logs' : null">
        <span class="material-icons-outlined">history</span>
        <span class="lbl" *ngIf="!collapsed()">System Logs</span>
      </a>
    </nav>

    <div class="al-foot">
      <button class="al-logout" (click)="logout()" [attr.data-tip]="collapsed() ? 'Logout' : null">
        <span class="material-icons-outlined">logout</span>
        <span class="lbl" *ngIf="!collapsed()">Logout</span>
      </button>
    </div>
  </aside>

  <div class="al-main" [class.shrunk]="collapsed()">
    <div class="al-topbar">
      <button class="al-burger" (click)="mobileOpen.set(!mobileOpen())" title="Menu">
        <span class="material-icons-outlined">menu</span>
      </button>
      <button class="al-back" *ngIf="canGoBack()" (click)="goBack()" title="Back">
        <span class="material-icons-outlined">arrow_back</span>
        <span>Back</span>
      </button>
      <a routerLink="/admin/dashboard" class="al-home" *ngIf="canGoBack()" title="Dashboard">
        <span class="material-icons-outlined">home</span>
      </a>
      <div class="al-crumb" *ngIf="pageLabel()">
        <span class="material-icons-outlined">chevron_right</span>
        <span>{{ pageLabel() }}</span>
      </div>
      <div class="al-spacer"></div>
      <div class="al-badge">
        <span class="material-icons-outlined">shield</span>
        Administrator
      </div>
      <button class="al-iconbtn" title="Notifications" type="button">
        <span class="material-icons-outlined">notifications_none</span>
        <span class="al-dot"></span>
      </button>
      <div class="al-profile" title="Admin">
        <div class="al-avatar">{{ initials() }}</div>
        <div class="al-uinfo">
          <span class="al-uname">{{ userName() }}</span>
          <small>System Admin</small>
        </div>
      </div>
    </div>

    <div class="al-content">
      <router-outlet></router-outlet>
    </div>
  </div>
</div>
  `,
  styles: [`
.al-shell { display: flex; min-height: 100vh; font-family: 'Inter', sans-serif; background: #f3f5f9; }

.al-sidebar {
  width: 260px;
  background: linear-gradient(180deg, #1a0a0a 0%, #2a1010 50%, #1a0a0a 100%);
  display: flex; flex-direction: column;
  position: fixed; top: 0; left: 0; bottom: 0;
  z-index: 100;
  transition: width .25s cubic-bezier(.4,0,.2,1);
  box-shadow: 4px 0 24px rgba(40, 10, 10, 0.18);
}
.al-sidebar.collapsed { width: 76px; }

.al-brand-row {
  padding: 18px 16px;
  display: flex; align-items: center; justify-content: space-between;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  min-height: 72px;
}
.al-brand { display: flex; align-items: center; gap: 12px; color: white; }
.al-logo {
  width: 38px; height: 38px; border-radius: 10px;
  background: linear-gradient(135deg, #c62828, #ef5350);
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 6px 16px rgba(198,40,40,.45);
}
.al-logo .material-icons-outlined { color: white; font-size: 22px; }
.al-brand-text { display: flex; flex-direction: column; line-height: 1.15; }
.al-brand-text span { font-size: 16px; font-weight: 800; letter-spacing: -0.01em; }
.al-brand-text small { color: rgba(255,255,255,.45); font-size: 10.5px; font-weight: 500; letter-spacing: .03em; }
.al-brand .hl { color: #ef5350; }

.al-collapse {
  background: rgba(255,255,255,.06); border: none; color: rgba(255,255,255,.65);
  width: 34px; height: 34px; border-radius: 10px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all .2s;
}
.al-collapse:hover { background: rgba(255,255,255,.14); color: white; transform: scale(1.05); }

.al-nav { flex: 1; padding: 14px 12px; display: flex; flex-direction: column; gap: 3px; overflow-y: auto; }
.al-nav::-webkit-scrollbar { width: 4px; }
.al-nav::-webkit-scrollbar-thumb { background: rgba(255,255,255,.08); border-radius: 2px; }
.al-nav a {
  display: flex; align-items: center; gap: 12px;
  padding: 11px 14px; border-radius: 11px;
  color: rgba(255,255,255,.58); font-size: 13.5px; font-weight: 500;
  text-decoration: none; transition: all .18s; white-space: nowrap;
  position: relative;
}
.al-nav a:hover { background: rgba(255,255,255,.06); color: rgba(255,255,255,.92); transform: translateX(2px); }
.al-nav a.active {
  background: linear-gradient(90deg, rgba(239,83,80,.22), rgba(239,83,80,.08));
  color: #ff7676; font-weight: 600;
}
.al-nav a.active::before {
  content: ''; position: absolute; left: 0; top: 8px; bottom: 8px; width: 3px;
  background: linear-gradient(180deg, #ef5350, #c62828);
  border-radius: 0 4px 4px 0;
}
.al-nav a .material-icons-outlined { font-size: 21px; min-width: 21px; }

.al-nav a[data-tip]::after,
.al-foot button[data-tip]::after {
  content: attr(data-tip);
  position: absolute; left: calc(100% + 14px); top: 50%; transform: translateY(-50%);
  background: #1a0a0a; color: white;
  padding: 6px 10px; border-radius: 6px;
  font-size: 12px; font-weight: 500; white-space: nowrap;
  opacity: 0; pointer-events: none;
  transition: opacity .18s, transform .18s;
  z-index: 200;
  box-shadow: 0 8px 20px rgba(0,0,0,.3);
  border: 1px solid rgba(255,255,255,.08);
}
.al-nav a[data-tip]:hover::after,
.al-foot button[data-tip]:hover::after { opacity: 1; transform: translateY(-50%) translateX(2px); }

.al-section {
  font-size: .66rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;
  color: rgba(255,255,255,.28); padding: 12px 14px 6px; margin-top: 4px;
}

.al-foot { padding: 14px 12px; border-top: 1px solid rgba(255,255,255,.06); }
.al-logout {
  display: flex; align-items: center; gap: 12px;
  padding: 11px 14px; border: none; border-radius: 11px;
  background: transparent; color: rgba(255,255,255,.48);
  width: 100%; cursor: pointer; font-size: 13.5px; font-weight: 500;
  transition: all .18s; position: relative;
}
.al-logout:hover { background: rgba(239,68,68,.18); color: #f87171; }
.al-logout .material-icons-outlined { font-size: 21px; }

.al-main { flex: 1; margin-left: 260px; transition: margin-left .25s; display: flex; flex-direction: column; min-width: 0; }
.al-main.shrunk { margin-left: 76px; }

.al-topbar {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 24px;
  background: rgba(255,255,255,.85);
  backdrop-filter: saturate(180%) blur(10px);
  -webkit-backdrop-filter: saturate(180%) blur(10px);
  border-bottom: 1px solid #e5e7eb;
  position: sticky; top: 0; z-index: 50;
  min-height: 64px;
}
.al-back {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 7px 14px; border-radius: 9px;
  background: #fff5f5; color: #c62828; border: 1.5px solid #ffcdd2;
  font-weight: 600; font-size: 13px; cursor: pointer;
  transition: all .18s;
}
.al-back:hover { background: #ffebee; transform: translateX(-2px); }
.al-home {
  display: inline-flex; align-items: center; justify-content: center;
  width: 36px; height: 36px; border-radius: 9px;
  background: #f3f4f6; color: #6b7280; text-decoration: none;
  transition: all .18s;
}
.al-home:hover { background: #fee2e2; color: #c62828; }
.al-crumb {
  display: flex; align-items: center; gap: 4px;
  color: #6b7280; font-size: 13.5px; font-weight: 600;
}
.al-crumb .material-icons-outlined { font-size: 18px; color: #cbd5e1; }
.al-spacer { flex: 1; }
.al-badge {
  display: flex; align-items: center; gap: 6px;
  padding: 7px 14px; border-radius: 9px;
  background: linear-gradient(135deg,#c62828,#e53935);
  color: white; font-size: 12.5px; font-weight: 700;
  letter-spacing: .02em;
  box-shadow: 0 4px 12px rgba(198,40,40,.30);
}
.al-badge .material-icons-outlined { font-size: 17px; }

.al-iconbtn {
  position: relative;
  width: 38px; height: 38px; border-radius: 10px;
  background: #f3f4f6; border: none; color: #4b5563;
  display: inline-flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all .18s;
}
.al-iconbtn:hover { background: #fee2e2; color: #c62828; }
.al-dot {
  position: absolute; top: 8px; right: 9px;
  width: 8px; height: 8px; border-radius: 50%;
  background: #ef4444; border: 2px solid white;
}

.al-profile {
  display: flex; align-items: center; gap: 10px;
  padding: 5px 12px 5px 5px;
  border-radius: 999px;
  background: #f3f4f6;
  transition: all .18s;
}
.al-profile:hover { background: #fee2e2; }
.al-avatar {
  width: 34px; height: 34px; border-radius: 50%;
  background: linear-gradient(135deg, #c62828, #ef5350);
  color: white; font-weight: 700; font-size: 13px;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 2px 6px rgba(198,40,40,.35);
}
.al-uinfo { display: flex; flex-direction: column; line-height: 1.15; }
.al-uname { font-size: 13px; font-weight: 700; color: #111827; max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.al-uinfo small { color: #6b7280; font-size: 10.5px; font-weight: 500; }

.al-content { flex: 1; min-width: 0; }

.al-burger {
  display: none;
  width: 38px; height: 38px; border-radius: 9px;
  background: #f3f4f6; border: none; color: #1f2937;
  align-items: center; justify-content: center; cursor: pointer;
}
.al-burger:hover { background: #fee2e2; color: #c62828; }
.al-backdrop {
  display: none;
  position: fixed; inset: 0;
  background: rgba(15, 23, 42, .55);
  backdrop-filter: blur(2px);
  z-index: 99;
}

@media (max-width: 768px) {
  .al-uinfo { display: none; }
  .al-badge span:not(.material-icons-outlined) { display: none; }
  .al-crumb { display: none; }
  .al-burger { display: inline-flex; }
  .al-backdrop { display: block; }
  .al-topbar { padding: 10px 14px; }
}
  `]
})
export class AdminLayoutComponent {
  collapsed = signal(false);
  mobileOpen = signal(false);
  canGoBack = signal(false);
  pageLabel = signal<string>('');
  userName = signal<string>('Admin');
  initials = signal<string>('A');

  constructor(private router: Router, private location: Location) {
    this.updateBack(this.router.url);
    this.updateLabel(this.router.url);
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: any) => {
        const url = e.urlAfterRedirects || e.url;
        this.updateBack(url);
        this.updateLabel(url);
        this.mobileOpen.set(false);
      });
    this.loadUser();
  }

  private loadUser() {
    if (typeof sessionStorage === 'undefined') return;
    const name = sessionStorage.getItem('userName')
              || sessionStorage.getItem('fullName')
              || sessionStorage.getItem('email')
              || 'Admin';
    this.userName.set(name);
    const parts = name.trim().split(/\s+/);
    const ini = parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : (name[0] || 'A').toUpperCase();
    this.initials.set(ini);
  }

  private updateBack(url: string) {
    this.canGoBack.set(!!url && !url.startsWith('/admin/dashboard'));
  }

  private updateLabel(url: string) {
    const map: Record<string, string> = {
      'admin/dashboard': 'Dashboard',
      'admin/loan-dashboard': 'Loan Dashboard',
      'admin/loan-products': 'Loan Products',
      'admin/loan-decisions': 'Loan Decisions',
      'admin/pending-approvals': 'Pending Approvals',
      'admin/user-management': 'User Management',
      'admin/advanced-analytics': 'Advanced Analytics',
      'admin/system-logs': 'System Logs',
    };
    const clean = (url || '').replace(/^\//, '').split('?')[0];
    let label = '';
    for (const key of Object.keys(map)) {
      if (clean.startsWith(key)) { label = map[key]; break; }
    }
    this.pageLabel.set(label);
  }

  toggle() { this.collapsed.update(v => !v); }

  goBack() {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/admin/dashboard']);
    }
  }

  logout() {
    if (typeof sessionStorage !== 'undefined') sessionStorage.clear();
    if (typeof localStorage !== 'undefined') localStorage.clear();
    this.router.navigate(['/login']);
  }
}
