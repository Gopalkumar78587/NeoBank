import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AccountService } from '../../core/services/account.service';

@Component({
  selector: 'app-customer-accounts',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './customer-accounts.component.html',
  styleUrls: ['./customer-accounts.component.css']
})
export class CustomerAccountsComponent implements OnInit {

  accounts: any[] = [];

  accountForm = {
    accountType: 'SAVINGS',
    initialDeposit: 0
  };

  constructor(private accountService: AccountService) {}

  ngOnInit(): void {
    this.loadAccounts();
  }

  loadAccounts() {
    this.accountService.getAccounts()
      .subscribe(res => this.accounts = res);
  }

  createAccount() {
    this.accountService.createAccount(this.accountForm)
      .subscribe(() => {
        alert('✅ Account created successfully');
        this.loadAccounts();
      });
  }
}