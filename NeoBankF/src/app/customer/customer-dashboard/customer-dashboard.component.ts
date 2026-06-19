import { Component, OnInit, PLATFORM_ID, Inject, ViewChild, ElementRef } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AccountService } from '../../core/services/account.service';
import { TransactionService } from '../../core/services/transaction.service';
import { UserService } from '../../core/services/user.service';
import { OtpService } from '../../core/services/otp.service';
import { BillService, Bill, BillAnalytics } from '../../core/services/bill.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-customer-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './customer-dashboard.component.html',
  styleUrls: ['./customer-dashboard.component.css']
})
export class CustomerDashboardComponent implements OnInit {

  userName = '';
  accounts: any[] = [];
  activeTab: 'dashboard' | 'account' | 'profile' = 'dashboard';
  sidebarCollapsed = false;
  currentDate = new Date();

  // Account form
  showAccountForm = false;
  successMessage = '';
  errorMessage = '';
  newlyCreatedAccount: any = null;

  accountForm = {
    accountType: 'SAVINGS',
    initialDeposit: 0,
    purpose: '',
    nomineeName: '',
    nomineeRelation: '',
    communicationMode: 'EMAIL',
    acceptedTerms: false
  };

  // Profile
  user: any = null;
  editMode = false;
  profileSuccess = '';
  profileError = '';
  photoUploading = false;

  @ViewChild('photoInput') photoInput?: ElementRef<HTMLInputElement>;

  get isKycComplete(): boolean { return !!(this.user && this.user.kycVerified); }
  get profilePhoto(): string | null { return this.user?.profilePhoto || null; }

  // Statement
  statementAccountId: number | null = null;
  statementMonth = new Date().getMonth() + 1;
  statementYear = new Date().getFullYear();
  statementLoading = false;

  // Chart
  balanceChart: Chart | null = null;
  chartAccountId: number | null = null;

  // OTP (for account closure)
  showOtpModal = false;
  otpCode = '';
  otpSent = false;
  otpVerified = false;
  otpError = '';
  otpLoading = false;
  otpCountdown = 0;
  otpTimer: any = null;
  pendingClosureAccountId: number | null = null;

  // Quick stats
  pendingBillsCount = 0;
  overdueBillsCount = 0;
  recentTxCount = 0;

  private isBrowser: boolean;

  constructor(
    private router: Router,
    private accountService: AccountService,
    private transactionService: TransactionService,
    private userService: UserService,
    private otpService: OtpService,
    private billService: BillService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    if (!this.isBrowser) return;
    this.userName = sessionStorage.getItem('userName') || 'Customer';
    this.loadAccounts();
    this.loadProfile();
    this.loadQuickStats();
  }

  get totalBalance(): number {
    return this.accounts.reduce((sum, a) => sum + (a.balance || 0), 0);
  }

  get activeAccounts(): number {
    return this.accounts.filter(a => a.status === 'ACTIVE' || !a.status).length;
  }

  get userInitials(): string {
    return this.userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  switchTab(tab: typeof this.activeTab) {
    this.activeTab = tab;
    this.clearMessages();
  }

  clearMessages() {
    this.successMessage = '';
    this.errorMessage = '';
    this.profileSuccess = '';
    this.profileError = '';
  }

  // --- ACCOUNTS ---
  loadAccounts() {
    this.accountService.getAccounts().subscribe({
      next: (res) => this.accounts = res,
      error: () => this.accounts = []
    });
  }

  toggleAccountForm() {
    this.showAccountForm = !this.showAccountForm;
    this.newlyCreatedAccount = null;
    this.clearMessages();
  }

  createAccount() {
    if (!this.accountForm.acceptedTerms) {
      this.errorMessage = 'Please accept terms and conditions';
      return;
    }
    if (this.accountForm.initialDeposit < 500) {
      this.errorMessage = 'Minimum initial deposit is Rs.500';
      return;
    }
    this.errorMessage = '';
    this.accountService.createAccount(this.accountForm).subscribe({
      next: (res: any) => {
        this.successMessage = 'Account created successfully!';
        this.newlyCreatedAccount = res;
        this.loadAccounts();
        this.resetForm();
      },
      error: () => this.errorMessage = 'Failed to create account.'
    });
  }

  resetForm() {
    this.accountForm = {
      accountType: 'SAVINGS', initialDeposit: 0, purpose: '',
      nomineeName: '', nomineeRelation: '', communicationMode: 'EMAIL', acceptedTerms: false
    };
  }

  // --- QUICK STATS ---
  loadQuickStats() {
    this.billService.getBills().subscribe({
      next: (bills) => {
        const now = new Date();
        this.pendingBillsCount = bills.filter(b => b.status === 'PENDING').length;
        this.overdueBillsCount = bills.filter(b =>
          b.status === 'OVERDUE' || (b.status === 'PENDING' && new Date(b.dueDate) < now)
        ).length;
      },
      error: () => {}
    });
  }

  // --- PROFILE ---
  loadProfile() {
    this.userService.getProfile().subscribe({
      next: (res) => this.user = { ...res },
      error: () => this.user = null
    });
  }

  enableEdit() { this.editMode = true; this.profileSuccess = ''; }
  cancelEdit() { this.editMode = false; this.loadProfile(); }

  saveProfile() {
    this.userService.updateProfile({ fullName: this.user.fullName }).subscribe({
      next: () => {
        this.profileSuccess = 'Profile updated successfully!';
        this.editMode = false;
        this.userName = this.user.fullName;
        if (typeof sessionStorage !== 'undefined') sessionStorage.setItem('userName', this.user.fullName);
      },
      error: () => this.profileError = 'Failed to update profile.'
    });
  }

  // --- PROFILE PHOTO ---
  triggerPhotoSelect() { this.photoInput?.nativeElement.click(); }

  onPhotoSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      this.profileError = 'Please choose an image file';
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      this.profileError = 'Image must be 2MB or smaller';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      this.photoUploading = true;
      this.profileError = '';
      this.userService.uploadPhoto(dataUrl).subscribe({
        next: () => {
          if (this.user) this.user.profilePhoto = dataUrl;
          this.photoUploading = false;
          this.profileSuccess = 'Profile photo updated!';
          setTimeout(() => this.profileSuccess = '', 3000);
        },
        error: err => {
          this.photoUploading = false;
          this.profileError = err.error?.message || err.error || 'Photo upload failed';
        }
      });
    };
    reader.readAsDataURL(file);
  }

  removePhoto() {
    if (!confirm('Remove your profile photo?')) return;
    this.userService.removePhoto().subscribe({
      next: () => {
        if (this.user) this.user.profilePhoto = null;
        this.profileSuccess = 'Photo removed';
        setTimeout(() => this.profileSuccess = '', 3000);
      },
      error: () => this.profileError = 'Failed to remove photo'
    });
  }

  // --- ACCOUNT ACTIONS ---
  freezeAccount(id: number) {
    if (!confirm('Freeze this account?')) return;
    this.accountService.freezeAccount(id).subscribe({
      next: () => { this.successMessage = 'Account frozen!'; this.loadAccounts(); },
      error: () => this.errorMessage = 'Failed to freeze account.'
    });
  }

  activateAccount(id: number) {
    this.accountService.activateAccount(id).subscribe({
      next: () => { this.successMessage = 'Account activated!'; this.loadAccounts(); },
      error: () => this.errorMessage = 'Failed to activate account.'
    });
  }

  closeAccount(id: number) {
    if (!confirm('Request closure for this account?')) return;
    this.pendingClosureAccountId = id;
    this.executeClosureRequest();
  }

  executeClosureRequest() {
    this.accountService.requestClosure(this.pendingClosureAccountId!).subscribe({
      next: () => {
        this.successMessage = 'Closure request submitted!';
        this.loadAccounts();
        this.pendingClosureAccountId = null;
      },
      error: () => {
        this.errorMessage = 'Failed to submit closure request.';
        this.pendingClosureAccountId = null;
      }
    });
  }

  // --- STATEMENT ---
  downloadStatement() {
    if (!this.statementAccountId) { this.errorMessage = 'Select an account'; return; }
    this.statementLoading = true;
    this.accountService.downloadStatement(this.statementAccountId, this.statementMonth, this.statementYear).subscribe({
      next: (blob) => {
        if (typeof window === 'undefined') return;
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'statement_' + this.statementMonth + '_' + this.statementYear + '.pdf';
        a.click();
        window.URL.revokeObjectURL(url);
        this.statementLoading = false;
      },
      error: () => { this.errorMessage = 'Failed to download statement.'; this.statementLoading = false; }
    });
  }

  // --- BALANCE CHART ---
  loadBalanceChart(accountId: number) {
    this.chartAccountId = accountId;
    this.accountService.getBalanceHistory(accountId).subscribe({
      next: (data) => {
        const labels = data.map((d: any) => d.date || d.createdAt?.substring(0, 10));
        const balances = data.map((d: any) => d.balance);
        this.renderChart(labels, balances);
      },
      error: () => this.buildChartFromTransactions(accountId)
    });
  }

  buildChartFromTransactions(accountId: number) {
    this.transactionService.getTransactions(accountId).subscribe({
      next: (txs) => {
        if (!txs.length) return;
        const sorted = [...txs].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        let running = 0;
        const labels: string[] = [];
        const balances: number[] = [];
        for (const tx of sorted) {
          running += tx.type === 'CREDIT' ? tx.amount : -tx.amount;
          labels.push(new Date(tx.createdAt).toLocaleDateString());
          balances.push(running);
        }
        this.renderChart(labels, balances);
      }
    });
  }

  renderChart(labels: string[], data: number[]) {
    if (typeof document === 'undefined') return;
    if (this.balanceChart) this.balanceChart.destroy();
    setTimeout(() => {
      const canvas = document.getElementById('balanceChart') as HTMLCanvasElement;
      if (!canvas) return;
      this.balanceChart = new Chart(canvas, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: 'Balance', data,
            borderColor: '#4f46e5', backgroundColor: 'rgba(79, 70, 229,0.08)',
            fill: true, tension: 0.4, pointRadius: 4, pointBackgroundColor: '#4f46e5', borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, ticks: { callback: (v) => 'Rs.' + v }, grid: { color: 'rgba(0,0,0,0.04)' } },
            x: { grid: { display: false } }
          }
        }
      });
    }, 150);
  }

  logout() {
    if (typeof sessionStorage !== 'undefined') sessionStorage.clear();
    this.router.navigate(['/login']);
  }

  // --- OTP FLOW (for account closure) ---
  openOtpModal() {
    this.showOtpModal = true;
    this.otpCode = '';
    this.otpSent = false;
    this.otpVerified = false;
    this.otpError = '';
    this.otpLoading = false;
    this.otpCountdown = 0;
  }

  closeOtpModal() {
    this.showOtpModal = false;
    this.otpCode = '';
    this.otpSent = false;
    this.otpVerified = false;
    this.otpError = '';
    if (this.otpTimer) { clearInterval(this.otpTimer); this.otpTimer = null; }
  }

  sendOtp() {
    this.otpLoading = true;
    this.otpError = '';
    this.otpService.sendOtp().subscribe({
      next: () => { this.otpSent = true; this.otpLoading = false; this.startOtpCountdown(); },
      error: () => { this.otpError = 'Failed to send OTP.'; this.otpLoading = false; }
    });
  }

  startOtpCountdown() {
    this.otpCountdown = 60;
    if (this.otpTimer) clearInterval(this.otpTimer);
    this.otpTimer = setInterval(() => {
      this.otpCountdown--;
      if (this.otpCountdown <= 0) { clearInterval(this.otpTimer); this.otpTimer = null; }
    }, 1000);
  }

  verifyAndExecute() {
    if (!this.otpCode || this.otpCode.length < 4) { this.otpError = 'Enter valid OTP'; return; }
    this.otpLoading = true;
    this.otpError = '';
    this.otpService.verifyOtp(this.otpCode).subscribe({
      next: () => {
        this.otpVerified = true;
        this.otpLoading = false;
        this.closeOtpModal();
        this.executeClosureRequest();
      },
      error: () => { this.otpError = 'Invalid or expired OTP.'; this.otpLoading = false; }
    });
  }
}
