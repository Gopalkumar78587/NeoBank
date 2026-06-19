import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API } from '../config/api.config';

export interface TrendEntry {
  month: string;
  year: number;
  monthNumber: number;
  totalIncome: number;
  totalExpense: number;
}

export interface FinancialInsights {
  userId: number;
  totalIncome: number;
  totalExpense: number;
  savings: number;
  trendSummary: TrendEntry[];
}

@Injectable({ providedIn: 'root' })
export class InsightsService {
  private http = inject(HttpClient);

  getMyInsights(): Observable<FinancialInsights> {
    return this.http.get<FinancialInsights>(API.insights.me);
  }

  getInsightsByUserId(userId: number): Observable<FinancialInsights> {
    return this.http.get<FinancialInsights>(API.insights.byId(userId));
  }
}
