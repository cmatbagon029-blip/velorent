import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface SocialUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
  provider: 'google' | 'facebook';
}

@Injectable({
  providedIn: 'root'
})
export class SocialAuthService {
  private readonly API_URL = environment?.apiUrl || 'http://192.168.1.21:3000/api';

  constructor(private http: HttpClient) {}

  /**
   * Google OAuth Login
   * This method will redirect the main window to Google OAuth
   */
  async loginWithGoogle(): Promise<SocialUser> {
    return new Promise((resolve, reject) => {
      // Google OAuth configuration
      const clientId = '666180269700-a5o32j97ludkq8km718vdh5io5su5idf.apps.googleusercontent.com';
      const redirectUri = window.location.origin + '/auth/google/callback';
      const scope = 'openid email profile';
      
      // Create Google OAuth URL
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${clientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=${encodeURIComponent(scope)}&` +
        `response_type=code&` +
        `access_type=offline&` +
        `prompt=select_account&` +
        `state=google_auth`;

      // Store the resolve/reject functions for later use
      (window as any).googleAuthResolve = resolve;
      (window as any).googleAuthReject = reject;

      // Redirect the main window to Google OAuth
      window.location.href = authUrl;
    });
  }

  /**
   * Facebook OAuth Login
   * This method will redirect the main window to Facebook OAuth
   */
  async loginWithFacebook(): Promise<SocialUser> {
    return new Promise((resolve, reject) => {
      // Facebook OAuth configuration
      const appId = '1839801923599009';
      const redirectUri = window.location.origin + '/auth/facebook/callback';
      const scope = 'public_profile';
      
      // Create Facebook OAuth URL
      const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
        `client_id=${appId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=${encodeURIComponent(scope)}&` +
        `response_type=code&` +
        `state=facebook_auth`;

      // Store the resolve/reject functions for later use
      (window as any).facebookAuthResolve = resolve;
      (window as any).facebookAuthReject = reject;

      // Redirect the main window to Facebook OAuth
      window.location.href = authUrl;
    });
  }

  /**
   * Send social login data to backend for authentication
   */
  authenticateSocialUser(user: SocialUser): Observable<any> {
    return this.http.post(`${this.API_URL}/auth/social-login`, {
      provider: user.provider,
      socialId: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture
    }).pipe(
      map((response: any) => {
        if (response.success) {
          // Store auth data
          localStorage.setItem('token', response.token);
          localStorage.setItem('user', JSON.stringify(response.user));
          return response;
        } else {
          throw new Error(response.message);
        }
      }),
      catchError(error => {
        console.error('Social authentication error:', error);
        throw error;
      })
    );
  }

  /**
   * Alternative method using Google Sign-In JavaScript SDK
   */
  async loginWithGoogleSDK(): Promise<SocialUser> {
    return new Promise((resolve, reject) => {
      // Load Google Sign-In SDK if not already loaded
      if (!window.google) {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.onload = () => this.initializeGoogleSignIn(resolve, reject);
        script.onerror = () => reject(new Error('Failed to load Google Sign-In SDK'));
        document.head.appendChild(script);
      } else {
        this.initializeGoogleSignIn(resolve, reject);
      }
    });
  }

  private initializeGoogleSignIn(resolve: Function, reject: Function) {
    try {
      window.google.accounts.id.initialize({
        client_id: '666180269700-a5o32j97ludkq8km718vdh5io5su5idf.apps.googleusercontent.com',
        callback: (response: any) => {
          // Decode JWT token to get user info
          const payload = JSON.parse(atob(response.credential.split('.')[1]));
          const user: SocialUser = {
            id: payload.sub,
            email: payload.email,
            name: payload.name,
            picture: payload.picture,
            provider: 'google'
          };
          resolve(user);
        }
      });

      // Trigger Google Sign-In popup
      window.google.accounts.id.prompt();
    } catch (error) {
      reject(error);
    }
  }
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    google: any;
  }
}
