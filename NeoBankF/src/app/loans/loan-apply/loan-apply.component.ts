import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { LoanService, LoanProduct } from '../../core/services/loan.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-loan-apply',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './loan-apply.component.html',
  styleUrls: ['./loan-apply.component.css']
})
export class LoanApplyComponent implements OnInit {

  step = 1;

  products: LoanProduct[] = [];
  selectedProduct: LoanProduct | null = null;
  selectedTenure: number | null = null;
  requestedAmount: number = 0;

  loading = false;
  success = '';
  error = '';

  constructor(private loanService: LoanService, private toast: ToastService, private router: Router) {}

  ngOnInit(): void {
    this.loanService.getProducts().subscribe({
      next: p => this.products = p,
      error: err => {
        this.error = 'Failed to load loan products';
        this.toast.error('Could not load loan products', this.toast.fromHttpError(err));
      }
    });
  }

  /** Quick-pick amount presets relative to product's min..max range. */
  setAmountPreset(fraction: number) {
    if (!this.selectedProduct) return;
    const range = this.selectedProduct.maxAmount - this.selectedProduct.minAmount;
    const step = this.getRangeStep();
    const raw = this.selectedProduct.minAmount + range * fraction;
    this.requestedAmount = Math.round(raw / step) * step;
  }

  selectProduct(product: LoanProduct): void {
    this.selectedProduct = product;
    const mid = product.minAmount + (product.maxAmount - product.minAmount) / 2;
    const step = this.getRangeStep();
    this.requestedAmount = Math.round(mid / step) * step;
    this.selectedTenure = product.allowedTenures[0];
    this.step = 2;
    this.toast.info('Selected ' + product.productName, 'Configure amount and tenure to see your EMI.');
  }

  nextStep(): void {
    this.error = '';
    if (!this.selectedProduct) return;
    if (this.requestedAmount < this.selectedProduct.minAmount ||
        this.requestedAmount > this.selectedProduct.maxAmount) {
      this.error = `Amount must be between ₹${this.selectedProduct.minAmount} and ₹${this.selectedProduct.maxAmount}`;
      return;
    }
    if (!this.selectedTenure) {
      this.error = 'Please select a tenure';
      return;
    }
    this.step = 3;
  }

  submit(): void {
    if (!this.selectedProduct || !this.selectedTenure) return;
    this.loading = true;
    this.error = '';
    this.loanService.applyForLoan({
      loanProductId: this.selectedProduct.id,
      requestedAmount: this.requestedAmount,
      requestedTenureMonths: this.selectedTenure
    }).subscribe({
      next: () => {
        this.success = 'Loan application submitted successfully! Status: PENDING';
        this.toast.success(
          'Application submitted',
          this.selectedProduct!.productName + ' for ₹' + this.requestedAmount.toLocaleString('en-IN') + ' — awaiting approval.'
        );
        this.loading = false;
      },
      error: err => {
        const reason = this.toast.fromHttpError(err, 'Failed to submit application');
        this.error = reason;
        this.toast.error('Application failed', reason);
        this.loading = false;
      }
    });
  }

  goBack(): void {
    if (this.step > 1) this.step--;
  }

  calculateEMI(principal: number, annualRate: number, tenure: number): string {
    if (!principal || !annualRate || !tenure) return '—';
    const r = annualRate / 1200;
    const emi = (principal * r * Math.pow(1 + r, tenure)) / (Math.pow(1 + r, tenure) - 1);
    return '₹' + emi.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  getTotalPayable(principal: number, annualRate: number, tenure: number): string {
    if (!principal || !annualRate || !tenure) return '—';
    const r = annualRate / 1200;
    const emi = (principal * r * Math.pow(1 + r, tenure)) / (Math.pow(1 + r, tenure) - 1);
    const total = emi * tenure;
    return '₹' + total.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  updateEmiPreview(): void { /* triggers change detection */ }

  getRangeStep(): number {
    if (!this.selectedProduct) return 1000;
    const range = this.selectedProduct.maxAmount - this.selectedProduct.minAmount;
    return range > 1000000 ? 50000 : range > 100000 ? 10000 : 1000;
  }
}
