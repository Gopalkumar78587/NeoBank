import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { LoanService, RepaymentInstalment } from '../../core/services/loan.service';

@Component({
  selector: 'app-repayment-schedule',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './repayment-schedule.component.html',
  styleUrls: ['./repayment-schedule.component.css']
})
export class RepaymentScheduleComponent implements OnInit {

  loanAccountId!: number;
  instalments: RepaymentInstalment[] = [];
  loading = false;
  error = '';
  payingId: number | null = null;

  constructor(private route: ActivatedRoute, private loanService: LoanService) {}

  ngOnInit(): void {
    this.loanAccountId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadSchedule();
  }

  loadSchedule(): void {
    this.loading = true;
    this.loanService.getRepaymentSchedule(this.loanAccountId).subscribe({
      next: d => { this.instalments = d; this.loading = false; },
      error: () => { this.error = 'Failed to load repayment schedule'; this.loading = false; }
    });
  }

  pay(repaymentId: number): void {
    this.payingId = repaymentId;
    this.loanService.markAsPaid(this.loanAccountId, repaymentId).subscribe({
      next: () => { this.loadSchedule(); this.payingId = null; },
      error: () => { this.error = 'Payment failed. Please try again.'; this.payingId = null; }
    });
  }

  statusClass(status: string): string {
    return { PENDING: 'badge-warning', PAID: 'badge-success', OVERDUE: 'badge-danger' }[status] || '';
  }

  get totalPaid(): number {
    return this.instalments.filter(i => i.paymentStatus === 'PAID').length;
  }

  get progressPct(): number {
    if (!this.instalments.length) return 0;
    return Math.round((this.totalPaid / this.instalments.length) * 100);
  }

  get totalAmount(): number {
    return this.instalments.reduce((s, i) => s + i.emiAmount, 0);
  }
}
