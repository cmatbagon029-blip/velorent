import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface SocialUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
  provider: 'google' | 'facebook';
  created_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class OAuthCallbackService {
  private apiUrl = environment?.apiUrl || 'http://192.168.1.21:3000/api';

  constructor(private http: HttpClient) { }

  /**
   * Authenticates the social user with the backend and stores user data
   */
  authenticateSocialUser(socialUser: SocialUser): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/social-login`, {
      provider: socialUser.provider,
      socialId: socialUser.id,
      email: socialUser.email,
      name: socialUser.name,
      picture: socialUser.picture
    });
  }

  /**
   * Handles the OAuth callback by authenticating with backend and storing user data
   */
  async handleOAuthCallback(socialUser: SocialUser): Promise<void> {
    try {
      console.log('Handling OAuth callback for user:', socialUser);
      
      // Authenticate with backend
      const response = await this.authenticateSocialUser(socialUser).toPromise();
      console.log('Backend authentication response:', response);
      
      if (response && response.success) {
        // Store user data and token
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        console.log('User data stored successfully');
      } else {
        throw new Error('Authentication failed');
      }
    } catch (error) {
      console.error('Error in OAuth callback handling:', error);
      throw error;
    }
  }
}
