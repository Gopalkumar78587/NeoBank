import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth';
import { SessionService } from '../../core/services/session.service';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  loginForm!: FormGroup;
  errorMessage = '';
  loading = false;
  selectedRole: 'customer' | 'admin' = 'customer';
  showPassword = false;

  // CAPTCHA — alphanumeric, must contain both letters and digits
  captchaCode = '';
  captchaInput = '';
  captchaError = false;

  // Forgot password
  showForgotPassword = false;
  forgotEmail = '';
  forgotSent = false;
  forgotError = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private session: SessionService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.refreshCaptcha();
  }

  refreshCaptcha() {
    // 6 chars guaranteed to contain >=2 letters and >=2 digits, no ambiguous (0/O/1/I/l)
    const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const digits = '23456789';
    const chars: string[] = [];
    for (let i = 0; i < 3; i++) chars.push(letters.charAt(Math.floor(Math.random() * letters.length)));
    for (let i = 0; i < 3; i++) chars.push(digits.charAt(Math.floor(Math.random() * digits.length)));
    // Shuffle
    for (let i = chars.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [chars[i], chars[j]] = [chars[j], chars[i]];
    }
    this.captchaCode = chars.join('');
    this.captchaInput = '';
    this.captchaError = false;
  }

  get captchaValid(): boolean {
    const input = (this.captchaInput || '').trim();
    if (!input) return false;
    const hasLetter = /[A-Za-z]/.test(input);
    const hasDigit = /[0-9]/.test(input);
    return input.toUpperCase() === this.captchaCode.toUpperCase() && hasLetter && hasDigit;
  }

  selectRole(role: 'customer' | 'admin') {
    this.selectedRole = role;
    this.errorMessage = '';
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  openForgotPassword() {
    this.showForgotPassword = true;
    this.forgotEmail = '';
    this.forgotSent = false;
    this.forgotError = '';
  }

  closeForgotPassword() {
    this.showForgotPassword = false;
  }

  sendForgotPassword() {
    if (!this.forgotEmail || !this.forgotEmail.includes('@')) {
      this.forgotError = 'Please enter a valid email address.';
      return;
    }
    // Frontend only — show success message
    this.forgotSent = true;
    this.forgotError = '';
  }

  login() {
    if (this.loginForm.invalid) return;

    if (!this.captchaValid) {
      this.captchaError = true;
      this.refreshCaptcha();
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const loginRequest = {
      email: this.loginForm.value.email!,
      password: this.loginForm.value.password!
    };

    this.authService.login(loginRequest).subscribe({
      next: (res: any) => {
        const role = (res.role || this.selectedRole).toUpperCase();
        const expected = this.selectedRole.toUpperCase();

        if (role !== expected) {
          this.errorMessage = `This account is registered as ${role}. Please switch role above.`;
          this.loading = false;
          return;
        }

        this.session.setSession(
          res.token,
          res.fullName || 'User',
          role,
          res.email || loginRequest.email
        );

        this.router.navigate([role === 'ADMIN' ? '/admin/dashboard' : '/customer/dashboard']);
      },
      error: (err: any) => {
        this.errorMessage = err.error?.message || err.error || 'Invalid email or password';
        this.loading = false;
        this.refreshCaptcha();
      }
    });
  }
}
