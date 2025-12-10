import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import axios from 'axios';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly MAX_ATTEMPTS = 3;
  private readonly LOCKOUT_INTERVALS = [10, 30, 60]; // Lockout times in seconds
  private readonly ATTEMPTS_KEY = 'login_attempts';
  private readonly LOCKOUT_UNTIL_KEY = 'lockout_until';

  constructor(private router: Router) {}

  private getAttempts(): number {
    const attempts = localStorage.getItem(this.ATTEMPTS_KEY);
    return attempts ? parseInt(attempts) : 0;
  }

  private setAttempts(attempts: number) {
    localStorage.setItem(this.ATTEMPTS_KEY, attempts.toString());
  }

  private getLockoutUntil(): number {
    const lockoutUntil = localStorage.getItem(this.LOCKOUT_UNTIL_KEY);
    return lockoutUntil ? parseInt(lockoutUntil) : 0;
  }

  private setLockoutUntil(timestamp: number) {
    localStorage.setItem(this.LOCKOUT_UNTIL_KEY, timestamp.toString());
  }

  private clearAttempts() {
    localStorage.removeItem(this.ATTEMPTS_KEY);
    localStorage.removeItem(this.LOCKOUT_UNTIL_KEY);
  }

  isLockedOut(): boolean {
    const lockoutUntil = this.getLockoutUntil();
    return lockoutUntil > Date.now();
  }

  getRemainingLockoutTime(): number {
    const lockoutUntil = this.getLockoutUntil();
    const remaining = Math.ceil((lockoutUntil - Date.now()) / 1000);
    return remaining > 0 ? remaining : 0;
  }

  async login(email: string, password: string): Promise<{ success: boolean; message: string }> {
    console.log('=== LOGIN ATTEMPT ===');
    console.log('Email:', email);
    console.log('Is Locked Out:', this.isLockedOut());
    
    if (this.isLockedOut()) {
      const remainingTime = this.getRemainingLockoutTime();
      console.log('Account locked, remaining time:', remainingTime);
      return {
        success: false,
        message: `Account is locked. Please try again in ${remainingTime} seconds.`
      };
    }

    try {
      const apiUrl = environment?.apiUrl || 'https://velorent-backend-clean.onrender.com/api';
      console.log('Sending login request to:', `${apiUrl}/auth/login`);
      const response = await axios.post(`${apiUrl}/auth/login`, {
        email,
        password,
      });

      console.log('Login response:', response.data);

      if (response.data.token) {
        // Successful login
        console.log('Login successful, setting localStorage');
        this.clearAttempts();
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        localStorage.removeItem('logged_out');
        console.log('Token stored in localStorage');
        return { success: true, message: 'Login successful' };
      } else {
        console.log('Login failed - no token in response');
        this.handleFailedAttempt();
        return { success: false, message: response.data.message || 'Login failed' };
      }
    } catch (error: any) {
      console.error('Login error:', error);
      console.error('Error details:', {
        response: error.response?.data,
        status: error.response?.status,
        message: error.message
      });
      this.handleFailedAttempt();
      if (error.response) {
        return { success: false, message: error.response.data.message || 'Login failed' };
      } else if (error.request) {
        return { success: false, message: 'No response from server. Please check if the server is running.' };
      } else {
        return { success: false, message: 'Error setting up the request: ' + error.message };
      }
    }
  }

  private handleFailedAttempt() {
    const attempts = this.getAttempts() + 1;
    this.setAttempts(attempts);

    if (attempts >= this.MAX_ATTEMPTS) {
      const lockoutIndex = Math.min(attempts - this.MAX_ATTEMPTS, this.LOCKOUT_INTERVALS.length - 1);
      const lockoutSeconds = this.LOCKOUT_INTERVALS[lockoutIndex];
      const lockoutUntil = Date.now() + (lockoutSeconds * 1000);
      this.setLockoutUntil(lockoutUntil);
    }
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Redirect inside the app to browsing page; login is user-initiated later
    this.router.navigateByUrl('/dashboard', { replaceUrl: true });
  }
} 