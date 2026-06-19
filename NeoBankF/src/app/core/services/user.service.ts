import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface ProfileData {
  fullName?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  aadhaar?: string;
  pan?: string;
  addressLine?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
  occupation?: string;
  annualIncome?: number;
  kycVerified?: boolean;
  profilePhoto?: string | null;
  accounts?: any[];
}

@Injectable({ providedIn: 'root' })
export class UserService {

  private BASE_URL = '/api/customer/profile';

  constructor(private http: HttpClient) {}

  getProfile(): Observable<ProfileData> {
    return this.http.get<ProfileData>(this.BASE_URL);
  }

  updateProfile(data: Partial<ProfileData>): Observable<ProfileData> {
    return this.http.put<ProfileData>(this.BASE_URL, data);
  }

  uploadPhoto(imageDataUrl: string): Observable<any> {
    return this.http.post(`${this.BASE_URL}/photo`, { image: imageDataUrl });
  }

  removePhoto(): Observable<any> {
    return this.http.delete(`${this.BASE_URL}/photo`);
  }

  changePassword(currentPassword: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.BASE_URL}/change-password`, { currentPassword, newPassword });
  }
}
