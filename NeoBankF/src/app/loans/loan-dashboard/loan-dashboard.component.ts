import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { LoanService, LoanAccount, LoanApplication, RepaymentInstalment } from '../../core/services/loan.service';

export interface UpcomingEmi {
  loanAccountId: number;
  productName: string;
  instalmentNumber: number;
  dueDate: string;
  emiAmount: number;
  paymentStatus: 'PENDING' | 'OVERDUE';
  repaymentId: number;
}

@Component({
  selector: 'app-loan-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './loan-dashboard.component.html',
  styleUrls: ['./loan-dashboard.component.css']
})
export class LoanDashboardComponent implements OnInit {

  accounts: LoanAccount[] = [];
  applications: LoanApplication[] = [];
  upcomingEmis: UpcomingEmi[] = [];
  allRepayments: (RepaymentInstalment & { loanAccountId: number; productName: string })[] = [];

  loading = true;
  error = '';
  payingId: number | null = null;
  paySuccess = '';

  // ─── Computed stats ──────────────────────────────────────────
  get activeLoans(): number { return this.accounts.length; }

  get totalBorrowed(): number {
    return this.accounts.reduce((s, a) => s + a.principalAmount, 0);
  }

  get monthlyEmiTotal(): number {
    return this.accounts.reduce((s, a) => s + a.emiAmount, 0);
  }

  get overdueCount(): number {
    return this.upcomingEmis.filter(e => e.paymentStatus === 'OVERDUE').length;
  }

  get pendingApplications(): LoanApplication[] {
    return this.applications.filter(a => a.status === 'PENDING');
  }

  get paidInstalments(): number {
    return this.allRepayments.filter(r => r.paymentStatus === 'PAID').length;
  }

  get totalInstalments(): number { return this.allRepayments.length; }

  constructor(private loanService: LoanService) {}

  ngOnInit(): void {
    forkJoin([
      this.loanService.getMyAccounts().pipe(catchError(() => of([]))),
      this.loanService.getMyApplications().pipe(catchError(() => of([])))
    ]).subscribe(([accounts, applications]) => {
      this.accounts = accounts;
      this.applications = applications;

      if (accounts.length === 0) {
        this.loading = false;
        return;
      }

      // Load repayment schedule for each loan account
      forkJoin(
        accounts.map(acc =>
          this.loanService.getRepaymentSchedule(acc.id).pipe(
            catchError(() => of([])),
          )
        )
      ).subscribe((schedules: RepaymentInstalment[][]) => {
        this.allRepayments = schedules.flatMap((schedule, idx) =>
          schedule.map(r => ({
            ...r,
            loanAccountId: accounts[idx].id,
            productName: accounts[idx].productName
          }))
        );

        // Upcoming EMIs = PENDING or OVERDUE, sorted by due date
        this.upcomingEmis = this.allRepayments
          .filter(r => r.paymentStatus === 'PENDING' || r.paymentStatus === 'OVERDUE')
          .map(r => ({
            loanAccountId: r.loanAccountId,
            productName: r.productName,
            instalmentNumber: r.instalmentNumber,
            dueDate: r.dueDate,
            emiAmount: r.emiAmount,
            paymentStatus: r.paymentStatus as 'PENDING' | 'OVERDUE',
            repaymentId: r.id
          }))
          .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

        this.loading = false;
      });
    });
  }

  payNow(emi: UpcomingEmi): void {
    this.payingId = emi.repaymentId;
    this.paySuccess = '';
    this.error = '';
    this.loanService.markAsPaid(emi.loanAccountId, emi.repaymentId).subscribe({
      next: () => {
        this.paySuccess = `EMI #${emi.instalmentNumber} for ${emi.productName} marked as paid!`;
        this.payingId = null;
        this.ngOnInit(); // Refresh all data
      },
      error: () => { this.error = 'Payment failed. Please try again.'; this.payingId = null; }
    });
  }

  daysUntil(dateStr: string): number {
    const diff = new Date(dateStr).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  progressPct(acc: LoanAccount): number {
    const paid = this.allRepayments.filter(
      r => r.loanAccountId === acc.id && r.paymentStatus === 'PAID'
    ).length;
    const total = this.allRepayments.filter(r => r.loanAccountId === acc.id).length;
    return total > 0 ? Math.round((paid / total) * 100) : 0;
  }

  paidCount(acc: LoanAccount): number {
    return this.allRepayments.filter(
      r => r.loanAccountId === acc.id && r.paymentStatus === 'PAID'
    ).length;
  }

  totalCount(acc: LoanAccount): number {
    return this.allRepayments.filter(r => r.loanAccountId === acc.id).length;
  }

  statusClass(s: string): string {
    return { PENDING: 'badge-pending', APPROVED: 'badge-approved', REJECTED: 'badge-rejected',
             PAID: 'badge-paid', OVERDUE: 'badge-overdue' }[s] || '';
  }
}
