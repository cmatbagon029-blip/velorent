import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { OAuthCallbackService } from '../../services/oauth-callback.service';

@Component({
  selector: 'app-facebook-callback',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <div class="callback-container">
      <div class="callback-content">
        <ion-spinner name="crescent"></ion-spinner>
        <p>Processing Facebook authentication...</p>
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
export class FacebookCallbackComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private oauthCallbackService: OAuthCallbackService
  ) {}

  ngOnInit() {
    // Get the authorization code from URL parameters
    this.route.queryParams.subscribe(params => {
      const code = params['code'];
      const error = params['error'];
      const state = params['state'];
      
      console.log('Facebook callback params:', params);
      
      if (error) {
        console.error('Facebook OAuth error:', error);
        this.sendMessageToParent('FACEBOOK_AUTH_ERROR', { error });
      } else if (code && state === 'facebook_auth') {
        console.log('Facebook OAuth code received:', code);
        // Exchange code for user info
        this.exchangeCodeForUserInfo(code);
      } else {
        console.log('No code or invalid state received');
        this.sendMessageToParent('FACEBOOK_AUTH_ERROR', { error: 'No authorization code received' });
      }
    });
  }

  private async exchangeCodeForUserInfo(code: string) {
    try {
      console.log('Exchanging Facebook OAuth code for user info:', code);
      
      // In a real implementation, you would send this code to your backend
      // to exchange it for user information
      const userInfo = await this.getUserInfoFromCode(code);
      console.log('User info retrieved:', userInfo);
      
      // Authenticate with backend
      await this.oauthCallbackService.handleOAuthCallback(userInfo);
      console.log('OAuth callback handled successfully with backend');
      
      // Send success message to parent window
      this.sendMessageToParent('FACEBOOK_AUTH_SUCCESS', { user: userInfo });
      
      // Redirect back to the original page or dashboard
      const returnUrl = this.getReturnUrl();
      console.log('Redirecting to:', returnUrl);
      window.location.href = returnUrl;
      
    } catch (error) {
      console.error('Error in exchangeCodeForUserInfo:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.sendMessageToParent('FACEBOOK_AUTH_ERROR', { error: errorMessage });
      
      // Redirect to login page on error
      window.location.href = '/login?error=' + encodeURIComponent(errorMessage);
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

  private async getUserInfoFromCode(code: string) {
    // In a real implementation, you would exchange this code for user information
    // For now, return a basic user structure that will be handled by the backend
    return {
      id: 'facebook_user_' + Date.now(),
      email: 'user@facebook.com',
      name: 'Facebook User',
      picture: 'https://via.placeholder.com/150',
      provider: 'facebook' as 'facebook',
      created_at: new Date().toISOString()
    };
  }

  private sendMessageToParent(type: string, data: any) {
    console.log('Sending message to parent:', { type, data });
    
    // Check if we have stored resolve/reject functions (main window redirect)
    if ((window as any).facebookAuthResolve && (window as any).facebookAuthReject) {
      if (type === 'FACEBOOK_AUTH_SUCCESS') {
        console.log('Resolving Facebook auth with user data');
        (window as any).facebookAuthResolve(data.user);
      } else if (type === 'FACEBOOK_AUTH_ERROR') {
        console.log('Rejecting Facebook auth with error');
        (window as any).facebookAuthReject(new Error(data.error));
      }
    } else if (window.opener) {
      // Fallback to popup message (if still using popup)
      window.opener.postMessage({ type, ...data }, window.location.origin);
      console.log('Message sent to parent window');
    } else {
      console.error('No parent window found and no stored auth functions');
    }
  }
}
