import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { LoanService, LoanApplication, LoanProduct, LoanDecisionRequest } from '../../core/services/loan.service';

export interface LoanStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  totalDisbursed: number;
}

@Component({
  selector: 'app-admin-loan-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './admin-loan-dashboard.component.html',
  styleUrls: ['./admin-loan-dashboard.component.css']
})
export class AdminLoanDashboardComponent implements OnInit {

  applications: LoanApplication[] = [];
  products: LoanProduct[] = [];
  loading = true;
  error = '';
  success = '';

  // ─── Decision modal ──────────────────────────────────────────
  selectedApp: LoanApplication | null = null;
  decision: LoanDecisionRequest = { decision: 'APPROVED', adminRemarks: '' };
  deciding = false;

  // ─── Filter ──────────────────────────────────────────────────
  filterStatus = 'ALL';

  // ─── Stats ───────────────────────────────────────────────────
  get stats(): LoanStats {
    const total = this.applications.length;
    const pending = this.applications.filter(a => a.status === 'PENDING').length;
    const approved = this.applications.filter(a => a.status === 'APPROVED').length;
    const rejected = this.applications.filter(a => a.status === 'REJECTED').length;
    const totalDisbursed = this.applications
      .filter(a => a.status === 'APPROVED')
      .reduce((s, a) => s + a.requestedAmount, 0);
    return { total, pending, approved, rejected, totalDisbursed };
  }

  get filtered(): LoanApplication[] {
    if (this.filterStatus === 'ALL') return this.applications;
    return this.applications.filter(a => a.status === this.filterStatus);
  }

  get pendingApps(): LoanApplication[] {
    return this.applications.filter(a => a.status === 'PENDING');
  }

  constructor(private loanService: LoanService) {}

  ngOnInit(): void {
    this.loading = true;
    forkJoin({
      apps: this.loanService.getAllApplications().pipe(catchError(() => of([] as LoanApplication[]))),
      products: this.loanService.getProducts().pipe(catchError(() => of([] as LoanProduct[])))
    }).subscribe(({ apps, products }) => {
      this.applications = apps;
      this.products = products;
      this.loading = false;
    });
  }

  openDecision(app: LoanApplication): void {
    this.selectedApp = app;
    this.decision = { decision: 'APPROVED', adminRemarks: '' };
    this.error = '';
  }

  closeModal(): void { this.selectedApp = null; }

  submitDecision(): void {
    if (!this.selectedApp) return;
    this.deciding = true;
    this.loanService.makeDecision(this.selectedApp.id, this.decision).subscribe({
      next: () => {
        this.success = `Application #${this.selectedApp!.id} has been ${this.decision.decision}D successfully.`;
        this.selectedApp = null;
        this.deciding = false;
        this.ngOnInit();
      },
      error: (err: any) => {
        this.error = err?.error?.message || 'Decision failed. Please try again.';
        this.deciding = false;
      }
    });
  }

  statusClass(s: string): string {
    return { PENDING: 'badge-pending', APPROVED: 'badge-approved', REJECTED: 'badge-rejected' }[s] || '';
  }

  trackById(_: number, item: LoanApplication) { return item.id; }
}
