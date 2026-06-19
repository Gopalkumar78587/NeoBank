import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API } from '../config/api.config';

export interface MonthlyAmount { month: string; amount: number; }
export interface CategorySpending {
  category: string;
  budgetLimit: number;
  monthly: MonthlyAmount[];
  totalSpent: number;
}
export interface SpendingAnalytics {
  userId: number;
  months: number;
  categorySpending: CategorySpending[];
}

export interface NetWorthPoint {
  month: string;
  totalBalance: number;
  outstandingPrincipal: number;
  netWorth: number;
}
export interface LoanPayoffForecast {
  loanAccountId: number;
  productName: string;
  monthsRemaining: number;
  projectedPayoffDate: string;
  outstandingPrincipal: number;
}
export interface RewardAccrualPoint { month: string; points: number; }
export interface WealthAnalytics {
  userId: number;
  netWorthTimeline: NetWorthPoint[];
  loanPayoffForecast: LoanPayoffForecast[];
  rewardAccrualHistory: RewardAccrualPoint[];
}

@Injectable({ providedIn: 'root' })
export class UserAnalyticsService {
  constructor(private http: HttpClient) {}

  getSpending(months = 6): Observable<SpendingAnalytics> {
    return this.http.get<SpendingAnalytics>(API.analytics.spendingMe(months));
  }

  getWealth(): Observable<WealthAnalytics> {
    return this.http.get<WealthAnalytics>(API.analytics.wealthMe);
  }
}
