import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API } from '../config/api.config';

@Injectable({
  providedIn: 'root'
})
export class TransactionService {

  private http = inject(HttpClient);
  private base = API.customer.accounts;

  getTransactions(accountId: number) {
    return this.http.get<any[]>(
      `${this.base}/${accountId}/transactions`
    );
  }

  createTransaction(
    accountId: number,
    type: string,
    amount: number,
    description?: string
  ) {
    const params = new URLSearchParams({
      type,
      amount: String(amount),
      description: description ?? ''
    });
    return this.http.post(
      `${this.base}/${accountId}/transactions?${params.toString()}`,
      {}
    );
  }

  /** Create transaction with OTP verification (single-step) */
  createTransactionWithOtp(
    accountId: number,
    type: string,
    amount: number,
    otp: string,
    description?: string
  ) {
    // OTP is no longer required — forwarded for backwards compatibility only.
    return this.createTransaction(accountId, type, amount, description);
  }

  /** Atomic account-to-account transfer (real-bank behavior) */
  transfer(
    fromAccountId: number,
    toAccountNumber: string,
    amount: number,
    note?: string
  ) {
    const params = new URLSearchParams({
      toAccountNumber,
      amount: String(amount),
      note: note ?? ''
    });
    return this.http.post(
      `${this.base}/${fromAccountId}/transactions/transfer?${params.toString()}`,
      {}
    );
  }
}
