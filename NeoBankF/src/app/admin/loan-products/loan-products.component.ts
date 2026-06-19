import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LoanService, LoanProduct } from '../../core/services/loan.service';

@Component({
  selector: 'app-loan-products-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './loan-products.component.html',
  styleUrls: ['./loan-products.component.css']
})
export class LoanProductsAdminComponent implements OnInit {

  products: LoanProduct[] = [];
  loading = false;
  error = '';
  success = '';
  showForm = false;
  submitting = false;

  form = {
    productName: '',
    minAmount: null as number | null,
    maxAmount: null as number | null,
    annualInterestRate: null as number | null,
    allowedTenures: ''
  };

  constructor(private loanService: LoanService) {}

  ngOnInit(): void { this.loadProducts(); }

  loadProducts(): void {
    this.loading = true;
    this.loanService.getProducts().subscribe({
      next: (p: LoanProduct[]) => { this.products = p; this.loading = false; },
      error: () => { this.error = 'Failed to load products'; this.loading = false; }
    });
  }

  toggleForm(): void {
    this.showForm = !this.showForm;
    this.error = '';
    this.success = '';
    this.resetForm();
  }

  resetForm(): void {
    this.form = { productName: '', minAmount: null, maxAmount: null, annualInterestRate: null, allowedTenures: '' };
  }

  submit(): void {
    if (!this.form.productName || !this.form.minAmount || !this.form.maxAmount ||
        !this.form.annualInterestRate || !this.form.allowedTenures) {
      this.error = 'All fields are required'; return;
    }
    if (this.form.maxAmount <= this.form.minAmount) {
      this.error = 'Max amount must be greater than min amount'; return;
    }
    this.submitting = true;
    this.loanService.createProduct(this.form as any).subscribe({
      next: () => {
        this.success = `Product "${this.form.productName}" created successfully`;
        this.showForm = false;
        this.resetForm();
        this.loadProducts();
        this.submitting = false;
      },
      error: (err: any) => {
        this.error = err?.error?.message || 'Failed to create product';
        this.submitting = false;
      }
    });
  }
}
