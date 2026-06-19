import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AccountService } from '../../core/services/account.service';
import { UserService, ProfileData } from '../../core/services/user.service';

@Component({
  selector: 'app-accounts',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './accounts.component.html',
  styleUrls: ['./accounts.component.css']
})
export class AccountsComponent implements OnInit {

  accounts: any[] = [];
  profile: ProfileData = {};
  successMessage = '';
  errorMessage = '';
  loading = false;
  showOpenForm = false;
  currentStep = 1;

  accountForm = {
    accountType: 'SAVINGS' as 'SAVINGS' | 'CURRENT',
    initialDeposit: 1000,
    purpose: '',
    occupation: '',
    employmentStatus: 'SALARIED' as 'SALARIED' | 'SELF_EMPLOYED' | 'STUDENT' | 'RETIRED' | 'OTHER',
    branchPreference: '',
    nomineeName: '',
    nomineeRelation: '',
    nomineeDob: '',
    communicationMode: 'EMAIL' as 'EMAIL' | 'SMS' | 'BOTH',
    debitCardRequired: true,
    chequeBookRequired: false,
    netBankingRequired: true,
    acceptedTerms: false
  };

  constructor(
    private accountService: AccountService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.loadAccounts();
    this.loadProfile();
  }

  loadAccounts() {
    this.accountService.getAccounts().subscribe(res => this.accounts = res || []);
  }

  loadProfile() {
    this.userService.getProfile().subscribe(res => this.profile = res || {});
  }

  get isKycComplete(): boolean { return !!this.profile.kycVerified; }

  get minDeposit(): number { return this.accountForm.accountType === 'CURRENT' ? 5000 : 1000; }

  openCreateForm() {
    if (!this.isKycComplete) return;
    this.showOpenForm = true;
    this.currentStep = 1;
    this.accountForm = {
      accountType: 'SAVINGS',
      initialDeposit: this.minDeposit,
      purpose: '',
      occupation: '',
      employmentStatus: 'SALARIED',
      branchPreference: '',
      nomineeName: '',
      nomineeRelation: '',
      nomineeDob: '',
      communicationMode: 'EMAIL',
      debitCardRequired: true,
      chequeBookRequired: false,
      netBankingRequired: true,
      acceptedTerms: false
    };
    this.errorMessage = '';
  }

  closeCreateForm() { this.showOpenForm = false; }

  nextStep() {
    if (this.currentStep === 1) {
      if (!this.accountForm.accountType) return;
      if (!this.accountForm.initialDeposit || this.accountForm.initialDeposit < this.minDeposit) {
        this.errorMessage = `Minimum initial deposit for ${this.accountForm.accountType} is ₹${this.minDeposit}`;
        return;
      }
      if (!this.accountForm.purpose) {
        this.errorMessage = 'Please select the purpose of the account';
        return;
      }
      this.errorMessage = '';
    }
    if (this.currentStep === 2) {
      if (!this.accountForm.occupation || !this.accountForm.employmentStatus) {
        this.errorMessage = 'Occupation and employment status are required';
        return;
      }
      this.errorMessage = '';
    }
    if (this.currentStep === 3) {
      if (!this.accountForm.nomineeName || !this.accountForm.nomineeRelation) {
        this.errorMessage = 'Nominee name and relationship are required';
        return;
      }
      this.errorMessage = '';
    }
    if (this.currentStep < 4) this.currentStep++;
  }

  prevStep() { if (this.currentStep > 1) this.currentStep--; }

  onTypeChange() {
    if (this.accountForm.initialDeposit < this.minDeposit) {
      this.accountForm.initialDeposit = this.minDeposit;
    }
  }

  createAccount() {
    if (!this.accountForm.acceptedTerms) {
      this.errorMessage = 'Please accept the Terms & Conditions';
      return;
    }
    this.loading = true;
    this.errorMessage = '';
    this.accountService.createAccount(this.accountForm).subscribe({
      next: () => {
        this.loading = false;
        this.successMessage = '✅ Application submitted! Your account is awaiting admin approval.';
        this.showOpenForm = false;
        this.loadAccounts();
        setTimeout(() => this.successMessage = '', 6000);
      },
      error: err => {
        this.loading = false;
        this.errorMessage = err.error?.message || err.error || 'Failed to open account';
      }
    });
  }

  formatINR(v?: number | string | null): string {
    if (v === null || v === undefined || v === '') return '—';
    const n = typeof v === 'number' ? v : Number(v);
    if (isNaN(n)) return '—';
    return '₹ ' + n.toLocaleString('en-IN', { maximumFractionDigits: 2 });
  }

  badgeFor(status: string): string {
    if (status === 'ACTIVE') return 'badge-success';
    if (status === 'FROZEN') return 'badge-warning';
    if (status === 'PENDING_APPROVAL') return 'badge-info';
    if (status === 'REJECTED') return 'badge-error';
    return 'badge-error';
  }

  statusLabel(status: string): string {
    if (status === 'PENDING_APPROVAL') return 'PENDING APPROVAL';
    return status || '';
  }

  totalBalance(): number {
    return this.accounts
      .filter(a => a.status === 'ACTIVE')
      .reduce((s, a) => s + Number(a.balance || 0), 0);
  }

  activeCount(): number {
    return this.accounts.filter(a => a.status === 'ACTIVE').length;
  }

  pendingCount(): number {
    return this.accounts.filter(a => a.status === 'PENDING_APPROVAL').length;
  }
}
