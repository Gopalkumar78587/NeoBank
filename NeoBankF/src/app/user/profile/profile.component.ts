import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { UserService, ProfileData } from '../../core/services/user.service';
import { AccountService } from '../../core/services/account.service';

type Tab = 'overview' | 'personal' | 'kyc' | 'address' | 'security';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {

  @ViewChild('photoInput') photoInput?: ElementRef<HTMLInputElement>;

  user: ProfileData = {};
  draft: ProfileData = {};
  accounts: any[] = [];
  loading = false;
  editMode = false;
  uploading = false;
  successMessage = '';
  errorMessage = '';
  activeTab: Tab = 'overview';

  // Change password
  pwd = { current: '', next: '', confirm: '' };
  pwdLoading = false;
  pwdMessage = '';
  pwdError = '';
  showCurrent = false;
  showNext = false;
  showConfirm = false;

  constructor(
    private userService: UserService,
    private accountService: AccountService
  ) {}

  ngOnInit(): void {
    this.loadProfile();
    this.loadAccounts();
  }

  loadProfile() {
    this.loading = true;
    this.userService.getProfile().subscribe({
      next: res => {
        this.user = res || {};
        this.draft = { ...this.user };
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  loadAccounts() {
    this.accountService.getAccounts().subscribe(res => this.accounts = res || []);
  }

  setTab(t: Tab) { this.activeTab = t; this.cancelEdit(); }

  enableEdit() {
    this.draft = { ...this.user };
    this.editMode = true;
    this.successMessage = '';
    this.errorMessage = '';
  }

  cancelEdit() {
    this.editMode = false;
    this.draft = { ...this.user };
    this.errorMessage = '';
  }

  saveProfile() {
    this.errorMessage = '';
    this.successMessage = '';

    // Strip masked aadhaar before sending
    const payload: any = { ...this.draft };
    if (payload.aadhaar && payload.aadhaar.startsWith('XXXX')) {
      delete payload.aadhaar;
    }
    if (payload.pan) payload.pan = String(payload.pan).toUpperCase();

    this.userService.updateProfile(payload).subscribe({
      next: res => {
        this.user = res;
        this.draft = { ...res };
        this.editMode = false;
        this.successMessage = '✅ Profile updated successfully';
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: err => {
        this.errorMessage = err.error?.message || err.error || 'Failed to update profile';
      }
    });
  }

  // ─── Photo upload ───
  triggerPhotoSelect() { this.photoInput?.nativeElement.click(); }

  onPhotoSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      this.errorMessage = 'Please choose an image file';
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      this.errorMessage = 'Image must be 2MB or smaller';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      this.uploadPhoto(dataUrl);
    };
    reader.readAsDataURL(file);
  }

  private uploadPhoto(dataUrl: string) {
    this.uploading = true;
    this.errorMessage = '';
    this.userService.uploadPhoto(dataUrl).subscribe({
      next: () => {
        this.user.profilePhoto = dataUrl;
        this.uploading = false;
        this.successMessage = '✅ Profile photo updated';
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: err => {
        this.uploading = false;
        this.errorMessage = err.error?.message || err.error || 'Photo upload failed';
      }
    });
  }

  removePhoto() {
    if (!confirm('Remove your profile photo?')) return;
    this.userService.removePhoto().subscribe({
      next: () => {
        this.user.profilePhoto = null;
        this.successMessage = '✅ Photo removed';
        setTimeout(() => this.successMessage = '', 3000);
      }
    });
  }

  // ─── Change password ───
  changePassword() {
    this.pwdError = '';
    this.pwdMessage = '';
    if (!this.pwd.current || !this.pwd.next || !this.pwd.confirm) {
      this.pwdError = 'All fields are required';
      return;
    }
    if (this.pwd.next !== this.pwd.confirm) {
      this.pwdError = 'New passwords do not match';
      return;
    }
    if (!/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/.test(this.pwd.next)) {
      this.pwdError = 'Password must be 8+ chars with uppercase, lowercase, number & special character';
      return;
    }
    this.pwdLoading = true;
    this.userService.changePassword(this.pwd.current, this.pwd.next).subscribe({
      next: () => {
        this.pwdLoading = false;
        this.pwdMessage = '✅ Password changed successfully';
        this.pwd = { current: '', next: '', confirm: '' };
        setTimeout(() => this.pwdMessage = '', 4000);
      },
      error: err => {
        this.pwdLoading = false;
        this.pwdError = err.error?.message || err.error || 'Password change failed';
      }
    });
  }

  get newPwdStrength(): number {
    const p = this.pwd.next || '';
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  }
  get pwdStrengthColor(): string {
    return ['#e5e7eb', '#ef4444', '#f59e0b', '#22c55e', '#16a34a'][this.newPwdStrength] || '#e5e7eb';
  }
  get pwdStrengthLabel(): string {
    return ['', 'Weak', 'Fair', 'Good', 'Strong'][this.newPwdStrength] || '';
  }

  // ─── Helpers ───
  initials(): string {
    const n = (this.user.fullName || this.user.email || '?').trim();
    const parts = n.split(/\s+/);
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : (n[0] || '?').toUpperCase();
  }

  formatINR(v?: number | string | null): string {
    if (v === null || v === undefined || v === '') return '—';
    const n = typeof v === 'number' ? v : Number(v);
    if (isNaN(n)) return '—';
    return '₹ ' + n.toLocaleString('en-IN', { maximumFractionDigits: 2 });
  }

  kycPercent(): number {
    const fields: Array<keyof ProfileData> = [
      'phone', 'dateOfBirth', 'gender', 'aadhaar', 'pan',
      'addressLine', 'city', 'state', 'pincode', 'occupation', 'annualIncome'
    ];
    const filled = fields.filter(k => {
      const v = (this.user as any)[k];
      return v !== null && v !== undefined && v !== '';
    }).length;
    return Math.round((filled / fields.length) * 100);
  }
}
