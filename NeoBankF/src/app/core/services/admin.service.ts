import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API } from '../config/api.config';

export interface AdminDashboard {
  totalUsers: number;
  totalActiveUsers: number;
  totalLoans: number;
  pendingApprovals: number;
  totalTransactions: number;
  platformSavingsRate: number;
}

export interface PendingApproval {
  id: number;
  type: string;
  applicantName: string;
  applicantEmail: string;
  productName: string;
  requestedAmount: number;
  requestedTenureMonths: number;
  appliedAt: string;
}

export interface UserAdmin {
  id: number;
  fullName: string;
  email: string;
  role: string;
  active: boolean;
  createdAt: string;
}

export interface SystemHealth {
  dbStatus: string;
  activeSessions: number;
  serverUptimeSeconds: number;
}

@Injectable({ providedIn: 'root' })
export class AdminService {

  private http = inject(HttpClient);
  private base = API.admin.root;

  getStats() {
    return this.http.get<any>(`${this.base}/stats`);
  }

  getAuditLogs(page = 0, size = 20) {
    return this.http.get<any>(`${this.base}/audit-logs?page=${page}&size=${size}`);
  }

  // ── Sprint 4 ─────────────────────────────────────────────────────────────────

  getDashboard() {
    return this.http.get<AdminDashboard>(API.admin.dashboard);
  }

  getPendingApprovals(module?: string) {
    const url = module
      ? `${API.admin.pendingApprovals}?module=${module}`
      : API.admin.pendingApprovals;
    return this.http.get<PendingApproval[]>(url);
  }

  getSystemHealth() {
    return this.http.get<SystemHealth>(API.admin.systemHealth);
  }

  getUsers(page = 0, size = 20) {
    return this.http.get<any>(`${API.admin.users}?page=${page}&size=${size}`);
  }

  updateUserStatus(userId: number, active: boolean) {
    return this.http.patch<any>(API.admin.userStatus(userId), { active });
  }

  getUserActivity(userId: number) {
    return this.http.get<any>(API.admin.userActivity(userId));
  }
}
