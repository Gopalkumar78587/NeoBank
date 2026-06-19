import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API } from '../config/api.config';

@Injectable({ providedIn: 'root' })
export class OtpService {

  private http = inject(HttpClient);
  private base = API.customer.otp;

  /** Send OTP to the logged-in user's email */
  sendOtp(): Observable<any> {
    return this.http.post(`${this.base}/send`, {});
  }

  /** Verify OTP entered by the user */
  verifyOtp(otp: string): Observable<any> {
    return this.http.post(`${this.base}/verify`, { otp });
  }
}

