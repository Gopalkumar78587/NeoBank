import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, interval, startWith, switchMap, of, map, tap, catchError } from 'rxjs';
import { API, POLL_INTERVAL_MS } from '../config/api.config';

export interface BudgetCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  limit: number;
  spent: number;
  period: 'MONTHLY' | 'WEEKLY';
  createdAt: string;
}

export interface BudgetAlert {
  id: string;
  categoryId: string;
  categoryName: string;
  type: 'WARNING' | 'EXCEEDED' | 'INFO';
  message: string;
  percentage: number;
  timestamp: string;
}

interface BudgetResponseDto {
  id: number;
  name: string;
  icon: string;
  color: string;
  limit: number;
  spent: number;
  period: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class BudgetService {

  private http = inject(HttpClient);
  private base = API.customer.budgets;
  private STORAGE_KEY = 'neobank_budgets_cache';

  private budgetsSubject = new BehaviorSubject<BudgetCategory[]>([]);
  budgets$ = this.budgetsSubject.asObservable();

  private alertsSubject = new BehaviorSubject<BudgetAlert[]>([]);
  alerts$ = this.alertsSubject.asObservable();

  constructor() {
    this.hydrateFromCache();
  }

  private hydrateFromCache() {
    if (typeof localStorage === 'undefined') return;
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try { this.budgetsSubject.next(JSON.parse(stored)); } catch { /* ignore */ }
    }
  }

  private writeCache(budgets: BudgetCategory[]) {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(budgets));
    }
  }

  private toModel(d: BudgetResponseDto): BudgetCategory {
    return {
      id: String(d.id),
      name: d.name,
      icon: d.icon,
      color: d.color,
      limit: Number(d.limit) || 0,
      spent: Number(d.spent) || 0,
      period: (d.period === 'WEEKLY' ? 'WEEKLY' : 'MONTHLY'),
      createdAt: d.createdAt
    };
  }

  /** Pull current-month budgets with computed spending from backend */
  getBudgets(): Observable<BudgetCategory[]> {
    return this.http.get<BudgetResponseDto[]>(this.base).pipe(
      map(rows => rows.map(r => this.toModel(r))),
      tap(list => {
        this.budgetsSubject.next(list);
        this.writeCache(list);
        this.generateAlerts(list);
      }),
      catchError(() => of(this.budgetsSubject.value))
    );
  }

  /** Real-time polling */
  getBudgetsRealTime(): Observable<BudgetCategory[]> {
    return interval(POLL_INTERVAL_MS).pipe(
      startWith(0),
      switchMap(() => this.getBudgets())
    );
  }

  /** Triggers a fresh fetch (server recomputes spent from transactions) */
  recalculateSpending(): Observable<BudgetCategory[]> {
    return this.getBudgets();
  }

  addBudget(budget: Partial<BudgetCategory>): Observable<BudgetCategory> {
    const body = {
      name: budget.name ?? 'New Category',
      icon: budget.icon ?? 'category',
      color: budget.color ?? '#546e7a',
      limit: budget.limit ?? 1000,
      period: budget.period ?? 'MONTHLY'
    };
    return this.http.post<BudgetResponseDto>(this.base, body).pipe(
      map(r => this.toModel(r)),
      tap(created => {
        const next = [...this.budgetsSubject.value, created];
        this.budgetsSubject.next(next);
        this.writeCache(next);
      })
    );
  }

  updateBudget(id: string, changes: Partial<BudgetCategory>): Observable<BudgetCategory> {
    const body: any = {};
    if (changes.name !== undefined) body.name = changes.name;
    if (changes.icon !== undefined) body.icon = changes.icon;
    if (changes.color !== undefined) body.color = changes.color;
    if (changes.limit !== undefined) body.limit = changes.limit;
    if (changes.period !== undefined) body.period = changes.period;
    return this.http.put<BudgetResponseDto>(`${this.base}/${id}`, body).pipe(
      map(r => this.toModel(r)),
      tap(updated => {
        const next = this.budgetsSubject.value.map(b => b.id === id ? updated : b);
        this.budgetsSubject.next(next);
        this.writeCache(next);
      })
    );
  }

  deleteBudget(id: string): Observable<any> {
    return this.http.delete(`${this.base}/${id}`).pipe(
      tap(() => {
        const next = this.budgetsSubject.value.filter(b => b.id !== id);
        this.budgetsSubject.next(next);
        this.writeCache(next);
      })
    );
  }

  resetMonthlyBudgets() {
    const budgets = this.budgetsSubject.value.map(b => ({ ...b, spent: 0 }));
    this.budgetsSubject.next(budgets);
    this.writeCache(budgets);
  }

  private generateAlerts(budgets: BudgetCategory[]) {
    const alerts: BudgetAlert[] = [];
    budgets.forEach(b => {
      const pct = b.limit > 0 ? (b.spent / b.limit) * 100 : 0;
      if (pct >= 100) {
        alerts.push({ id: 'a_' + b.id, categoryId: b.id, categoryName: b.name, type: 'EXCEEDED', message: `${b.name} budget exceeded! Rs.${b.spent.toFixed(0)} / Rs.${b.limit}`, percentage: pct, timestamp: new Date().toISOString() });
      } else if (pct >= 80) {
        alerts.push({ id: 'a_' + b.id, categoryId: b.id, categoryName: b.name, type: 'WARNING', message: `${b.name} budget at ${pct.toFixed(0)}%! Rs.${b.spent.toFixed(0)} / Rs.${b.limit}`, percentage: pct, timestamp: new Date().toISOString() });
      }
    });
    this.alertsSubject.next(alerts);
  }

  getTotalBudget(): number {
    return this.budgetsSubject.value.reduce((s, b) => s + b.limit, 0);
  }

  getTotalSpent(): number {
    return this.budgetsSubject.value.reduce((s, b) => s + b.spent, 0);
  }

  getAlerts(): BudgetAlert[] {
    return this.alertsSubject.value;
  }
}
