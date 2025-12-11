import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { OAuthCallbackService } from '../../services/oauth-callback.service';
import { SocialUser } from '../../services/social-auth.service';

@Component({
  selector: 'app-google-callback',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <div class="callback-container">
      <div class="callback-content">
        <ion-spinner name="crescent"></ion-spinner>
        <p>Processing Google authentication...</p>
      </div>
    </div>
  `,
  styles: [`
    .callback-container {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      background: linear-gradient(135deg, #0f0f23, #1a1a2e, #16213e, #0f3460);
    }
    
    .callback-content {
      text-align: center;
      color: #ffd700;
    }
    
    ion-spinner {
      margin-bottom: 1rem;
    }
  `]
})
export class GoogleCallbackComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private oauthCallbackService: OAuthCallbackService
  ) {}

  ngOnInit() {
    // Get the authorization code from URL parameters
    this.route.queryParams.subscribe(params => {
      // Some providers return params in the hash fragment; merge both.
      const fragmentParams = this.parseHashParams(window.location.hash);
      const code = params['code'] || fragmentParams['code'];
      const idToken = params['id_token'] || fragmentParams['id_token'];
      const error = params['error'] || fragmentParams['error'];
      const state = params['state'] || fragmentParams['state'];
      
      console.log('Google callback params:', params);
      
      if (error) {
        console.error('Google OAuth error:', error);
        this.sendMessageToParent('GOOGLE_AUTH_ERROR', { error });
      } else if (code && state === 'google_auth') {
        console.log('Google OAuth code received:', code);
        // Exchange code/id token for user info
        this.exchangeCodeForUserInfo(code, idToken);
      } else {
        console.log('No code or invalid state received');
        this.sendMessageToParent('GOOGLE_AUTH_ERROR', { error: 'No authorization code received' });
      }
    });
  }

  private parseHashParams(hash: string): Record<string, string> {
    if (!hash || hash.length <= 1) return {};
    const query = hash.startsWith('#') ? hash.substring(1) : hash;
    return query.split('&').reduce((acc: any, part) => {
      const [k, v] = part.split('=');
      if (k) acc[decodeURIComponent(k)] = v ? decodeURIComponent(v) : '';
      return acc;
    }, {});
  }

  private async exchangeCodeForUserInfo(code: string, idToken?: string) {
    try {
      console.log('Exchanging Google OAuth code for user info:', code);
      
      const userInfo = this.buildUserFromIdToken(idToken) || await this.getUserInfoFromCode(code);
      console.log('User info retrieved:', userInfo);
      
      // Authenticate with backend
      await this.oauthCallbackService.handleOAuthCallback(userInfo);
      console.log('OAuth callback handled successfully with backend');
      
      // Send success message to parent window
      this.sendMessageToParent('GOOGLE_AUTH_SUCCESS', { user: userInfo });
      
      // Redirect back to the original page or dashboard
      const returnUrl = this.getReturnUrl();
      console.log('Redirecting to:', returnUrl);
      window.location.href = returnUrl;
      
    } catch (error) {
      console.error('Error in exchangeCodeForUserInfo:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.sendMessageToParent('GOOGLE_AUTH_ERROR', { error: errorMessage });
      
      // Redirect to login page on error
      setTimeout(() => {
        window.location.href = '/login?error=' + encodeURIComponent(errorMessage);
      }, 300);
    }
  }

  private getReturnUrl(): string {
    // Get return URL from localStorage or default to dashboard
    const returnUrl = localStorage.getItem('returnUrl') || '/dashboard';
    localStorage.removeItem('returnUrl'); // Clean up
    return returnUrl;
  }

  private showSuccessMessage() {
    // Replace the content with success message
    document.body.innerHTML = `
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100vh;
        background: linear-gradient(135deg, #0f0f23, #1a1a2e, #16213e, #0f3460);
        color: #ffd700;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        text-align: center;
        padding: 20px;
      ">
        <div style="
          background: rgba(24, 24, 24, 0.95);
          padding: 2rem;
          border-radius: 20px;
          border: 2px solid #ffd700;
          max-width: 400px;
          box-shadow: 0 8px 32px rgba(255, 215, 0, 0.3);
        ">
          <div style="font-size: 3rem; margin-bottom: 1rem;">✅</div>
          <h2 style="color: #ffd700; margin-bottom: 1rem;">Login Successful!</h2>
          <p style="color: #e0e0e0; margin-bottom: 1.5rem;">This window will close automatically in <span id="countdown">2</span> seconds...</p>
          <p style="color: #b0b0b0; font-size: 0.9rem;">You will be redirected to the main page.</p>
        </div>
      </div>
    `;
    
    // Start countdown
    let countdown = 2;
    const countdownElement = document.getElementById('countdown');
    const interval = setInterval(() => {
      countdown--;
      if (countdownElement) {
        countdownElement.textContent = countdown.toString();
      }
      if (countdown <= 0) {
        clearInterval(interval);
      }
    }, 1000);
  }

  private buildUserFromIdToken(idToken?: string): SocialUser | null {
    if (!idToken) return null;
    try {
      const payload = JSON.parse(atob(idToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      const nonceFromStorage = sessionStorage.getItem('google_oauth_nonce');
      if (payload.nonce && nonceFromStorage && payload.nonce !== nonceFromStorage) {
        console.warn('Nonce mismatch; ignoring id_token');
        return null;
      }
      return {
        id: payload.sub || ('google_user_' + Date.now()),
        email: payload.email || '',
        name: payload.name || payload.email || 'Google User',
        picture: payload.picture || '',
        provider: 'google',
        created_at: new Date().toISOString()
      };
    } catch (err) {
      console.error('Failed to parse id_token', err);
      return null;
    }
  }

  private async getUserInfoFromCode(code: string) {
    // Fallback: minimal payload; backend should exchange the code for real profile data
    return {
      id: 'google_user_' + Date.now(),
      email: '',
      name: 'Google User',
      picture: '',
      provider: 'google' as 'google',
      created_at: new Date().toISOString()
    };
  }

  private sendMessageToParent(type: string, data: any) {
    console.log('Sending message to parent:', { type, data });
    
    // Check if we have stored resolve/reject functions (main window redirect)
    if ((window as any).googleAuthResolve && (window as any).googleAuthReject) {
      if (type === 'GOOGLE_AUTH_SUCCESS') {
        console.log('Resolving Google auth with user data');
        (window as any).googleAuthResolve(data.user);
      } else if (type === 'GOOGLE_AUTH_ERROR') {
        console.log('Rejecting Google auth with error');
        (window as any).googleAuthReject(new Error(data.error));
      }
    } else if (window.opener) {
      // Fallback to popup message (if still using popup)
      window.opener.postMessage({ type, ...data }, window.location.origin);
      console.log('Message sent to parent window');
    } else {
      // In same-window flow, there may be no parent/opener. Just no-op.
      console.log('No parent window or stored auth functions; continuing without postMessage');
    }
  }
}
