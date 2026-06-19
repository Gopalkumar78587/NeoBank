import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LoanService, LoanAccount, LoanApplication } from '../../core/services/loan.service';

@Component({
  selector: 'app-my-loans',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './my-loans.component.html',
  styleUrls: ['./my-loans.component.css']
})
export class MyLoansComponent implements OnInit {

  accounts: LoanAccount[] = [];
  applications: LoanApplication[] = [];
  activeTab: 'accounts' | 'applications' = 'accounts';
  loading = false;
  error = '';

  constructor(private loanService: LoanService) {}

  ngOnInit(): void {
    this.loadAccounts();
    this.loadApplications();
  }

  loadAccounts(): void {
    this.loading = true;
    this.loanService.getMyAccounts().subscribe({
      next: a => { this.accounts = a; this.loading = false; },
      error: () => { this.error = 'Failed to load loan accounts'; this.loading = false; }
    });
  }

  loadApplications(): void {
    this.loanService.getMyApplications().subscribe({
      next: a => this.applications = a,
      error: () => {}
    });
  }

  statusClass(status: string): string {
    return { PENDING: 'badge-warning', APPROVED: 'badge-success', REJECTED: 'badge-danger' }[status] || '';
  }
}
