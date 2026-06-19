import { Component, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';

@Component({
  selector: 'app-customer-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
<div class="cl-shell">

  <div class="cl-backdrop" *ngIf="mobileOpen()" (click)="mobileOpen.set(false)"></div>

  <aside class="cl-sidebar" [class.collapsed]="collapsed()" [class.mobile-open]="mobileOpen()">
    <div class="cl-brand-row">
      <div class="cl-brand" *ngIf="!collapsed()">
        <div class="cl-logo">
          <span class="material-icons-outlined">account_balance</span>
        </div>
        <div class="cl-brand-text">
          <span>NeoBank<span class="hl">360</span></span>
          <small>Smart Digital Banking</small>
        </div>
      </div>
      <button class="cl-collapse" (click)="toggle()" [title]="collapsed() ? 'Expand sidebar' : 'Collapse sidebar'">
        <span class="material-icons-outlined">{{ collapsed() ? 'menu' : 'menu_open' }}</span>
      </button>
    </div>

    <nav class="cl-nav">
      <a routerLink="/customer/dashboard" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}"
         [attr.data-tip]="collapsed() ? 'Dashboard' : null">
        <span class="material-icons-outlined">dashboard</span>
        <span class="lbl" *ngIf="!collapsed()">Dashboard</span>
      </a>

      <div class="cl-section" *ngIf="!collapsed()">Banking</div>
      <a routerLink="/transactions" routerLinkActive="active" [attr.data-tip]="collapsed() ? 'Transactions' : null">
        <span class="material-icons-outlined">swap_horiz</span>
        <span class="lbl" *ngIf="!collapsed()">Transactions</span>
      </a>
      <a routerLink="/bills" routerLinkActive="active" [attr.data-tip]="collapsed() ? 'Bills' : null">
        <span class="material-icons-outlined">receipt_long</span>
        <span class="lbl" *ngIf="!collapsed()">Bills</span>
      </a>
      <a routerLink="/budget" routerLinkActive="active" [attr.data-tip]="collapsed() ? 'Budget' : null">
        <span class="material-icons-outlined">savings</span>
        <span class="lbl" *ngIf="!collapsed()">Budget</span>
      </a>
      <a routerLink="/rewards" routerLinkActive="active" [attr.data-tip]="collapsed() ? 'Rewards' : null">
        <span class="material-icons-outlined">emoji_events</span>
        <span class="lbl" *ngIf="!collapsed()">Rewards</span>
      </a>

      <div class="cl-section" *ngIf="!collapsed()">Loans</div>
      <a routerLink="/loans/apply" routerLinkActive="active" class="apply-cta" [attr.data-tip]="collapsed() ? 'Apply for Loan' : null">
        <span class="material-icons-outlined">request_quote</span>
        <span class="lbl" *ngIf="!collapsed()">Apply for Loan</span>
      </a>
      <a routerLink="/loans/dashboard" routerLinkActive="active" [attr.data-tip]="collapsed() ? 'Loan Dashboard' : null">
        <span class="material-icons-outlined">dashboard_customize</span>
        <span class="lbl" *ngIf="!collapsed()">Loan Dashboard</span>
      </a>
      <a routerLink="/loans/my-loans" routerLinkActive="active" [attr.data-tip]="collapsed() ? 'My Loans' : null">
        <span class="material-icons-outlined">account_balance_wallet</span>
        <span class="lbl" *ngIf="!collapsed()">My Loans</span>
      </a>

      <div class="cl-section" *ngIf="!collapsed()">Insights</div>
      <a routerLink="/analytics" routerLinkActive="active" [attr.data-tip]="collapsed() ? 'Analytics' : null">
        <span class="material-icons-outlined">analytics</span>
        <span class="lbl" *ngIf="!collapsed()">Analytics</span>
      </a>
      <a routerLink="/advanced-analytics" routerLinkActive="active" [attr.data-tip]="collapsed() ? 'Advanced Analytics' : null">
        <span class="material-icons-outlined">insights</span>
        <span class="lbl" *ngIf="!collapsed()">Advanced Analytics</span>
      </a>
    </nav>

    <div class="cl-foot">
      <button class="cl-logout" (click)="logout()" [attr.data-tip]="collapsed() ? 'Sign Out' : null">
        <span class="material-icons-outlined">logout</span>
        <span class="lbl" *ngIf="!collapsed()">Sign Out</span>
      </button>
    </div>
  </aside>

  <div class="cl-main" [class.shrunk]="collapsed()">
    <div class="cl-topbar">
      <button class="cl-burger" (click)="mobileOpen.set(!mobileOpen())" title="Menu">
        <span class="material-icons-outlined">menu</span>
      </button>
      <button class="cl-back" *ngIf="canGoBack()" (click)="goBack()" title="Back">
        <span class="material-icons-outlined">arrow_back</span>
        <span>Back</span>
      </button>
      <a routerLink="/customer/dashboard" class="cl-home" *ngIf="canGoBack()" title="Dashboard">
        <span class="material-icons-outlined">home</span>
      </a>
      <div class="cl-crumb" *ngIf="pageLabel()">
        <span class="material-icons-outlined">chevron_right</span>
        <span>{{ pageLabel() }}</span>
      </div>
      <div class="cl-spacer"></div>
      <a routerLink="/loans/apply" class="cl-cta">
        <span class="material-icons-outlined">request_quote</span>
        Apply for Loan
      </a>
      <button class="cl-iconbtn" title="Notifications" type="button">
        <span class="material-icons-outlined">notifications_none</span>
        <span class="cl-dot"></span>
      </button>
      <a routerLink="/user/profile" class="cl-profile" title="Profile">
        <div class="cl-avatar">{{ initials() }}</div>
        <div class="cl-uinfo">
          <span class="cl-uname">{{ userName() }}</span>
          <small>Customer</small>
        </div>
      </a>
    </div>

    <div class="cl-content">
      <router-outlet></router-outlet>
    </div>
  </div>
</div>
  `,
  styles: [`
.cl-shell { display: flex; min-height: 100vh; font-family: 'Inter', sans-serif; background: #f3f5f9; }

.cl-sidebar {
  width: 260px;
  background: linear-gradient(180deg, #0c1f3a 0%, #0e3a5f 55%, #0c1f3a 100%);
  display: flex; flex-direction: column;
  position: fixed; top: 0; left: 0; bottom: 0;
  z-index: 100;
  transition: width .25s cubic-bezier(.4,0,.2,1);
  box-shadow: 4px 0 24px rgba(8, 30, 60, 0.18);
}
.cl-sidebar.collapsed { width: 76px; }

.cl-brand-row {
  padding: 18px 16px;
  display: flex; align-items: center; justify-content: space-between;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  min-height: 72px;
}
.cl-brand { display: flex; align-items: center; gap: 12px; color: white; }
.cl-logo {
  width: 38px; height: 38px; border-radius: 10px;
  background: linear-gradient(135deg, #0891b2, #22d3ee);
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 6px 16px rgba(8, 145, 178, .45);
}
.cl-logo .material-icons-outlined { color: white; font-size: 22px; }
.cl-brand-text { display: flex; flex-direction: column; line-height: 1.15; }
.cl-brand-text span { font-size: 16px; font-weight: 800; letter-spacing: -0.01em; }
.cl-brand-text small { color: rgba(255,255,255,.45); font-size: 10.5px; font-weight: 500; letter-spacing: .03em; }
.cl-brand .hl { color: #22d3ee; }

.cl-collapse {
  background: rgba(255,255,255,.06); border: none; color: rgba(255,255,255,.65);
  width: 34px; height: 34px; border-radius: 10px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all .2s;
}
.cl-collapse:hover { background: rgba(255,255,255,.14); color: white; transform: scale(1.05); }

.cl-nav { flex: 1; padding: 14px 12px; display: flex; flex-direction: column; gap: 3px; overflow-y: auto; }
.cl-nav::-webkit-scrollbar { width: 4px; }
.cl-nav::-webkit-scrollbar-thumb { background: rgba(255,255,255,.08); border-radius: 2px; }

.cl-nav a {
  display: flex; align-items: center; gap: 12px;
  padding: 11px 14px; border-radius: 11px;
  color: rgba(255,255,255,.58); font-size: 13.5px; font-weight: 500;
  text-decoration: none; transition: all .18s; white-space: nowrap;
  position: relative;
}
.cl-nav a:hover { background: rgba(255,255,255,.06); color: rgba(255,255,255,.92); transform: translateX(2px); }
.cl-nav a.active {
  background: linear-gradient(90deg, rgba(8, 145, 178,.25), rgba(8, 145, 178,.08));
  color: #67e8f9; font-weight: 600;
}
.cl-nav a.active::before {
  content: ''; position: absolute; left: 0; top: 8px; bottom: 8px; width: 3px;
  background: linear-gradient(180deg, #22d3ee, #0891b2);
  border-radius: 0 4px 4px 0;
  box-shadow: 0 0 12px rgba(34, 211, 238, .55);
}
.cl-nav a .material-icons-outlined { font-size: 21px; min-width: 21px; }
.cl-nav a.apply-cta {
  background: linear-gradient(135deg, rgba(34,197,94,.18), rgba(16,185,129,.18));
  color: #34d399;
  border: 1px solid rgba(52,211,153,.30);
  margin-top: 4px;
}
.cl-nav a.apply-cta:hover { background: linear-gradient(135deg, rgba(34,197,94,.28), rgba(16,185,129,.28)); color: #6ee7b7; }
.cl-nav a.apply-cta.active {
  background: linear-gradient(135deg,#16a34a,#10b981); color: white; border-color: transparent;
  box-shadow: 0 8px 20px rgba(16,185,129,.35);
}
.cl-nav a.apply-cta.active::before { display: none; }

/* Tooltip when collapsed */
.cl-nav a[data-tip]::after,
.cl-foot button[data-tip]::after {
  content: attr(data-tip);
  position: absolute; left: calc(100% + 14px); top: 50%; transform: translateY(-50%);
  background: #0a1628; color: white;
  padding: 6px 10px; border-radius: 6px;
  font-size: 12px; font-weight: 500; white-space: nowrap;
  opacity: 0; pointer-events: none;
  transition: opacity .18s, transform .18s;
  z-index: 200;
  box-shadow: 0 8px 20px rgba(0,0,0,.3);
  border: 1px solid rgba(255,255,255,.08);
}
.cl-nav a[data-tip]:hover::after,
.cl-foot button[data-tip]:hover::after { opacity: 1; transform: translateY(-50%) translateX(2px); }

.cl-section {
  font-size: .66rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;
  color: rgba(255,255,255,.28); padding: 12px 14px 6px; margin-top: 4px;
}

.cl-foot { padding: 14px 12px; border-top: 1px solid rgba(255,255,255,.06); }
.cl-logout {
  display: flex; align-items: center; gap: 12px;
  padding: 11px 14px; border: none; border-radius: 11px;
  background: transparent; color: rgba(255,255,255,.48);
  width: 100%; cursor: pointer; font-size: 13.5px; font-weight: 500;
  transition: all .18s; position: relative;
}
.cl-logout:hover { background: rgba(239,68,68,.14); color: #f87171; }
.cl-logout .material-icons-outlined { font-size: 21px; }

.cl-main { flex: 1; margin-left: 260px; transition: margin-left .25s; display: flex; flex-direction: column; min-width: 0; }
.cl-main.shrunk { margin-left: 76px; }

.cl-topbar {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 24px;
  background: rgba(255,255,255,.85);
  backdrop-filter: saturate(180%) blur(10px);
  -webkit-backdrop-filter: saturate(180%) blur(10px);
  border-bottom: 1px solid #e5e7eb;
  position: sticky; top: 0; z-index: 50;
  min-height: 64px;
}
.cl-back {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 7px 14px; border-radius: 9px;
  background: #ecfeff; color: #0e7490; border: 1.5px solid #a5f3fc;
  font-weight: 600; font-size: 13px; cursor: pointer;
  transition: all .18s;
}
.cl-back:hover { background: #cffafe; transform: translateX(-2px); }
.cl-home {
  display: inline-flex; align-items: center; justify-content: center;
  width: 36px; height: 36px; border-radius: 9px;
  background: #f3f4f6; color: #6b7280; text-decoration: none;
  transition: all .18s;
}
.cl-home:hover { background: #cffafe; color: #0e7490; }
.cl-crumb {
  display: flex; align-items: center; gap: 4px;
  color: #6b7280; font-size: 13.5px; font-weight: 600;
}
.cl-crumb .material-icons-outlined { font-size: 18px; color: #cbd5e1; }
.cl-spacer { flex: 1; }
.cl-cta {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 9px 16px; border-radius: 10px;
  background: linear-gradient(135deg,#16a34a,#10b981);
  color: white; text-decoration: none; font-weight: 700; font-size: 13px;
  box-shadow: 0 4px 14px rgba(16,185,129,.35);
  transition: all .2s;
}
.cl-cta:hover { transform: translateY(-1px); box-shadow: 0 8px 20px rgba(16,185,129,.45); }
.cl-cta .material-icons-outlined { font-size: 17px; }

.cl-iconbtn {
  position: relative;
  width: 38px; height: 38px; border-radius: 10px;
  background: #f3f4f6; border: none; color: #4b5563;
  display: inline-flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all .18s;
}
.cl-iconbtn:hover { background: #cffafe; color: #0e7490; }
.cl-dot {
  position: absolute; top: 8px; right: 9px;
  width: 8px; height: 8px; border-radius: 50%;
  background: #ef4444; border: 2px solid white;
}

.cl-profile {
  display: flex; align-items: center; gap: 10px;
  padding: 5px 12px 5px 5px;
  border-radius: 999px;
  background: #f3f4f6;
  text-decoration: none; color: inherit;
  transition: all .18s;
}
.cl-profile:hover { background: #cffafe; }
.cl-avatar {
  width: 34px; height: 34px; border-radius: 50%;
  background: linear-gradient(135deg, #0891b2, #22d3ee);
  color: white; font-weight: 700; font-size: 13px;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 2px 6px rgba(8, 145, 178, .35);
}
.cl-uinfo { display: flex; flex-direction: column; line-height: 1.15; }
.cl-uname { font-size: 13px; font-weight: 700; color: #111827; max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cl-uinfo small { color: #6b7280; font-size: 10.5px; font-weight: 500; }

.cl-content { flex: 1; min-width: 0; }

.cl-burger {
  display: none;
  width: 38px; height: 38px; border-radius: 9px;
  background: #f3f4f6; border: none; color: #1f2937;
  align-items: center; justify-content: center; cursor: pointer;
}
.cl-burger:hover { background: #cffafe; color: #0e7490; }
.cl-backdrop {
  display: none;
  position: fixed; inset: 0;
  background: rgba(15, 23, 42, .55);
  backdrop-filter: blur(2px);
  z-index: 99;
}

@media (max-width: 768px) {
  .cl-uinfo { display: none; }
  .cl-cta span:not(.material-icons-outlined) { display: none; }
  .cl-crumb { display: none; }
  .cl-burger { display: inline-flex; }
  .cl-backdrop { display: block; }
  .cl-topbar { padding: 10px 14px; }
}
  `]
})
export class CustomerLayoutComponent {
  collapsed = signal(false);
  mobileOpen = signal(false);
  canGoBack = signal(false);
  pageLabel = signal<string>('');
  userName = signal<string>('Guest');
  initials = signal<string>('G');

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
              || 'Customer';
    this.userName.set(name);
    const parts = name.trim().split(/\s+/);
    const ini = parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : (name[0] || 'C').toUpperCase();
    this.initials.set(ini);
  }

  private updateBack(url: string) {
    this.canGoBack.set(!!url && !url.startsWith('/customer/dashboard'));
  }

  private updateLabel(url: string) {
    const map: Record<string, string> = {
      'customer/dashboard': 'Dashboard',
      'transactions': 'Transactions',
      'bills': 'Bills',
      'budget': 'Budget',
      'rewards': 'Rewards',
      'loans/apply': 'Apply for Loan',
      'loans/dashboard': 'Loan Dashboard',
      'loans/my-loans': 'My Loans',
      'analytics': 'Analytics',
      'advanced-analytics': 'Advanced Analytics',
      'user/profile': 'Profile',
      'customer/accounts': 'Accounts',
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
      this.router.navigate(['/customer/dashboard']);
    }
  }

  logout() {
    if (typeof sessionStorage !== 'undefined') sessionStorage.clear();
    if (typeof localStorage !== 'undefined') localStorage.clear();
    this.router.navigate(['/login']);
  }
}
