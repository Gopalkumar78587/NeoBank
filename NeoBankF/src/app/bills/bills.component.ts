import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { BillService, Bill, BillAnalytics } from '../core/services/bill.service';
import { AccountService } from '../core/services/account.service';
import { OtpService } from '../core/services/otp.service';
import { ToastService } from '../core/services/toast.service';
import { Subscription } from 'rxjs';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-bills',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './bills.component.html',
  styleUrls: ['./bills.component.css']
})
export class BillsComponent implements OnInit, OnDestroy {

  bills: Bill[] = [];
  filteredBills: Bill[] = [];
  accounts: any[] = [];
  analytics: BillAnalytics | null = null;

  activeTab: 'overview' | 'bills' | 'create' | 'analytics' = 'overview';
  statusFilter = 'ALL';
  categoryFilter = 'ALL';
  searchQuery = '';
  sortBy = 'dueDate';

  billForm = {
    billerName: '',
    category: 'Utilities',
    amount: 0,
    dueDate: '',
    isRecurring: false,
    recurringFrequency: 'MONTHLY' as string,
    autoPayEnabled: false,
    accountId: null as number | null,
    description: ''
  };

  successMessage = '';
  errorMessage = '';

  private pollSub: Subscription | null = null;
  lastUpdated = new Date();
  isLive = true;

  private categoryChart: Chart | null = null;
  private monthlyChart: Chart | null = null;
  private statusChart: Chart | null = null;

  upcomingCount = 0;
  overdueCount = 0;
  paidThisMonth = 0;

  categories = ['Utilities', 'Rent', 'Insurance', 'Subscriptions', 'Loan EMI', 'Credit Card', 'Mobile', 'Internet', 'Education', 'Other'];

  sampleBills: Bill[] = [
    { id: -1, billerName: 'Electricity Board', category: 'Utilities',     amount: 1450,  dueDate: '2026-06-20', status: 'PENDING', isRecurring: true,  recurringFrequency: 'MONTHLY', autoPayEnabled: false },
    { id: -2, billerName: 'Jio Fiber',          category: 'Internet',      amount: 999,   dueDate: '2026-06-18', status: 'PENDING', isRecurring: true,  recurringFrequency: 'MONTHLY', autoPayEnabled: true  },
    { id: -3, billerName: 'LIC Premium',         category: 'Insurance',     amount: 3200,  dueDate: '2026-06-25', status: 'PENDING', isRecurring: false, autoPayEnabled: false },
    { id: -4, billerName: 'Netflix',             category: 'Subscriptions', amount: 649,   dueDate: '2026-06-22', status: 'PENDING', isRecurring: true,  recurringFrequency: 'MONTHLY', autoPayEnabled: true  },
    { id: -5, billerName: 'House Rent',          category: 'Rent',          amount: 12000, dueDate: '2026-07-01', status: 'PENDING', isRecurring: true,  recurringFrequency: 'MONTHLY', autoPayEnabled: false }
  ];

  sidebarCollapsed = false;
  userName = '';
  currentDate = new Date();
  isBrowser: boolean;

  // OTP Modal state
  otpModalOpen = false;
  otpCode = '';
  otpLoading = false;
  otpError = '';
  pendingPayBill: (Bill & { resolvedAccountId: number }) | null = null;

  constructor(
    private billService: BillService,
    private accountService: AccountService,
    private otpService: OtpService,
    private toast: ToastService,
    private router: Router,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit() {
    if (!this.isBrowser) return;
    this.userName = sessionStorage.getItem('userName') || 'Customer';
    this.loadAccounts();
    this.startRealTimePolling();
  }

  ngOnDestroy() {
    this.stopPolling();
    this.categoryChart?.destroy();
    this.monthlyChart?.destroy();
    this.statusChart?.destroy();
  }

  get userInitials(): string {
    return this.userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  startRealTimePolling() {
    this.pollSub = this.billService.getBillsRealTime().subscribe({
      next: (bills) => {
        this.bills = this.processOverdue(bills);
        this.applyFilters();
        this.computeStats();
        this.analytics = this.billService.computeAnalytics(this.bills);
        this.lastUpdated = new Date();
        if (this.activeTab === 'analytics') {
          setTimeout(() => this.renderCharts(), 200);
        }
      },
      error: () => this.errorMessage = 'Failed to load bills'
    });
  }

  stopPolling() { this.pollSub?.unsubscribe(); this.isLive = false; }

  toggleLive() {
    if (this.isLive) { this.stopPolling(); }
    else { this.isLive = true; this.startRealTimePolling(); }
  }

  processOverdue(bills: Bill[]): Bill[] {
    const now = new Date();
    return bills.map(b => {
      if (b.status === 'PENDING' && new Date(b.dueDate) < now) {
        return { ...b, status: 'OVERDUE' as const };
      }
      return b;
    });
  }

  computeStats() {
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    this.upcomingCount = this.bills.filter(b => b.status === 'PENDING' && new Date(b.dueDate) <= nextWeek).length;
    this.overdueCount = this.bills.filter(b => b.status === 'OVERDUE').length;
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    this.paidThisMonth = this.bills.filter(b => {
      if (b.status !== 'PAID') return false;
      const d = new Date(b.paidAt || b.dueDate);
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    }).reduce((s, b) => s + b.amount, 0);
  }

  applyFilters() {
    let result = [...this.bills];
    if (this.statusFilter !== 'ALL') result = result.filter(b => b.status === this.statusFilter);
    if (this.categoryFilter !== 'ALL') result = result.filter(b => b.category === this.categoryFilter);
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(b => b.billerName.toLowerCase().includes(q));
    }
    result.sort((a, b) => {
      if (this.sortBy === 'dueDate') return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      if (this.sortBy === 'amount') return b.amount - a.amount;
      if (this.sortBy === 'status') return a.status.localeCompare(b.status);
      return a.billerName.localeCompare(b.billerName);
    });
    this.filteredBills = result;
  }

  loadAccounts() {
    this.accountService.getAccounts().subscribe({
      next: (res) => this.accounts = res.filter((a: any) => a.status === 'ACTIVE' || !a.status),
      error: () => this.accounts = []
    });
  }

  createBill() {
    if (!this.billForm.billerName || this.billForm.amount <= 0 || !this.billForm.dueDate) {
      this.errorMessage = 'Please fill all required fields';
      this.toast.warning('Missing details', 'Biller name, amount and due date are required.');
      return;
    }
    this.errorMessage = '';
    const name = this.billForm.billerName;
    this.billService.createBill(this.billForm).subscribe({
      next: () => {
        this.successMessage = 'Bill created successfully!';
        this.toast.success('Bill created', name + ' has been added to your bills.');
        this.resetForm();
        this.refreshBills();
        setTimeout(() => this.successMessage = '', 4000);
      },
      error: (err) => {
        const reason = this.toast.fromHttpError(err, 'Failed to create bill');
        this.errorMessage = reason;
        this.toast.error('Could not create bill', reason);
      }
    });
  }

  resetForm() {
    this.billForm = { billerName: '', category: 'Utilities', amount: 0, dueDate: '', isRecurring: false, recurringFrequency: 'MONTHLY', autoPayEnabled: false, accountId: null, description: '' };
  }

  payBill(bill: Bill) {
    const accId = bill.accountId || (this.accounts.length > 0 ? this.accounts[0].id : null);
    if (!accId) {
      this.errorMessage = 'No account available for payment';
      this.toast.warning('No account available', 'Open or activate an account before paying bills.');
      return;
    }
    if (!confirm(`Pay â‚¹${bill.amount.toLocaleString('en-IN')} to ${bill.billerName}?`)) return;
    this.clearMessages();
    this.otpLoading = true;
    this.billService.payBill(bill.id, accId).subscribe({
      next: () => {
        this.otpLoading = false;
        this.successMessage = 'Bill payment successful for ' + bill.billerName + '!';
        this.toast.success(
          'Payment successful',
          'â‚¹' + bill.amount.toLocaleString('en-IN') + ' paid to ' + bill.billerName + '.'
        );
        this.refreshBills();
        this.loadAccounts();
        setTimeout(() => this.successMessage = '', 4000);
      },
      error: (err) => {
        this.otpLoading = false;
        const reason = this.toast.fromHttpError(err, 'Payment failed');
        this.errorMessage = reason;
        this.toast.error('Payment failed', reason);
      }
    });
  }

  confirmPayWithOtp() { /* deprecated â€” OTP removed */ }

  closeOtpModal() {
    this.otpModalOpen = false;
    this.pendingPayBill = null;
    this.otpCode = '';
    this.otpError = '';
  }

  toggleAutoPay(bill: Bill) {
    const newState = !bill.autoPayEnabled;
    this.billService.toggleAutoPay(bill.id, newState).subscribe({
      next: () => {
        bill.autoPayEnabled = newState;
        this.successMessage = 'Auto-pay ' + (newState ? 'enabled' : 'disabled');
        this.toast.info('Auto-pay ' + (newState ? 'enabled' : 'disabled'), bill.billerName);
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        this.toast.error('Auto-pay update failed', this.toast.fromHttpError(err, 'Please try again.'));
      }
    });
  }

  cancelBill(bill: Bill) {
    if (!confirm('Cancel bill for ' + bill.billerName + '?')) return;
    this.billService.cancelBill(bill.id).subscribe({
      next: () => {
        this.successMessage = 'Bill cancelled';
        this.toast.success('Bill cancelled', bill.billerName + ' has been removed from your active bills.');
        this.refreshBills();
      },
      error: (err) => {
        const reason = this.toast.fromHttpError(err, 'Failed to cancel bill');
        this.errorMessage = reason;
        this.toast.error('Could not cancel bill', reason);
      }
    });
  }

  refreshBills() {
    this.billService.getBills().subscribe({
      next: (bills) => {
        this.bills = this.processOverdue(bills);
        this.applyFilters();
        this.computeStats();
        this.analytics = this.billService.computeAnalytics(this.bills);
        this.lastUpdated = new Date();
      }
    });
  }

  switchTab(tab: typeof this.activeTab) {
    this.activeTab = tab;
    this.clearMessages();
    if (tab === 'analytics') setTimeout(() => this.renderCharts(), 300);
  }

  clearMessages() { this.successMessage = ''; this.errorMessage = ''; }

  renderCharts() {
    if (!this.analytics || !this.isBrowser) return;
    this.renderCategoryChart();
    this.renderMonthlyChart();
    this.renderStatusChart();
  }

  renderCategoryChart() {
    if (this.categoryChart) this.categoryChart.destroy();
    const canvas = document.getElementById('billCategoryChart') as HTMLCanvasElement;
    if (!canvas || !this.analytics) return;
    const data = this.analytics.categoryBreakdown;
    const colors = ['#4f46e5', '#43a047', '#fb8c00', '#e53935', '#8e24aa', '#00897b', '#f4511e', '#3949ab', '#c0ca33', '#6d4c41'];
    this.categoryChart = new Chart(canvas, {
      type: 'doughnut',
      data: { labels: data.map(d => d.category), datasets: [{ data: data.map(d => d.amount), backgroundColor: colors.slice(0, data.length), borderWidth: 2, borderColor: '#fff' }] },
      options: { responsive: true, plugins: { legend: { position: 'bottom', labels: { padding: 16, usePointStyle: true } } } }
    });
  }

  renderMonthlyChart() {
    if (this.monthlyChart) this.monthlyChart.destroy();
    const canvas = document.getElementById('billMonthlyChart') as HTMLCanvasElement;
    if (!canvas || !this.analytics) return;
    const data = this.analytics.monthlySpending;
    this.monthlyChart = new Chart(canvas, {
      type: 'bar',
      data: { labels: data.map(d => d.month), datasets: [{ label: 'Amount Paid', data: data.map(d => d.amount), backgroundColor: 'rgba(79, 70, 229,0.7)', borderRadius: 8, borderSkipped: false }] },
      options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { callback: (v) => 'Rs.' + v }, grid: { color: 'rgba(0,0,0,0.04)' } }, x: { grid: { display: false } } } }
    });
  }

  renderStatusChart() {
    if (this.statusChart) this.statusChart.destroy();
    const canvas = document.getElementById('billStatusChart') as HTMLCanvasElement;
    if (!canvas) return;
    const paid = this.bills.filter(b => b.status === 'PAID').length;
    const pending = this.bills.filter(b => b.status === 'PENDING').length;
    const overdue = this.bills.filter(b => b.status === 'OVERDUE').length;
    const scheduled = this.bills.filter(b => b.status === 'SCHEDULED').length;
    this.statusChart = new Chart(canvas, {
      type: 'pie',
      data: { labels: ['Paid', 'Pending', 'Overdue', 'Scheduled'], datasets: [{ data: [paid, pending, overdue, scheduled], backgroundColor: ['#43a047', '#fb8c00', '#e53935', '#4f46e5'], borderWidth: 2, borderColor: '#fff' }] },
      options: { responsive: true, plugins: { legend: { position: 'bottom', labels: { padding: 16, usePointStyle: true } } } }
    });
  }

  getDaysUntilDue(dueDate: string): number {
    return Math.ceil((new Date(dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  }

  getDueLabel(dueDate: string): string {
    const days = this.getDaysUntilDue(dueDate);
    if (days < 0) return Math.abs(days) + 'd overdue';
    if (days === 0) return 'Due today';
    if (days === 1) return 'Due tomorrow';
    return days + ' days left';
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = { PAID: 'status-paid', PENDING: 'status-pending', OVERDUE: 'status-overdue', SCHEDULED: 'status-scheduled', FAILED: 'status-failed', CANCELLED: 'status-cancelled' };
    return map[status] || '';
  }

  getCategoryIcon(category: string): string {
    const map: Record<string, string> = { Utilities: 'bolt', Rent: 'home', Insurance: 'shield', Subscriptions: 'subscriptions', 'Loan EMI': 'account_balance', 'Credit Card': 'credit_card', Mobile: 'phone_android', Internet: 'wifi', Education: 'school', Other: 'receipt' };
    return map[category] || 'receipt';
  }

  get totalPendingAmount(): number {
    return this.bills.filter(b => b.status === 'PENDING' || b.status === 'OVERDUE').reduce((s, b) => s + b.amount, 0);
  }

  get totalPaidAmount(): number {
    return this.bills.filter(b => b.status === 'PAID').reduce((s, b) => s + b.amount, 0);
  }

  logout() { sessionStorage.clear(); this.router.navigate(['/login']); }
}
