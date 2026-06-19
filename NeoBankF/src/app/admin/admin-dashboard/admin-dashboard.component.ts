import { Component, OnInit, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AdminAccountService } from '../../core/services/admin-account.service';
import { AdminService } from '../../core/services/admin.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {

  activeTab: 'overview' | 'accounts' | 'users' | 'closures' | 'openings' | 'stats' | 'audit' = 'overview';
  sidebarCollapsed = false;
  currentDate = new Date();

  allAccounts: any[] = [];
  filteredAccounts: any[] = [];
  pendingClosures: any[] = [];
  pendingOpenings: any[] = [];

  // Users derived from accounts
  uniqueUsers: any[] = [];
  filteredUsers: any[] = [];
  userSearchQuery = '';

  totalAccounts = 0;
  activeAccounts = 0;
  frozenAccounts = 0;
  closedAccounts = 0;
  totalUsers = 0;
  totalTransactions = 0;

  // Stats from /api/admin/stats
  stats: any = null;
  statsChartBars: { label: string; value: number; percent: number; color: string }[] = [];

  // Audit logs from /api/admin/audit-logs
  auditLogs: any[] = [];
  auditLogsTotal = 0;
  auditPage = 0;
  auditSize = 20;
  auditActionFilter = '';
  auditLoading = false;

  searchQuery = '';
  statusFilter = '';
  successMessage = '';
  errorMessage = '';

  private isBrowser: boolean;

  constructor(
    private adminAccountService: AdminAccountService,
    private adminService: AdminService,
    private router: Router,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    if (!this.isBrowser) return;
    this.loadAccounts();
    this.loadStats();
    this.loadAuditLogs();
  }

  switchTab(tab: typeof this.activeTab) {
    this.activeTab = tab;
    this.clearMessages();
    if (tab === 'stats') this.loadStats();
    if (tab === 'audit') this.loadAuditLogs();
  }

  clearMessages() {
    this.successMessage = '';
    this.errorMessage = '';
  }

  // ========== DATA LOADING ==========

  loadAccounts() {
    this.adminAccountService.getAllAccounts().subscribe({
      next: (res) => {
        this.allAccounts = res;
        this.totalAccounts = res.length;
        this.activeAccounts = res.filter((a: any) => a.status === 'ACTIVE').length;
        this.frozenAccounts = res.filter((a: any) => a.status === 'FROZEN').length;
        this.closedAccounts = res.filter((a: any) => a.status === 'CLOSED').length;
        this.pendingClosures = res.filter((a: any) => a.closureStatus === 'PENDING');
        this.pendingOpenings = res.filter((a: any) => a.status === 'PENDING_APPROVAL');
        this.applyFilters();
        this.buildUserList();
      },
      error: () => {
        this.errorMessage = 'Failed to load accounts. Admin access may be denied.';
      }
    });
  }

  // ========== ACCOUNT FILTERS ==========

  applyFilters() {
    let result = [...this.allAccounts];

    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter((a: any) =>
        (a.accountNumber && a.accountNumber.toLowerCase().includes(q)) ||
        (a.user?.email && a.user.email.toLowerCase().includes(q)) ||
        (a.user?.fullName && a.user.fullName.toLowerCase().includes(q))
      );
    }

    if (this.statusFilter) {
      result = result.filter((a: any) => a.status === this.statusFilter);
    }

    this.filteredAccounts = result;
  }

  // ========== USER LIST (derived from accounts) ==========

  buildUserList() {
    const userMap = new Map<string, any>();

    this.allAccounts.forEach((acc: any) => {
      if (!acc.user?.email) return;
      const email = acc.user.email;

      if (!userMap.has(email)) {
        userMap.set(email, {
          fullName: acc.user.fullName || '',
          email: email,
          role: acc.user.role || 'CUSTOMER',
          totalAccounts: 0,
          activeAccounts: 0
        });
      }

      const u = userMap.get(email)!;
      u.totalAccounts++;
      if (acc.status === 'ACTIVE') u.activeAccounts++;
    });

    this.uniqueUsers = Array.from(userMap.values());
    this.filteredUsers = [...this.uniqueUsers];
  }

  applyUserFilters() {
    if (!this.userSearchQuery) {
      this.filteredUsers = [...this.uniqueUsers];
      return;
    }
    const q = this.userSearchQuery.toLowerCase();
    this.filteredUsers = this.uniqueUsers.filter((u: any) =>
      (u.fullName && u.fullName.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q))
    );
  }

  // ========== ACCOUNT ACTIONS ==========

  freezeAccount(id: number) {
    if (!confirm('Are you sure you want to freeze this account?')) return;
    this.clearMessages();
    this.adminAccountService.freeze(id).subscribe({
      next: () => {
        this.successMessage = 'Account frozen successfully.';
        this.loadAccounts();
      },
      error: () => this.errorMessage = 'Failed to freeze account.'
    });
  }

  activateAccount(id: number) {
    if (!confirm('Activate this account?')) return;
    this.clearMessages();
    this.adminAccountService.activate(id).subscribe({
      next: () => {
        this.successMessage = 'Account activated successfully.';
        this.loadAccounts();
      },
      error: () => this.errorMessage = 'Failed to activate account.'
    });
  }

  closeAccount(id: number) {
    if (!confirm('Are you sure you want to close this account? This action cannot be undone.')) return;
    this.clearMessages();
    this.adminAccountService.close(id).subscribe({
      next: () => {
        this.successMessage = 'Account closed successfully.';
        this.loadAccounts();
      },
      error: () => this.errorMessage = 'Failed to close account.'
    });
  }

  // ========== CLOSURE APPROVALS ==========

  approveClosure(id: number) {
    if (!confirm('Approve this closure request?')) return;
    this.clearMessages();
    this.adminAccountService.approveClosure(id).subscribe({
      next: () => {
        this.successMessage = 'Closure approved successfully.';
        this.loadAccounts();
      },
      error: () => this.errorMessage = 'Failed to approve closure.'
    });
  }

  rejectClosure(id: number) {
    if (!confirm('Reject this closure request?')) return;
    this.clearMessages();
    this.adminAccountService.rejectClosure(id).subscribe({
      next: () => {
        this.successMessage = 'Closure request rejected.';
        this.loadAccounts();
      },
      error: () => this.errorMessage = 'Failed to reject closure.'
    });
  }

  // ========== OPENING APPROVALS ==========

  approveOpening(id: number) {
    if (!confirm('Approve this new account application?')) return;
    this.clearMessages();
    this.adminAccountService.approveOpening(id).subscribe({
      next: () => {
        this.successMessage = 'Account opening approved — customer can now use the account.';
        this.loadAccounts();
      },
      error: () => this.errorMessage = 'Failed to approve account opening.'
    });
  }

  rejectOpening(id: number) {
    const reason = prompt('Reason for rejection (shown to the customer):', 'KYC documents need re-verification');
    if (reason === null) return;
    this.clearMessages();
    this.adminAccountService.rejectOpening(id, reason).subscribe({
      next: () => {
        this.successMessage = 'Account application rejected.';
        this.loadAccounts();
      },
      error: () => this.errorMessage = 'Failed to reject account opening.'
    });
  }

  // ========== STATS CHART ==========

  loadStats() {
    this.adminService.getStats().subscribe({
      next: (res: any) => {
        this.stats = res;
        this.buildChartBars(res);
      },
      error: () => {}
    });
  }

  buildChartBars(s: any) {
    const items = [
      { label: 'Total Accounts', value: s.totalAccounts || 0, color: '#4f46e5' },
      { label: 'Active', value: s.activeAccounts || 0, color: '#2e7d32' },
      { label: 'Frozen', value: s.frozenAccounts || 0, color: '#4338ca' },
      { label: 'Closed', value: s.closedAccounts || 0, color: '#c62828' },
      { label: 'Total Users', value: s.totalUsers || 0, color: '#6a1b9a' },
      { label: 'Total Transactions', value: s.totalTransactions || 0, color: '#e65100' },
    ];
    const max = Math.max(...items.map(i => i.value), 1);
    this.statsChartBars = items.map(i => ({ ...i, percent: Math.round((i.value / max) * 100) }));
  }

  // ========== AUDIT LOGS ==========

  loadAuditLogs() {
    this.auditLoading = true;
    this.adminService.getAuditLogs(this.auditPage, this.auditSize).subscribe({
      next: (res: any) => {
        // Support both paginated { content, totalElements } and plain array
        if (Array.isArray(res)) {
          this.auditLogs = res;
          this.auditLogsTotal = res.length;
        } else {
          this.auditLogs = res.content || [];
          this.auditLogsTotal = res.totalElements || 0;
        }
        this.auditLoading = false;
      },
      error: () => {
        this.auditLogs = [];
        this.auditLoading = false;
      }
    });
  }

  onAuditFilterChange() {
    this.auditPage = 0;
    this.loadAuditLogs();
  }

  auditNextPage() {
    this.auditPage++;
    this.loadAuditLogs();
  }

  auditPrevPage() {
    if (this.auditPage > 0) {
      this.auditPage--;
      this.loadAuditLogs();
    }
  }

  get auditTotalPages(): number {
    return Math.ceil(this.auditLogsTotal / this.auditSize) || 1;
  }

  // ========== AUTH ==========

  logout() {
    sessionStorage.clear();
    this.router.navigate(['/login']);
  }
}
