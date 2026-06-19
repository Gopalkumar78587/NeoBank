import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {

  registerForm: FormGroup;
  successMessage = '';
  errorMessage = '';
  loading = false;
  showPassword = false;
  showConfirm = false;
  currentStep = 1;
  totalSteps = 4;

  // CAPTCHA
  captchaA = 0;
  captchaB = 0;
  captchaInput = '';
  captchaError = false;

  // Max DOB = 18 years ago (today). Min = 100 years ago.
  readonly maxDob = this.subYears(18);
  readonly minDob = this.subYears(100);

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group(
      {
        // Step 1 — Identity
        fullName: ['', [Validators.required, Validators.minLength(2)]],
        email: ['', [Validators.required, Validators.email]],
        phone: ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],

        // Step 2 — KYC
        dateOfBirth: ['', [Validators.required]],
        gender: ['', [Validators.required]],
        aadhaar: ['', [Validators.required, Validators.pattern(/^\d{12}$/)]],
        pan: ['', [Validators.required, Validators.pattern(/^[A-Z]{5}\d{4}[A-Z]$/)]],
        occupation: ['', [Validators.required]],
        annualIncome: [null, [Validators.required, Validators.min(0)]],

        // Step 3 — Address
        addressLine: ['', [Validators.required]],
        city: ['', [Validators.required]],
        state: ['', [Validators.required]],
        pincode: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
        country: ['India', [Validators.required]],

        // Step 4 — Security
        password: ['', [
          Validators.required,
          Validators.minLength(8),
          Validators.pattern('^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)(?=.*[@$!%*?&]).{8,}$')
        ]],
        confirmPassword: ['', Validators.required],
        acceptTerms: [false, Validators.requiredTrue]
      },
      { validators: this.passwordMatch }
    );
  }

  passwordMatch(form: FormGroup) {
    const p = form.get('password')?.value;
    const c = form.get('confirmPassword')?.value;
    return p === c ? null : { passwordMismatch: true };
  }

  /** Auto-derive DOB from Aadhaar is not feasible — but we can auto-uppercase PAN. */
  onPanInput(event: any) {
    const v = (event.target.value || '').toUpperCase();
    this.registerForm.get('pan')?.setValue(v, { emitEvent: false });
  }

  /** Mask aadhaar to digits only, max 12. */
  onAadhaarInput(event: any) {
    const v = (event.target.value || '').replace(/\D/g, '').slice(0, 12);
    this.registerForm.get('aadhaar')?.setValue(v, { emitEvent: false });
  }

  isStep1Valid(): boolean {
    return ['fullName', 'email', 'phone'].every(k => this.registerForm.get(k)?.valid);
  }
  isStep2Valid(): boolean {
    return ['dateOfBirth', 'gender', 'aadhaar', 'pan', 'occupation', 'annualIncome']
      .every(k => this.registerForm.get(k)?.valid);
  }
  isStep3Valid(): boolean {
    return ['addressLine', 'city', 'state', 'pincode', 'country']
      .every(k => this.registerForm.get(k)?.valid);
  }

  nextStep() {
    if (this.currentStep === 1 && !this.isStep1Valid()) { this.markTouched(['fullName','email','phone']); return; }
    if (this.currentStep === 2 && !this.isStep2Valid()) { this.markTouched(['dateOfBirth','gender','aadhaar','pan','occupation','annualIncome']); return; }
    if (this.currentStep === 3 && !this.isStep3Valid()) { this.markTouched(['addressLine','city','state','pincode','country']); return; }
    if (this.currentStep < this.totalSteps) {
      if (this.currentStep === 3) this.refreshCaptcha();
      this.currentStep++;
    }
  }

  prevStep() { if (this.currentStep > 1) this.currentStep--; }

  private markTouched(keys: string[]) {
    keys.forEach(k => this.registerForm.get(k)?.markAsTouched());
  }

  refreshCaptcha() {
    this.captchaA = Math.floor(Math.random() * 9) + 1;
    this.captchaB = Math.floor(Math.random() * 9) + 1;
    this.captchaInput = '';
    this.captchaError = false;
  }

  get captchaValid(): boolean {
    return parseInt(this.captchaInput, 10) === this.captchaA + this.captchaB;
  }

  get passwordStrength(): number {
    const p = this.registerForm.get('password')?.value || '';
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  }
  get strengthLabel(): string {
    return ['', 'Weak', 'Fair', 'Good', 'Strong'][this.passwordStrength] || '';
  }
  get strengthColor(): string {
    return ['', '#ef4444', '#f59e0b', '#22c55e', '#16a34a'][this.passwordStrength] || '';
  }

  onSubmit() {
    if (this.registerForm.invalid) {
      Object.values(this.registerForm.controls).forEach(c => c.markAsTouched());
      return;
    }
    if (!this.captchaValid) { this.captchaError = true; this.refreshCaptcha(); return; }

    this.loading = true;
    this.successMessage = '';
    this.errorMessage = '';

    const f = this.registerForm.value;
    const payload = {
      fullName: f.fullName,
      email: f.email,
      password: f.password,
      phone: f.phone,
      dateOfBirth: f.dateOfBirth,
      gender: f.gender,
      aadhaar: f.aadhaar,
      pan: f.pan,
      addressLine: f.addressLine,
      city: f.city,
      state: f.state,
      pincode: f.pincode,
      country: f.country,
      occupation: f.occupation,
      annualIncome: Number(f.annualIncome) || 0
    };

    this.authService.register(payload).subscribe({
      next: () => {
        this.successMessage = 'Account created successfully! Redirecting to login...';
        this.loading = false;
        setTimeout(() => this.router.navigate(['/login']), 1800);
      },
      error: err => {
        this.errorMessage = err.error?.message || err.error || 'Registration failed. Please try again.';
        this.loading = false;
      }
    });
  }

  private subYears(n: number): string {
    const d = new Date();
    d.setFullYear(d.getFullYear() - n);
    return d.toISOString().split('T')[0];
  }
}

