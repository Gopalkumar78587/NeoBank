import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, interval, switchMap, startWith, BehaviorSubject, map } from 'rxjs';
import { API, POLL_INTERVAL_MS } from '../config/api.config';

export interface Bill {
  id: number;
  billerName: string;
  category: string;
  amount: number;
  dueDate: string;
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'SCHEDULED' | 'FAILED' | 'CANCELLED';
  isRecurring: boolean;
  recurringFrequency?: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  autoPayEnabled: boolean;
  paidAt?: string;
  createdAt?: string;
  accountId?: number;
  referenceNumber?: string;
}

export interface BillAnalytics {
  totalPaid: number;
  totalPending: number;
  totalOverdue: number;
  categoryBreakdown: { category: string; amount: number; count: number }[];
  monthlySpending: { month: string; amount: number }[];
}

@Injectable({ providedIn: 'root' })
export class BillService {

  private http = inject(HttpClient);
  private base = API.customer.bills;
  private billsSubject = new BehaviorSubject<Bill[]>([]);
  bills$ = this.billsSubject.asObservable();

  getBills(): Observable<Bill[]> {
    return this.http.get<Bill[]>(this.base);
  }

  getBillsRealTime(): Observable<Bill[]> {
    return interval(POLL_INTERVAL_MS).pipe(
      startWith(0),
      switchMap(() => this.getBills())
    );
  }

  getBillsByStatus(status: string): Observable<Bill[]> {
    return this.http.get<Bill[]>(`${this.base}?status=${status}`);
  }

  createBill(data: any): Observable<any> {
    return this.http.post(this.base, data);
  }

  payBill(id: number, accountId: number): Observable<any> {
    return this.http.patch(
      `${this.base}/${id}/pay?accountId=${accountId}`, {}
    );
  }

  updateStatus(id: number, status: string): Observable<any> {
    return this.http.patch(
      `${this.base}/${id}/status?status=${status}`, {}
    );
  }

  toggleAutoPay(id: number, enabled: boolean): Observable<any> {
    return this.http.patch(
      `${this.base}/${id}/auto-pay?enabled=${enabled}`, {}
    );
  }

  cancelBill(id: number): Observable<any> {
    return this.http.patch(`${this.base}/${id}/status?status=CANCELLED`, {});
  }

  getAnalytics(): Observable<BillAnalytics> {
    return this.http.get<BillAnalytics>(`${this.base}/analytics`);
  }

  getUpcomingBills(): Observable<Bill[]> {
    return this.getBills().pipe(
      map(bills => {
        const now = new Date();
        const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        return bills.filter(b =>
          b.status === 'PENDING' &&
          new Date(b.dueDate) <= nextWeek &&
          new Date(b.dueDate) >= now
        );
      })
    );
  }

  getOverdueBills(): Observable<Bill[]> {
    return this.getBills().pipe(
      map(bills => bills.filter(b => b.status === 'OVERDUE' || (b.status === 'PENDING' && new Date(b.dueDate) < new Date())))
    );
  }

  computeAnalytics(bills: Bill[]): BillAnalytics {
    const totalPaid = bills.filter(b => b.status === 'PAID').reduce((s, b) => s + b.amount, 0);
    const totalPending = bills.filter(b => b.status === 'PENDING').reduce((s, b) => s + b.amount, 0);
    const totalOverdue = bills.filter(b => b.status === 'OVERDUE').reduce((s, b) => s + b.amount, 0);

    const catMap = new Map<string, { amount: number; count: number }>();
    bills.forEach(b => {
      const cat = b.category || 'Other';
      const existing = catMap.get(cat) || { amount: 0, count: 0 };
      existing.amount += b.amount;
      existing.count++;
      catMap.set(cat, existing);
    });
    const categoryBreakdown = Array.from(catMap.entries()).map(([category, data]) => ({
      category, ...data
    }));

    const monthMap = new Map<string, number>();
    bills.filter(b => b.status === 'PAID').forEach(b => {
      const d = new Date(b.paidAt || b.dueDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthMap.set(key, (monthMap.get(key) || 0) + b.amount);
    });
    const monthlySpending = Array.from(monthMap.entries())
      .map(([month, amount]) => ({ month, amount }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return { totalPaid, totalPending, totalOverdue, categoryBreakdown, monthlySpending };
  }
}

