import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API } from '../config/api.config';

@Injectable({ providedIn: 'root' })
export class AdminAccountService {

  private http = inject(HttpClient);
  private base = API.admin.accounts;

  getAllAccounts() {
    return this.http.get<any[]>(this.base);
  }

  freeze(id: number) {
    return this.http.patch(`${this.base}/${id}/freeze`, {});
  }

  activate(id: number) {
    return this.http.patch(`${this.base}/${id}/activate`, {});
  }

  close(id: number) {
    return this.http.patch(`${this.base}/${id}/close`, {});
  }

  getPendingClosures() {
    return this.http.get<any[]>(`${this.base}/pending-closures`);
  }

  approveClosure(id: number) {
    return this.http.patch(`${this.base}/${id}/approve-closure`, {});
  }

  rejectClosure(id: number) {
    return this.http.patch(`${this.base}/${id}/reject-closure`, {});
  }

  // ─── Account-opening approval ---
  getPendingOpenings() {
    return this.http.get<any[]>(`${this.base}/pending-openings`);
  }

  approveOpening(id: number) {
    return this.http.patch(`${this.base}/${id}/approve-opening`, {});
  }

  rejectOpening(id: number, reason?: string) {
    return this.http.patch(`${this.base}/${id}/reject-opening`, { reason: reason || '' });
  }
}

