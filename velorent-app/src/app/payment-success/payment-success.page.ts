import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController, NavController } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../api.service';

@Component({
  selector: 'app-payment-success',
  standalone: true,
  imports: [IonicModule, CommonModule],
  template: `
    <ion-content class="ion-padding">
      <div class="payment-container">
        <div class="payment-content">
          <ion-icon name="checkmark-circle-outline" class="success-icon"></ion-icon>
          <h1>Payment Processing</h1>
          <p>We're verifying your payment. Please wait...</p>
          <p *ngIf="bookingId" class="booking-info">Booking ID: {{ bookingId }}</p>
          <ion-spinner name="crescent"></ion-spinner>
          <div class="button-group">
            <ion-button expand="block" class="btn-primary-modern" (click)="forceCheckStatus()">
              Refresh Status
            </ion-button>
            <ion-button expand="block" class="btn-secondary-modern" (click)="goToMyRentals()">
              Skip to My Rentals
            </ion-button>
          </div>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    .payment-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #0f0f23, #1a1a2e, #16213e, #0f3460);
    }
    
    .payment-content {
      text-align: center;
      color: white;
      padding: 2rem;
      max-width: 400px;
    }
    
    .success-icon {
      font-size: 80px;
      color: #4caf50;
      margin-bottom: 1rem;
    }
    
    h1 {
      color: #ffd700;
      margin-bottom: 1rem;
    }
    
    p {
      color: #ccc;
      margin-bottom: 2rem;
    }
    
    ion-spinner {
      --color: #ffd700;
    }
    
    .booking-info {
      font-size: 0.9rem;
      color: #999;
      margin-top: 0.5rem;
    }
    
    .button-group {
      margin-top: 2rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      width: 100%;
      max-width: 400px;
      margin-left: auto;
      margin-right: auto;
    }
  `]
})
export class PaymentSuccessPage implements OnInit, OnDestroy {
  bookingId: number | null = null;
  private checkInterval: any = null;
  private paymentConfirmed: boolean = false; // Flag to prevent multiple toasts

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private toastController: ToastController,
    private navCtrl: NavController
  ) {}

  ngOnInit() {
    // Get booking_id from query params or sessionStorage
    this.route.queryParams.subscribe(params => {
      this.bookingId = params['booking_id'] 
        ? parseInt(params['booking_id']) 
        : (sessionStorage.getItem('pendingPaymentBookingId') 
          ? parseInt(sessionStorage.getItem('pendingPaymentBookingId')!) 
          : null);
      
      // Clear sessionStorage after reading
      if (sessionStorage.getItem('pendingPaymentBookingId')) {
        sessionStorage.removeItem('pendingPaymentBookingId');
      }
      
      if (this.bookingId) {
        // Check payment status immediately
        this.checkPaymentStatus(this.bookingId);
      } else {
        this.showToast('Booking ID not found', 'danger');
        setTimeout(() => {
          this.navCtrl.navigateRoot('/dashboard');
        }, 2000);
      }
    });
  }

  checkPaymentStatus(bookingId: number) {
    // Don't start polling if payment already confirmed
    if (this.paymentConfirmed) {
      return;
    }

    // Poll payment status with retries
    let attempts = 0;
    const maxAttempts = 30; // Check for up to 3 minutes (30 * 6 seconds)
    
    const performCheck = () => {
      // Stop if payment already confirmed
      if (this.paymentConfirmed) {
        if (this.checkInterval) {
          clearInterval(this.checkInterval);
          this.checkInterval = null;
        }
        return;
      }

      attempts++;
      console.log(`Checking payment status (attempt ${attempts}/${maxAttempts}) for booking ${bookingId}`);
      
      this.apiService.getPaymentStatus(bookingId).subscribe({
        next: (paymentStatus: any) => {
          console.log('Payment status response:', paymentStatus);
          
          if (paymentStatus.status === 'paid') {
            // Stop all polling immediately if not already confirmed
            if (!this.paymentConfirmed) {
              this.paymentConfirmed = true;
              if (this.checkInterval) {
                clearInterval(this.checkInterval);
                this.checkInterval = null;
              }
              
              // Show toast only once
              this.showToast('Payment confirmed! Your booking has been submitted successfully.', 'success');
              
              setTimeout(() => {
                this.navCtrl.navigateRoot('/my-rentals');
              }, 2000);
            }
          } else if (paymentStatus.status === 'failed') {
            // Stop polling on failure
            if (this.checkInterval) {
              clearInterval(this.checkInterval);
              this.checkInterval = null;
            }
            this.showToast('Payment failed. Please try again.', 'danger');
            setTimeout(() => {
              this.navCtrl.navigateRoot('/rent-vehicle');
            }, 3000);
          } else if (paymentStatus.status === 'pending') {
            // Still pending, continue checking
            console.log('Payment still pending, will check again...');
            if (attempts >= maxAttempts) {
              if (this.checkInterval) {
                clearInterval(this.checkInterval);
                this.checkInterval = null;
              }
              this.showToast('Payment verification is taking longer than expected. Please check your booking status in My Rentals.', 'warning');
              setTimeout(() => {
                this.navCtrl.navigateRoot('/my-rentals');
              }, 3000);
            }
          } else {
            // Unknown status
            console.warn('Unknown payment status:', paymentStatus.status);
            if (attempts >= maxAttempts) {
              if (this.checkInterval) {
                clearInterval(this.checkInterval);
                this.checkInterval = null;
              }
              this.showToast('Payment status unclear. Please check your booking in My Rentals.', 'warning');
              setTimeout(() => {
                this.navCtrl.navigateRoot('/my-rentals');
              }, 3000);
            }
          }
        },
        error: (error) => {
          console.error('Error checking payment status:', error);
          console.error('Error details:', JSON.stringify(error, null, 2));
          
          // If it's a 404, payment might not exist yet - continue checking
          if (error.status === 404 && attempts < maxAttempts && !this.paymentConfirmed) {
            console.log('Payment not found yet, will continue checking...');
            return; // Continue polling
          }
          
          // For other errors or max attempts reached
          if (attempts >= maxAttempts && !this.paymentConfirmed) {
            if (this.checkInterval) {
              clearInterval(this.checkInterval);
              this.checkInterval = null;
            }
            const errorMsg = error.error?.error || error.message || 'Unable to verify payment status';
            this.showToast(`${errorMsg}. Please check your booking in My Rentals.`, 'warning');
            setTimeout(() => {
              this.navCtrl.navigateRoot('/my-rentals');
            }, 3000);
          }
        }
      });
    };
    
    // Check immediately first
    performCheck();
    
    // Then check every 6 seconds
    this.checkInterval = setInterval(performCheck, 6000);
  }

  forceCheckStatus() {
    if (this.bookingId && !this.paymentConfirmed) {
      console.log('Force checking payment status...');
      this.apiService.getPaymentStatus(this.bookingId).subscribe({
        next: (paymentStatus: any) => {
          console.log('Forced check - Payment status:', paymentStatus);
          if (paymentStatus.status === 'paid') {
            this.paymentConfirmed = true;
            if (this.checkInterval) {
              clearInterval(this.checkInterval);
              this.checkInterval = null;
            }
            this.showToast('Payment confirmed!', 'success');
            setTimeout(() => {
              this.navCtrl.navigateRoot('/my-rentals');
            }, 1500);
          } else if (paymentStatus.status === 'failed') {
            if (this.checkInterval) {
              clearInterval(this.checkInterval);
              this.checkInterval = null;
            }
            this.showToast('Payment failed. Please try again.', 'danger');
          } else {
            this.showToast('Payment is still being processed. Please wait...', 'warning');
          }
        },
        error: (error) => {
          console.error('Error in force check:', error);
          this.showToast('Unable to check payment status. Please try again later.', 'warning');
        }
      });
    }
  }

  goToMyRentals() {
    if (this.checkInterval) clearInterval(this.checkInterval);
    this.navCtrl.navigateRoot('/my-rentals');
  }

  ngOnDestroy() {
    // Clean up interval when component is destroyed
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 3000,
      color: color,
      position: 'top'
    });
    toast.present();
  }
}

