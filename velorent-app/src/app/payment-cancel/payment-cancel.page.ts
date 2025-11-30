import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController, NavController } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-payment-cancel',
  standalone: true,
  imports: [IonicModule, CommonModule],
  template: `
    <ion-content class="ion-padding">
      <div class="payment-container">
        <div class="payment-content">
          <ion-icon name="close-circle" class="cancel-icon"></ion-icon>
          <h1>Payment Cancelled</h1>
          <p>Your payment was cancelled. You can complete the payment later from your bookings.</p>
          <div class="button-group">
            <ion-button expand="block" class="btn-primary-modern" (click)="goToMyRentals()">View My Rentals</ion-button>
            <ion-button expand="block" class="btn-secondary-modern" (click)="goToDashboard()">Go to Dashboard</ion-button>
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
    
    .cancel-icon {
      font-size: 80px;
      color: #f44336;
      margin-bottom: 1rem;
    }
    
    h1 {
      color: #D4AF37;
      margin-bottom: 1rem;
    }
    
    p {
      color: #ccc;
      margin-bottom: 2rem;
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
export class PaymentCancelPage implements OnInit {
  bookingId: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private toastController: ToastController,
    private navCtrl: NavController
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.bookingId = params['booking_id'] ? parseInt(params['booking_id']) : null;
      
      if (this.bookingId) {
        this.showToast('Payment was cancelled. You can complete it later from My Rentals.', 'warning');
      }
    });
  }

  goToMyRentals() {
    this.navCtrl.navigateRoot('/my-rentals');
  }

  goToDashboard() {
    this.navCtrl.navigateRoot('/dashboard');
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

