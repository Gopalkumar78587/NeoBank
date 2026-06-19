import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API } from '../config/api.config';

export interface DailyPoint { date: string; inflow: number; outflow: number; }
export interface AdminTxnAnalytics {
  timeframe: string;
  dailyVolumes: DailyPoint[];
  averageTicketSize: number;
  totalInflow: number;
  totalOutflow: number;
  transactionCount: number;
}

export interface ProductBreakdown { productName: string; pending: number; approved: number; rejected: number; }
export interface AdminLoanAnalytics {
  timeframe: string;
  distributionByStatus: { [status: string]: number };
  byProduct: ProductBreakdown[];
  npaCount: number;
  npaRatio: number;
}

export interface SystemAuditLog {
  id: number;
  endpoint: string;
  httpMethod: string;
  responseStatus: number;
  executionTimeMs: number;
  actingUserId: number | null;
  eventTimestamp: string;
  errorMessage: string | null;
}

export interface SystemLogsPage {
  content: SystemAuditLog[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

export interface SystemLogsHealth {
  totalLogs: number;
  totalErrors: number;
  avgResponseMs: number;
  hourlyErrors: { hour: number; errors: number; total: number }[];
  hourlyResponse: { hour: number; avgMs: number }[];
}

@Injectable({ providedIn: 'root' })
export class AdminAnalyticsService {
  constructor(private http: HttpClient) {}

  getTransactionAnalytics(timeframe: '7d' | '30d' | 'YTD'): Observable<AdminTxnAnalytics> {
    return this.http.get<AdminTxnAnalytics>(API.admin.txnAnalytics(timeframe));
  }

  getLoanAnalytics(timeframe: '7d' | '30d' | 'YTD'): Observable<AdminLoanAnalytics> {
    return this.http.get<AdminLoanAnalytics>(API.admin.loanAnalytics(timeframe));
  }

  getSystemLogs(opts: { page?: number; size?: number; status?: number; from?: string; to?: string } = {})
    : Observable<SystemLogsPage> {
    const params: string[] = [];
    if (opts.page   != null) params.push(`page=${opts.page}`);
    if (opts.size   != null) params.push(`size=${opts.size}`);
    if (opts.status != null) params.push(`status=${opts.status}`);
    if (opts.from)           params.push(`from=${opts.from}`);
    if (opts.to)             params.push(`to=${opts.to}`);
    const qs = params.length ? '?' + params.join('&') : '';
    return this.http.get<SystemLogsPage>(API.admin.systemLogs + qs);
  }

  getSystemLogsHealth(): Observable<SystemLogsHealth> {
    return this.http.get<SystemLogsHealth>(API.admin.systemLogsHealth);
  }
}
