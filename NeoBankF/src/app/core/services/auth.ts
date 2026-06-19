import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API } from '../config/api.config';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private http = inject(HttpClient);

  login(data: LoginRequest): Observable<any> {
    return this.http.post(
      API.auth.login,
      data,
      {
        headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
        withCredentials: true
      }
    );
  }

  register(data: RegisterRequest): Observable<any> {
    return this.http.post(
      API.auth.register,
      data,
      {
        headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
        withCredentials: true
      }
    );
  }
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  role?: 'CUSTOMER' | 'ADMIN';

  // Optional KYC captured at registration
  phone?: string;
  dateOfBirth?: string;    // YYYY-MM-DD
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | '';
  aadhaar?: string;        // 12 digits
  pan?: string;            // ABCDE1234F
  addressLine?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
  occupation?: string;
  annualIncome?: number;
}
