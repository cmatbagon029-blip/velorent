import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Vehicle } from '../models/vehicle.model';
import { RentalCompany } from '../models/rental-company.model';
import { Rental } from '../models/rental.model';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

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
    return this.http.post(`${this.apiUrl}/rentals`, formData, {
      headers: this.getHeaders().delete('Content-Type') // Let browser set boundary
    });
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

  private handleError(error: HttpErrorResponse) {
    console.error('API Error:', error);
    let errorMessage = 'An error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message;
    } else {
      // Server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    
    return throwError(() => new Error(errorMessage));
  }
}
