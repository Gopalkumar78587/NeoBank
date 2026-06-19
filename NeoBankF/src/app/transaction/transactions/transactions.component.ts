import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { TransactionService } from '../../core/services/transaction.service';
import { AccountService } from '../../core/services/account.service';
import { OtpService } from '../../core/services/otp.service';
import { ToastService } from '../../core/services/toast.service';
import { Chart, registerables } from 'chart.js';
import { Subscription, interval, startWith, switchMap } from 'rxjs';

Chart.register(...registerables);

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './transactions.component.html',
  styleUrls: ['./transactions.component.css']
})
export class TransactionsComponent implements OnInit, OnDestroy {

  // Data
  transactions: any[] = [];
  filtered: any[] = [];
  accounts: any[] = [];

  // Layout
  activeTab: 'overview' | 'transactions' | 'transfer' | 'analytics' = 'overview';
  sidebarCollapsed = false;
  userName = '';
  isBrowser: boolean;

  // Filters
  filter = 'ALL';
  accountId: number | null = null;
  dateFrom = '';
  dateTo = '';
  searchQuery = '';
  minAmount: number | null = null;
  maxAmount: number | null = null;

  // Analytics
  totalCredits = 0;
  totalDebits = 0;
  netFlow = 0;
  avgTransaction = 0;
  txCount = 0;
  creditCount = 0;
  debitCount = 0;
  largestCredit = 0;
  largestDebit = 0;

  // New Transaction
  txType = 'CREDIT';
  txAmount = 0;
  txDescription = '';
  txLoading = false;

  // Transfer
  transferFrom: number | null = null;
  transferTo = '';
  transferAmount = 0;
  transferNote = '';
  transferLoading = false;

  // Messages
  successMessage = '';
  errorMessage = '';

  // OTP
  showOtpModal = false;
  otpCode = '';
  otpSent = false;
  otpVerified = false;
  otpError = '';
  otpLoading = false;
  otpCountdown = 0;
  otpTimer: any = null;
  otpPurpose: 'transaction' | 'transfer' = 'transaction';

  // Charts
  private typeChart: Chart | null = null;
  private trendChart: Chart | null = null;
  private dailyChart: Chart | null = null;

  // Real-time
  private pollSub: Subscription | null = null;
  isLive = true;
  lastUpdated = new Date();

  constructor(
    private txService: TransactionService,
    private accountService: AccountService,
    private otpService: OtpService,
    private toast: ToastService,
    private router: Router,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    if (!this.isBrowser) return;
    this.userName = sessionStorage.getItem('userName') || 'Customer';
    this.loadAccounts();
  }

  ngOnDestroy() {
    this.pollSub?.unsubscribe();
    this.typeChart?.destroy();
    this.trendChart?.destroy();
    this.dailyChart?.destroy();
    if (this.otpTimer) clearInterval(this.otpTimer);
  }

  get userInitials(): string {
    return this.userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  // ---- DATA ----
  loadAccounts() {
    this.accountService.getAccounts().subscribe({
      next: (res) => {
        this.accounts = res;
        if (this.accounts.length > 0 && !this.accountId) {
          this.accountId = this.accounts[0].id;
          this.transferFrom = this.accounts[0].id;
          this.startPolling();
        }
      },
      error: () => this.accounts = []
    });
  }

  startPolling() {
    this.pollSub?.unsubscribe();
    if (!this.accountId) return;
    this.isLive = true;
    this.pollSub = interval(10000).pipe(
      startWith(0),
      switchMap(() => this.txService.getTransactions(this.accountId!))
    ).subscribe({
      next: (res) => {
        this.transactions = res;
        this.applyFilter();
        this.computeAnalytics();
        this.lastUpdated = new Date();
        if (this.activeTab === 'analytics') setTimeout(() => this.renderCharts(), 200);
      },
      error: () => this.transactions = []
    });
  }

  onAccountChange() { this.startPolling(); }

  toggleLive() {
    if (this.isLive) { this.pollSub?.unsubscribe(); this.isLive = false; }
    else { this.startPolling(); }
  }

  // ---- FILTERS ----
  applyFilter() {
    let result = [...this.transactions];
    if (this.filter !== 'ALL') result = result.filter(t => t.type === this.filter);
    if (this.dateFrom) result = result.filter(t => new Date(t.createdAt) >= new Date(this.dateFrom));
    if (this.dateTo) { const end = new Date(this.dateTo); end.setHours(23,59,59); result = result.filter(t => new Date(t.createdAt) <= end); }
    if (this.searchQuery.trim()) { const q = this.searchQuery.toLowerCase(); result = result.filter(t => (t.description || '').toLowerCase().includes(q)); }
    if (this.minAmount != null && this.minAmount > 0) result = result.filter(t => t.amount >= this.minAmount!);
    if (this.maxAmount != null && this.maxAmount > 0) result = result.filter(t => t.amount <= this.maxAmount!);
    this.filtered = result;
  }

  clearFilters() {
    this.filter = 'ALL'; this.dateFrom = ''; this.dateTo = ''; this.searchQuery = ''; this.minAmount = null; this.maxAmount = null;
    this.applyFilter();
  }

  // ---- ANALYTICS ----
  computeAnalytics() {
    this.totalCredits = this.filtered.filter(t => t.type === 'CREDIT').reduce((s, t) => s + t.amount, 0);
    this.totalDebits = this.filtered.filter(t => t.type === 'DEBIT').reduce((s, t) => s + t.amount, 0);
    this.netFlow = this.totalCredits - this.totalDebits;
    this.txCount = this.filtered.length;
    this.avgTransaction = this.txCount > 0 ? (this.totalCredits + this.totalDebits) / this.txCount : 0;
    this.creditCount = this.filtered.filter(t => t.type === 'CREDIT').length;
    this.debitCount = this.filtered.filter(t => t.type === 'DEBIT').length;
    const credits = this.filtered.filter(t => t.type === 'CREDIT');
    const debits = this.filtered.filter(t => t.type === 'DEBIT');
    this.largestCredit = credits.length > 0 ? Math.max(...credits.map(t => t.amount)) : 0;
    this.largestDebit = debits.length > 0 ? Math.max(...debits.map(t => t.amount)) : 0;
  }

  // ---- NEW TRANSACTION ----
  performTransaction() {
    if (!this.accountId) { this.errorMessage = 'Select an account'; return; }
    if (this.txAmount <= 0) { this.errorMessage = 'Enter valid amount'; return; }
    this.errorMessage = '';
    this.executeTransaction();
  }

  executeTransaction() {
    this.txLoading = true;
    const isDeposit = this.txType === 'CREDIT';
    const amt = this.txAmount;
    this.txService.createTransaction(
      this.accountId!, this.txType, amt, this.txDescription
    ).subscribe({
      next: () => {
        this.successMessage = (isDeposit ? 'Deposit' : 'Withdrawal') + ' of Rs.' + amt + ' successful!';
        this.toast.success(
          (isDeposit ? 'Deposit' : 'Withdrawal') + ' successful',
          'Rs.' + amt.toLocaleString('en-IN') + ' processed.'
        );
        this.txAmount = 0; this.txDescription = ''; this.txLoading = false;
        this.refreshData();
        setTimeout(() => this.successMessage = '', 5000);
      },
      error: (err) => {
        const reason = this.toast.fromHttpError(err, 'Transaction failed.');
        this.errorMessage = reason;
        this.toast.error(
          (isDeposit ? 'Deposit' : 'Withdrawal') + ' failed',
          reason
        );
        this.txLoading = false;
      }
    });
  }

  // ---- TRANSFER ----
  performTransfer() {
    if (!this.transferFrom) { this.errorMessage = 'Select source account'; return; }
    if (!this.transferTo) { this.errorMessage = 'Enter destination account number'; return; }
    if (this.transferAmount <= 0) { this.errorMessage = 'Enter valid amount'; return; }
    this.errorMessage = '';
    this.executeTransfer();
  }

  executeTransfer() {
    this.transferLoading = true;
    const amt = this.transferAmount;
    const dest = this.transferTo.trim();
    this.txService.transfer(
      this.transferFrom!, dest, amt, this.transferNote
    ).subscribe({
      next: () => {
        this.successMessage = 'Rs.' + amt + ' transferred to ' + dest + ' successfully!';
        this.toast.success(
          'Transfer successful',
          'Rs.' + amt.toLocaleString('en-IN') + ' sent to ' + dest + '.'
        );
        this.transferAmount = 0; this.transferTo = ''; this.transferNote = ''; this.transferLoading = false;
        this.refreshData();
        setTimeout(() => this.successMessage = '', 5000);
      },
      error: (err) => {
        const reason = this.toast.fromHttpError(err, 'Transfer failed.');
        this.errorMessage = reason;
        this.toast.error('Transfer failed', reason);
        this.transferLoading = false;
      }
    });
  }

  refreshData() {
    if (!this.accountId) return;
    this.txService.getTransactions(this.accountId).subscribe({
      next: (res) => {
        this.transactions = res;
        this.applyFilter();
        this.computeAnalytics();
        this.lastUpdated = new Date();
      }
    });
    this.loadAccounts();
  }

  // ---- OTP ----
  openOtpModal() { this.showOtpModal = true; this.otpCode = ''; this.otpSent = false; this.otpVerified = false; this.otpError = ''; this.otpLoading = false; this.otpCountdown = 0; }
  closeOtpModal() { this.showOtpModal = false; this.otpCode = ''; this.otpSent = false; this.otpVerified = false; this.otpError = ''; if (this.otpTimer) { clearInterval(this.otpTimer); this.otpTimer = null; } }

  sendOtp() {
    this.otpLoading = true; this.otpError = '';
    this.otpService.sendOtp().subscribe({
      next: () => { this.otpSent = true; this.otpLoading = false; this.startOtpCountdown(); },
      error: () => { this.otpError = 'Failed to send OTP.'; this.otpLoading = false; }
    });
  }

  startOtpCountdown() {
    this.otpCountdown = 60;
    if (this.otpTimer) clearInterval(this.otpTimer);
    this.otpTimer = setInterval(() => { this.otpCountdown--; if (this.otpCountdown <= 0) { clearInterval(this.otpTimer); this.otpTimer = null; } }, 1000);
  }

  verifyAndExecute() {
    if (!this.otpCode || this.otpCode.length < 4) { this.otpError = 'Enter valid OTP'; return; }
    this.otpLoading = true; this.otpError = '';
    this.otpService.verifyOtp(this.otpCode).subscribe({
      next: () => {
        this.otpVerified = true; this.otpLoading = false; this.closeOtpModal();
        if (this.otpPurpose === 'transaction') this.executeTransaction();
        else this.executeTransfer();
      },
      error: () => { this.otpError = 'Invalid or expired OTP.'; this.otpLoading = false; }
    });
  }

  // ---- TABS ----
  switchTab(tab: typeof this.activeTab) {
    this.activeTab = tab;
    this.clearMessages();
    if (tab === 'analytics') setTimeout(() => this.renderCharts(), 300);
  }

  clearMessages() { this.successMessage = ''; this.errorMessage = ''; }

  // ---- CHARTS ----
  renderCharts() {
    if (!this.isBrowser) return;
    this.renderTypeChart();
    this.renderTrendChart();
    this.renderDailyChart();
  }

  renderTypeChart() {
    if (this.typeChart) this.typeChart.destroy();
    const canvas = document.getElementById('txTypeChart') as HTMLCanvasElement;
    if (!canvas) return;
    this.typeChart = new Chart(canvas, {
      type: 'doughnut',
      data: { labels: ['Credits', 'Debits'], datasets: [{ data: [this.totalCredits, this.totalDebits], backgroundColor: ['#43a047', '#e53935'], borderWidth: 2, borderColor: '#fff' }] },
      options: { responsive: true, plugins: { legend: { position: 'bottom', labels: { padding: 16, usePointStyle: true } } } }
    });
  }

  renderTrendChart() {
    if (this.trendChart) this.trendChart.destroy();
    const canvas = document.getElementById('txTrendChart') as HTMLCanvasElement;
    if (!canvas) return;
    const sorted = [...this.filtered].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    let running = 0;
    const labels: string[] = []; const data: number[] = [];
    for (const tx of sorted) { running += tx.type === 'CREDIT' ? tx.amount : -tx.amount; labels.push(new Date(tx.createdAt).toLocaleDateString()); data.push(running); }
    this.trendChart = new Chart(canvas, {
      type: 'line',
      data: { labels, datasets: [{ label: 'Balance Flow', data, borderColor: '#4f46e5', backgroundColor: 'rgba(79, 70, 229,0.08)', fill: true, tension: 0.4, pointRadius: 3, borderWidth: 2 }] },
      options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { ticks: { callback: (v) => 'Rs.' + v }, grid: { color: 'rgba(0,0,0,0.04)' } }, x: { grid: { display: false } } } }
    });
  }

  renderDailyChart() {
    if (this.dailyChart) this.dailyChart.destroy();
    const canvas = document.getElementById('txDailyChart') as HTMLCanvasElement;
    if (!canvas) return;
    const dayMap = new Map<string, { credit: number; debit: number }>();
    this.filtered.forEach(tx => { const day = new Date(tx.createdAt).toLocaleDateString(); const e = dayMap.get(day) || { credit: 0, debit: 0 }; tx.type === 'CREDIT' ? e.credit += tx.amount : e.debit += tx.amount; dayMap.set(day, e); });
    const days = Array.from(dayMap.entries()).sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime());
    this.dailyChart = new Chart(canvas, {
      type: 'bar',
      data: { labels: days.map(d => d[0]), datasets: [
        { label: 'Credits', data: days.map(d => d[1].credit), backgroundColor: 'rgba(67,160,71,0.7)', borderRadius: 6, borderSkipped: false },
        { label: 'Debits', data: days.map(d => d[1].debit), backgroundColor: 'rgba(229,57,53,0.7)', borderRadius: 6, borderSkipped: false }
      ] },
      options: { responsive: true, plugins: { legend: { position: 'top' } }, scales: { y: { beginAtZero: true, ticks: { callback: (v) => 'Rs.' + v } }, x: { grid: { display: false } } } }
    });
  }

  getStatusIcon(type: string): string { return type === 'CREDIT' ? 'south_west' : 'north_east'; }

  getSelectedAccount(): any {
    return this.accounts.find(a => a.id === this.accountId) || null;
  }

  logout() { sessionStorage.clear(); this.router.navigate(['/login']); }
}
