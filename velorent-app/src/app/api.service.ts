import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Vehicle } from '../models/vehicle.model';
import { RentalCompany } from '../models/rental-company.model';
import { Rental } from '../models/rental.model';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  // Initialize API URL with fallback - ensure it's always defined
  private readonly apiUrl: string;

  constructor(private http: HttpClient) {
    // Safe initialization with multiple fallback checks
    if (environment && environment.apiUrl) {
      this.apiUrl = environment.apiUrl;
    } else if ((window as any).__ENV__ && (window as any).__ENV__.apiUrl) {
      // Fallback to window global if available
      this.apiUrl = (window as any).__ENV__.apiUrl;
    } else {
      // Final fallback to production URL
      this.apiUrl = 'https://velorent-backend-clean.onrender.com/api';
    }
    
    // Debug logging for environment
    console.log('ApiService initialized');
    console.log('Environment object:', environment);
    console.log('Environment type:', typeof environment);
    console.log('API URL:', this.apiUrl);
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  // Auth endpoints
  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/login`, { email, password });
  }

  register(name: string, email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/register`, { name, email, password });
  }

  // Vehicle endpoints
  getVehicles(): Observable<Vehicle[]> {
    console.log('Fetching vehicles from API...');
    // Public: vehicles list should be accessible without auth
    return this.http.get<Vehicle[]>(`${this.apiUrl}/vehicles`).pipe(
      tap(response => console.log('Vehicles API response:', response)),
      catchError(this.handleError)
    );
  }

  getVehicle(id: number): Observable<Vehicle> {
    // Public: vehicle details should be accessible without auth
    return this.http.get<Vehicle>(`${this.apiUrl}/vehicles/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  // Company endpoints
  getCompanies(): Observable<RentalCompany[]> {
    // Public: companies list should be accessible without auth
    return this.http.get<RentalCompany[]>(`${this.apiUrl}/companies`).pipe(
      catchError(this.handleError)
    );
  }

  getCompany(id: number): Observable<RentalCompany> {
    // Public: company details should be accessible without auth
    return this.http.get<RentalCompany>(`${this.apiUrl}/companies/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  getCompanyRules(companyId: number): Observable<any> {
    // Public: company rules should be accessible without auth
    return this.http.get<any>(`${this.apiUrl}/companies/${companyId}/rules`).pipe(
      catchError(this.handleError)
    );
  }

  // Rental endpoints
  getMyRentals(): Observable<Rental[]> {
    return this.http.get<Rental[]>(`${this.apiUrl}/rentals/my-rentals`, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  getRental(id: number): Observable<Rental> {
    return this.http.get<Rental>(`${this.apiUrl}/rentals/${id}`, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  createRental(rentalData: any): Observable<Rental> {
    return this.http.post<Rental>(`${this.apiUrl}/rentals`, rentalData, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  cancelRental(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/rentals/${id}/cancel`, {}, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  // Delete a cancelled booking
  deleteBooking(bookingId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/rentals/bookings/${bookingId}`, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  // Delete multiple cancelled bookings
  deleteMultipleBookings(bookingIds: number[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/rentals/bookings/delete-multiple`, { bookingIds }, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  // Get available vehicles
  getAvailableVehicles(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/vehicles`).pipe(
      catchError(this.handleError)
    );
  }

  // Get user rentals
  getUserRentals(userId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/rentals/user/${userId}`).pipe(
      catchError(this.handleError)
    );
  }

  createRentalWithFiles(formData: FormData) {
    // The auth interceptor should handle adding the Authorization header
    // For FormData, we don't set Content-Type - browser will set it with boundary
    const token = localStorage.getItem('token');
    
    console.log('=== CREATE RENTAL DEBUG ===');
    console.log('Token exists:', !!token);
    console.log('Token value (first 20 chars):', token ? token.substring(0, 20) + '...' : 'No token');
    console.log('API URL:', `${this.apiUrl}/rentals`);
    
    if (!token) {
      console.error('No token found in localStorage - user needs to log in');
      return throwError(() => new Error('Authentication required. Please log in again.'));
    }
    
    // Let the auth interceptor handle the Authorization header
    // Don't set Content-Type - browser will set it with boundary for FormData
    return this.http.post(`${this.apiUrl}/rentals`, formData).pipe(
      catchError((error) => {
        console.error('Error in createRentalWithFiles:', error);
        if (error.status === 401) {
          console.error('401 Unauthorized - Token might be expired or invalid');
          console.error('Please log in again to get a fresh token');
        }
        return this.handleError(error);
      })
    );
  }

  createBooking(bookingData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/rentals/bookings`, bookingData).pipe(
      catchError(this.handleError)
    );
  }

  // Add new method for ID verification
  verifyId(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('idImage', file);
    // No special headers needed for FormData, browser sets Content-Type with boundary
    return this.http.post(`${this.apiUrl}/verify-id`, formData).pipe(
      catchError(this.handleError) // Use existing error handling
    );
  }

  getMyBookings(): Observable<any[]> {
    const headers = this.getHeaders();
    console.log('=== API SERVICE DEBUG ===');
    console.log('API URL:', `${this.apiUrl}/rentals/my-bookings`);
    console.log('Headers:', headers);
    console.log('Token from localStorage:', localStorage.getItem('token'));
    
    return this.http.get<any[]>(`${this.apiUrl}/rentals/my-bookings`, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  markNotificationAsRead(bookingId: number): Observable<any> {
    const headers = this.getHeaders();
    return this.http.put(`${this.apiUrl}/rentals/${bookingId}/mark-notification-read`, {}, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  // Company availability endpoints
  getCompanyAvailability(companyId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/companies/${companyId}/availability`).pipe(
      catchError(this.handleError)
    );
  }

  checkCompanyAvailability(companyId: number, date: string, time: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/companies/${companyId}/check-availability`, {
      date,
      time
    }).pipe(
      catchError(this.handleError)
    );
  }

  // Driver endpoints
  getDrivers(companyId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/companies/${companyId}/drivers`).pipe(
      catchError(this.handleError)
    );
  }

  // Check vehicle availability
  checkVehicleAvailability(vehicleId: number, startDate: string, endDate: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/vehicles/${vehicleId}/availability?startDate=${startDate}&endDate=${endDate}`).pipe(
      catchError(this.handleError)
    );
  }

  // Notification endpoints
  getMyNotifications(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/notifications/my-notifications`, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  getUnreadNotificationCount(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/notifications/unread-count`, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  markNotificationAsReadById(notificationId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/notifications/${notificationId}/read`, {}, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  markAllNotificationsAsRead(): Observable<any> {
    return this.http.put(`${this.apiUrl}/notifications/mark-all-read`, {}, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  // Payment endpoints
  createPayment(amount: number, bookingId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/payments/create-payment`, {
      amount: amount,
      booking_id: bookingId
    }, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  getPaymentStatus(bookingId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/payments/status/${bookingId}`, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  // Get transaction details for a specific booking
  getTransactionDetails(bookingId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/rentals/transaction/${bookingId}`, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  // Use arrow function to preserve 'this' context
  private handleError = (error: HttpErrorResponse) => {
    console.error('API Error:', error);
    let errorMessage = 'An error occurred';
    
    // Store apiUrl in a variable to avoid 'this' context issues
    const apiUrl = this.apiUrl || 'https://velorent-backend-clean.onrender.com/api';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message;
    } else if (error.status === 0) {
      // Network error - connection failed
      errorMessage = `Network Error: Unable to connect to server. Please check:\n1. Backend server is running on ${apiUrl}\n2. Device and server are on the same network\n3. Firewall allows connections on port 3000\n4. Backend server is accessible at ${apiUrl}`;
    } else {
      // Server-side error - try to extract the actual error message
      const errorData = error.error;
      if (errorData?.message) {
        errorMessage = errorData.message;
      } else if (errorData?.error) {
        errorMessage = errorData.error;
      } else if (errorData?.details && Array.isArray(errorData.details) && errorData.details.length > 0) {
        errorMessage = errorData.details[0];
      } else {
        errorMessage = `Error Code: ${error.status}\nMessage: ${error.message || 'Unknown error'}`;
      }
    }
    
    return throwError(() => new Error(errorMessage));
  }
}
