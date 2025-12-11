import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface CompanyPolicy {
  company_id: number;
  reschedule_terms: string;
  cancellation_terms: string;
  refund_terms: string;
  allow_reschedule: boolean;
  allow_cancellation: boolean;
  allow_refund: boolean;
  reschedule_free_days: number;
  reschedule_fee_percentage: number;
  cancellation_fee_percentage: number;
  deposit_refundable: boolean;
  last_updated?: string;
}

export interface BookingRequest {
  id?: number;
  user_id: number;
  company_id: number;
  booking_id: number;
  request_type: 'reschedule' | 'cancellation';
  status: 'pending' | 'approved' | 'rejected';
  reason: string;
  new_start_date?: string;
  new_end_date?: string;
  new_rent_time?: string;
  computed_fee?: number;
  company_response?: string;
  company_remarks?: string;
  created_at?: string;
  updated_at?: string;
  vehicle_name?: string;
  original_start_date?: string;
  original_end_date?: string;
  original_rent_time?: string;
  company_name?: string;
}

export interface FeeComputation {
  computed_fee: number;
  fee_details: {
    fee: number;
    percentage: number;
    reason: string;
  };
  policy_applied: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class BookingRequestService {
  private apiUrl = environment?.apiUrl || 'https://velorent-backend.onrender.com/api';

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  // Get company policies
  getCompanyPolicies(companyId: number): Observable<CompanyPolicy> {
    return this.http.get<CompanyPolicy>(`${this.apiUrl}/companies/${companyId}/policies`);
  }

  // Get all requests for current user
  getMyRequests(): Observable<BookingRequest[]> {
    return this.http.get<BookingRequest[]>(`${this.apiUrl}/requests/my-requests`, { headers: this.getHeaders() });
  }

  // Get a specific request
  getRequest(requestId: number): Observable<BookingRequest> {
    return this.http.get<BookingRequest>(`${this.apiUrl}/requests/${requestId}`, { headers: this.getHeaders() });
  }

  // Create a new request
  createRequest(request: Partial<BookingRequest>): Observable<BookingRequest> {
    return this.http.post<BookingRequest>(`${this.apiUrl}/requests`, request, { headers: this.getHeaders() });
  }

  // Compute fee for a request
  computeFee(bookingId: number, requestType: 'reschedule' | 'cancellation', newStartDate?: string): Observable<FeeComputation> {
    return this.http.post<FeeComputation>(`${this.apiUrl}/requests/compute-fee`, {
      booking_id: bookingId,
      request_type: requestType,
      new_start_date: newStartDate
    }, { headers: this.getHeaders() });
  }

  // Delete a request (only for rejected/completed requests)
  deleteRequest(requestId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/requests/${requestId}`, { headers: this.getHeaders() });
  }

  // Delete multiple requests
  deleteMultipleRequests(requestIds: number[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/requests/delete-multiple`, { requestIds }, { headers: this.getHeaders() });
  }
}

