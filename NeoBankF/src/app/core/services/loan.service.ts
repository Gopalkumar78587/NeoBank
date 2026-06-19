import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API } from '../config/api.config';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface LoanProduct {
  id: number;
  productName: string;
  minAmount: number;
  maxAmount: number;
  annualInterestRate: number;
  allowedTenures: number[];
  createdAt: string;
}

export interface LoanApplicationRequest {
  loanProductId: number;
  requestedAmount: number;
  requestedTenureMonths: number;
}

export interface LoanApplication {
  id: number;
  loanProductId: number;
  productName: string;
  requestedAmount: number;
  requestedTenureMonths: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  adminRemarks: string | null;
  appliedAt: string;
  decidedAt: string | null;
  applicantName: string;
  applicantEmail: string;
}

export interface LoanDecisionRequest {
  decision: 'APPROVED' | 'REJECTED';
  adminRemarks?: string;
}

export interface LoanAccount {
  id: number;
  loanApplicationId: number;
  productName: string;
  principalAmount: number;
  annualInterestRate: number;
  tenureMonths: number;
  emiAmount: number;
  disbursedAt: string;
}

export interface RepaymentInstalment {
  id: number;
  instalmentNumber: number;
  dueDate: string;
  emiAmount: number;
  principalComponent: number;
  interestComponent: number;
  paymentStatus: 'PENDING' | 'PAID' | 'OVERDUE';
  paidAt: string | null;
}

@Injectable({ providedIn: 'root' })
export class LoanService {

  private http = inject(HttpClient);

  // ─── Products ────────────────────────────────────────────────

  getProducts(): Observable<LoanProduct[]> {
    return this.http.get<any[]>(API.loans.products).pipe(
      map(list => list.map(p => this.normalizeProduct(p)))
    );
  }

  getProductById(id: number): Observable<LoanProduct> {
    return this.http.get<any>(`${API.loans.products}/${id}`).pipe(
      map(p => this.normalizeProduct(p))
    );
  }

  private normalizeProduct(p: any): LoanProduct {
    const raw = p?.allowedTenures;
    let tenures: number[] = [];
    if (Array.isArray(raw)) {
      tenures = raw.map((t: any) => Number(t)).filter(n => !isNaN(n));
    } else if (typeof raw === 'string') {
      tenures = raw.split(',').map(s => Number(s.trim())).filter(n => !isNaN(n));
    }
    return { ...p, allowedTenures: tenures } as LoanProduct;
  }

  createProduct(product: Omit<LoanProduct, 'id' | 'createdAt'> & { allowedTenures: string }): Observable<LoanProduct> {
    return this.http.post<LoanProduct>(API.loans.products, product);
  }

  // ─── Customer applications ───────────────────────────────────

  applyForLoan(request: LoanApplicationRequest): Observable<LoanApplication> {
    return this.http.post<LoanApplication>(API.loans.apply, request);
  }

  getMyApplications(): Observable<LoanApplication[]> {
    return this.http.get<LoanApplication[]>(API.loans.myApplications);
  }

  // ─── Customer accounts & repayments ─────────────────────────

  getMyAccounts(): Observable<LoanAccount[]> {
    return this.http.get<LoanAccount[]>(API.loans.myAccounts);
  }

  getRepaymentSchedule(loanAccountId: number, status?: string): Observable<RepaymentInstalment[]> {
    const url = status
      ? `${API.loans.repayments(loanAccountId)}?status=${status}`
      : API.loans.repayments(loanAccountId);
    return this.http.get<RepaymentInstalment[]>(url);
  }

  markAsPaid(loanAccountId: number, repaymentId: number): Observable<RepaymentInstalment> {
    return this.http.patch<RepaymentInstalment>(
      API.loans.payInstalment(loanAccountId, repaymentId), {});
  }

  // ─── Admin ───────────────────────────────────────────────────

  getAllApplications(status?: string): Observable<LoanApplication[]> {
    const url = status
      ? `${API.loans.adminApplications}?status=${status}`
      : API.loans.adminApplications;
    return this.http.get<LoanApplication[]>(url);
  }

  makeDecision(applicationId: number, decision: LoanDecisionRequest): Observable<LoanApplication> {
    return this.http.put<LoanApplication>(API.loans.decision(applicationId), decision);
  }
}
