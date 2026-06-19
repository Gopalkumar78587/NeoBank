import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LoanService, LoanApplication, LoanDecisionRequest } from '../../core/services/loan.service';

@Component({
  selector: 'app-loan-decisions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './loan-decisions.component.html',
  styleUrls: ['./loan-decisions.component.css']
})
export class LoanDecisionsComponent implements OnInit {

  applications: LoanApplication[] = [];
  filtered: LoanApplication[] = [];
  loading = false;
  error = '';
  success = '';
  filterStatus = 'ALL';

  selectedApp: LoanApplication | null = null;
  decision: LoanDecisionRequest = { decision: 'APPROVED', adminRemarks: '' };
  deciding = false;

  constructor(private loanService: LoanService) {}

  ngOnInit(): void { this.loadAll(); }

  loadAll(): void {
    this.loading = true;
    const status = this.filterStatus === 'ALL' ? undefined : this.filterStatus;
    this.loanService.getAllApplications(status).subscribe({
      next: (data: LoanApplication[]) => {
        this.applications = data;
        this.filtered = data;
        this.loading = false;
      },
      error: () => { this.error = 'Failed to load applications'; this.loading = false; }
    });
  }

  applyFilter(): void {
    if (this.filterStatus === 'ALL') {
      this.filtered = this.applications;
    } else {
      this.filtered = this.applications.filter(a => a.status === this.filterStatus);
    }
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
        this.success = `Application #${this.selectedApp!.id} ${this.decision.decision}D`;
        this.selectedApp = null;
        this.deciding = false;
        this.loadAll();
      },
      error: (err: any) => {
        this.error = err?.error?.message || 'Decision failed';
        this.deciding = false;
      }
    });
  }

  statusClass(status: string): string {
    return { PENDING: 'badge-warning', APPROVED: 'badge-success', REJECTED: 'badge-danger' }[status] || '';
  }
}
