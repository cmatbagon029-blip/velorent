import { Component, OnInit } from '@angular/core';
import { IonicModule, AlertController, LoadingController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { ApiService } from '../api.service';
import { firstValueFrom } from 'rxjs';
import { addIcons } from 'ionicons';
import { 
  receiptOutline,
  calendarOutline,
  carOutline,
  cashOutline,
  checkmarkCircleOutline,
  timeOutline,
  closeCircleOutline,
  documentTextOutline,
  arrowBackOutline,
  locationOutline,
  chatbubbleOutline
} from 'ionicons/icons';

// Register icons
addIcons({ 
  'receipt-outline': receiptOutline,
  'calendar-outline': calendarOutline,
  'car-outline': carOutline,
  'cash-outline': cashOutline,
  'checkmark-circle-outline': checkmarkCircleOutline,
  'time-outline': timeOutline,
  'close-circle-outline': closeCircleOutline,
  'document-text-outline': documentTextOutline,
  'arrow-back-outline': arrowBackOutline,
  'location-outline': locationOutline,
  'chatbubble-outline': chatbubbleOutline
});

@Component({
  selector: 'app-transaction-details',
  standalone: true,
  imports: [IonicModule, CommonModule, RouterModule],
  templateUrl: './transaction-details.page.html',
  styleUrls: ['./transaction-details.page.scss']
})
export class TransactionDetailsPage implements OnInit {
  transaction: any = null;
  loading = true;
  error: string | null = null;
  bookingId: number | null = null;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private apiService: ApiService,
    private alertController: AlertController,
    private loadingController: LoadingController
  ) {}

  ngOnInit() {
    // Check if user is logged in
    const user = localStorage.getItem('user');
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    // Get booking ID from route
    this.route.params.subscribe(params => {
      this.bookingId = +params['id'];
      if (this.bookingId) {
        this.loadTransactionDetails();
      } else {
        this.error = 'Invalid booking ID';
        this.loading = false;
      }
    });
  }

  async loadTransactionDetails() {
    if (!this.bookingId) return;

    this.loading = true;
    this.error = null;

    try {
      this.transaction = await firstValueFrom(this.apiService.getTransactionDetails(this.bookingId));
      this.loading = false;
    } catch (err: any) {
      console.error('Error loading transaction details:', err);
      this.error = err.error?.error || err.message || 'Failed to load transaction details';
      this.loading = false;
      
      // Show error alert
      const alert = await this.alertController.create({
        header: 'Error',
        message: this.error || 'Failed to load transaction details',
        buttons: [
          {
            text: 'Go Back',
            handler: () => {
              this.router.navigate(['/my-rentals']);
            }
          },
          {
            text: 'Retry',
            handler: () => {
              this.loadTransactionDetails();
            }
          }
        ]
      });
      await alert.present();
    }
  }

  formatDate(date: string): string {
    if (!date) return 'N/A';
    try {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) return date;
      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return date;
    }
  }

  formatTime(time: string): string {
    if (!time) return '';
    try {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    } catch {
      return time;
    }
  }

  formatCurrency(amount: number): string {
    return `₱${amount.toFixed(2)}`;
  }

  getPaymentStatusColor(status: string): string {
    switch (status?.toLowerCase()) {
      case 'paid':
        return 'success';
      case 'pending':
      case 'partially_paid':
        return 'warning';
      case 'failed':
        return 'danger';
      default:
        return 'medium';
    }
  }

  getBookingStatusColor(status: string): string {
    switch (status?.toLowerCase()) {
      case 'approved':
      case 'active':
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'rejected':
      case 'cancelled':
        return 'danger';
      default:
        return 'medium';
    }
  }

  getPaymentStatusText(status: string): string {
    switch (status?.toLowerCase()) {
      case 'paid':
        return 'Paid';
      case 'pending':
        return 'Pending';
      case 'partially_paid':
        return 'Partially Paid';
      case 'failed':
        return 'Failed';
      default:
        return status || 'Unknown';
    }
  }

  goBack() {
    this.router.navigate(['/my-rentals']);
  }

  async downloadReceipt() {
    // TODO: Implement receipt/invoice download
    const alert = await this.alertController.create({
      header: 'Receipt Download',
      message: 'Receipt download feature will be available soon.',
      buttons: ['OK']
    });
    await alert.present();
  }

  getVehicleImageUrl(transaction: any): string {
    // Use vehicle_image from transaction if available
    if (transaction?.vehicle_image) {
      return transaction.vehicle_image;
    }
    // Fallback to placeholder
    return 'assets/images/vehicle-placeholder.svg';
  }

  handleImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img) {
      img.src = 'assets/images/vehicle-placeholder.svg';
    }
  }

  getPricePerDay(breakdown: any[]): number {
    if (!breakdown || breakdown.length === 0) return 0;
    // Extract price per day from breakdown description or calculate from total
    const item = breakdown[0];
    if (item.description) {
      const match = item.description.match(/×\s*₱?([\d,]+\.?\d*)/);
      if (match) {
        return parseFloat(match[1].replace(/,/g, ''));
      }
    }
    // Fallback: if we have total and days, calculate per day
    return 0;
  }

  getNumberOfDays(transaction: any): number {
    if (!transaction.pickup_date || !transaction.return_date) return 0;
    const start = new Date(transaction.pickup_date);
    const end = new Date(transaction.return_date);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  }
}

