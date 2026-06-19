import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API } from '../config/api.config';

@Injectable({ providedIn: 'root' })
export class AccountService {

  private http = inject(HttpClient);
  private base = API.customer.accounts;

  getAccounts() {
    return this.http.get<any[]>(this.base);
  }

  createAccount(data: {
    accountType: string;
    initialDeposit: number;
    purpose?: string;
    nomineeName?: string;
    nomineeRelation?: string;
    nomineeDob?: string;
    communicationMode?: string;
    occupation?: string;
    employmentStatus?: string;
    branchPreference?: string;
    debitCardRequired?: boolean;
    chequeBookRequired?: boolean;
    netBankingRequired?: boolean;
    acceptedTerms?: boolean;
  }) {
    return this.http.post<any>(this.base, data);
  }

  freezeAccount(accountId: number) {
    return this.http.patch(`${this.base}/${accountId}/freeze`, {});
  }

  activateAccount(accountId: number) {
    return this.http.patch(`${this.base}/${accountId}/activate`, {});
  }

  closeAccount(accountId: number) {
    return this.http.patch(`${this.base}/${accountId}/close`, {});
  }

  downloadStatement(accountId: number, month: number, year: number) {
    return this.http.get(
      `${this.base}/${accountId}/statement?month=${month}&year=${year}`,
      { responseType: 'blob' }
    );
  }

  getBalanceHistory(accountId: number) {
    return this.http.get<any[]>(`${this.base}/${accountId}/balance-history`);
  }

  requestClosure(accountId: number) {
    return this.http.post(`${this.base}/${accountId}/request-closure`, {});
  }

  getCreditLimit(accountId: number) {
    return this.http.get<any>(`${this.base}/${accountId}/credit-limit`);
  }

  getDebitLimit(accountId: number) {
    return this.http.get<any>(`${this.base}/${accountId}/debit-limit`);
  }
}
