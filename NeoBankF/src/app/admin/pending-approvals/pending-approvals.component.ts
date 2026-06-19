import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminService, PendingApproval } from '../../core/services/admin.service';

@Component({
  selector: 'app-pending-approvals',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './pending-approvals.component.html',
  styleUrls: ['./pending-approvals.component.css']
})
export class PendingApprovalsComponent implements OnInit {
  isBrowser: boolean;
  loading = true;
  error = false;
  approvals: PendingApproval[] = [];

  constructor(
    private adminService: AdminService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit() {
    if (!this.isBrowser) return;
    this.load();
  }

  load() {
    this.loading = true;
    this.error = false;
    this.adminService.getPendingApprovals().subscribe({
      next: (data) => { this.approvals = data; this.loading = false; },
      error: () => { this.error = true; this.loading = false; }
    });
  }

  formatDate(d: string): string {
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
