import { Component, OnInit } from '@angular/core';
import { IonicModule, ModalController, AlertController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../api.service';
import { NotificationService } from '../services/notification.service';
import { BookingRequestService } from '../services/booking-request.service';
import { RequestNotificationService } from '../services/request-notification.service';
import { AlertModalComponent } from '../components/alert-modal/alert-modal.component';
import { RequestModalComponent } from '../components/request-modal/request-modal.component';
import { Rental } from '../../models/rental.model';
import { addIcons } from 'ionicons';
import { 
  home, 
  searchOutline, 
  carOutline, 
  personOutline,
  notificationsOutline,
  calendarOutline,
  closeCircleOutline,
  documentTextOutline,
  refreshOutline,
  trashOutline,
  receiptOutline,
  cardOutline
} from 'ionicons/icons';

// Register icons
addIcons({ 
  home, 
  'search-outline': searchOutline, 
  'car-outline': carOutline, 
  'person-outline': personOutline,
  'notifications-outline': notificationsOutline,
  'calendar-outline': calendarOutline,
  'close-circle-outline': closeCircleOutline,
  'document-text-outline': documentTextOutline,
  'refresh-outline': refreshOutline,
  'trash-outline': trashOutline,
  'receipt-outline': receiptOutline,
  'card-outline': cardOutline
});

@Component({
  selector: 'app-my-rentals',
  standalone: true,
  imports: [IonicModule, CommonModule, RouterModule],
  templateUrl: './my-rentals.page.html',
  styleUrls: ['./my-rentals.page.scss']
})
export class MyRentalsPage implements OnInit {
  bookings: any[] = [];
  loading = true;
  error: string | null = null;
  unreadCount: number = 0;
  requestUnreadCount: number = 0;

  constructor(
    private router: Router,
    private modalCtrl: ModalController,
    private alertCtrl: AlertController,
    private apiService: ApiService,
    private notificationService: NotificationService,
    private bookingRequestService: BookingRequestService,
    private requestNotificationService: RequestNotificationService
  ) {}

  ngOnInit() {
    // Check if user is logged in
    const user = localStorage.getItem('user');
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }
    this.loadBookings();
    this.updateNotificationCount();
    this.updateRequestNotificationCount();
  }

  ionViewWillEnter() {
    this.loadBookings(); // Reload bookings when page is entered
    this.updateNotificationCount();
    this.updateRequestNotificationCount();
  }

  logout() {
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }

  loadBookings() {
    this.loading = true;
    this.error = null;

    // Debug authentication
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    console.log('=== MY-RENTALS DEBUG ===');
    console.log('Token exists:', !!token);
    console.log('User exists:', !!user);
    console.log('Token value:', token);
    console.log('User value:', user);

    // Check if user is logged in
    if (!token || !user) {
      console.log('No token or user found, redirecting to login');
      this.router.navigate(['/login']);
      return;
    }

    this.apiService.getMyBookings().subscribe({
      next: (data) => {
        console.log('Bookings loaded:', data);
        console.log('Number of bookings:', data.length);
        // Force refresh by creating new array reference
        this.bookings = [...data];
        this.loading = false;
        
        // Log booking dates for debugging
        data.forEach((booking: any, index: number) => {
          console.log(`Booking ${index + 1} (ID: ${booking.id}):`, {
            vehicle: booking.vehicle_name,
            start_date: booking.start_date,
            end_date: booking.end_date,
            rent_time: booking.rent_time,
            status: booking.status
          });
        });
      },
      error: (err) => {
        console.error('Error loading bookings:', err);
        console.error('Error details:', err.error);
        console.error('Error status:', err.status);
        
        // Check if it's an authentication error
        if (err.status === 401) {
          console.log('Authentication error, redirecting to login');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('userInfo');
          this.router.navigate(['/login']);
          return;
        }
        
        this.error = 'Failed to load bookings';
        this.loading = false;
      }
    });
  }

  viewRentalDetails(rentalId: number) {
    this.router.navigate(['/rental-details', rentalId]);
  }

  async cancelRental(rentalId: number) {
    const modal = await this.modalCtrl.create({
      component: AlertModalComponent,
      componentProps: {
        title: 'Cancel Rental',
        message: 'Are you sure you want to cancel this rental?',
        type: 'warning'
      }
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();
    
    if (data?.confirmed) {
      this.apiService.cancelRental(rentalId).subscribe({
        next: () => {
          this.loadBookings(); // Reload the list
        },
        error: (error) => {
          console.error('Error canceling rental:', error);
          // Show error message
          this.modalCtrl.create({
            component: AlertModalComponent,
            componentProps: {
              title: 'Error',
              message: 'Failed to cancel rental. Please try again.',
              type: 'error'
            }
          }).then(modal => modal.present());
        }
      });
    }
  }

  getStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'active':
        return 'success';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'danger';
      case 'completed':
        return 'medium';
      default:
        return 'primary';
    }
  }

  formatDate(date: string): string {
    if (!date || date === '' || date === 'Invalid Date') {
      return 'Invalid Date';
    }
    
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      console.error('Invalid date string:', date);
      return 'Invalid Date';
    }
    
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatTime(time: string): string {
    if (!time || time === '') {
      return '';
    }
    
    // Convert 24-hour format to 12-hour format
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    
    return `${displayHour}:${minutes} ${ampm}`;
  }


  // Navigation methods
  navigateToHome() {
    this.router.navigate(['/dashboard']);
  }

  navigateToNotifications() {
    console.log('Navigating to Notifications...');
    this.router.navigate(['/notifications']);
  }

  navigateToMyRentals() {
    // Already on my rentals page
    console.log('Already on My Rentals page');
  }

  navigateToProfile() {
    this.router.navigate(['/profile']);
  }

  viewTransactionDetails(bookingId: number) {
    this.router.navigate(['/transaction-details', bookingId]);
  }

  // Check if booking needs payment completion
  needsPayment(booking: any): boolean {
    // First check if booking status allows payment (should be Pending or Approved)
    if (booking.status !== 'Pending' && booking.status !== 'Approved') {
      return false;
    }

    // Check payment status from booking table - this is the most reliable source
    const paymentStatus = booking.payment_status;
    
    // If already fully paid, no payment needed
    if (paymentStatus === 'paid') {
      return false;
    }
    
    // Check payments array to calculate actual payment status
    if (booking.payments && Array.isArray(booking.payments) && booking.payments.length > 0) {
      // Calculate total paid amount
      const totalPaid = booking.payments
        .filter((p: any) => p.status === 'paid')
        .reduce((sum: number, p: any) => sum + parseFloat(p.amount || 0), 0);
      
      // Check if there are any pending or failed payments
      const hasPendingOrFailed = booking.payments.some((p: any) => 
        p.status === 'pending' || p.status === 'failed'
      );
      
      // If all payments are paid and we have at least one paid payment, no payment needed
      const allPaid = booking.payments.every((p: any) => p.status === 'paid');
      if (allPaid && totalPaid > 0) {
        // Double-check: if payment_status is also paid, definitely no payment needed
        if (paymentStatus === 'paid') {
          return false;
        }
        // If all payments are paid but status is not 'paid', might be a sync issue
        // Still show button to allow user to check/complete if needed
      }
      
      // Show payment button if:
      // 1. Payment status is explicitly pending/failed/partially_paid, OR
      // 2. There are pending/failed payment records, OR
      // 3. No paid payments exist yet
      if (paymentStatus === 'pending' || paymentStatus === 'failed' || paymentStatus === 'partially_paid') {
        return true;
      }
      
      if (hasPendingOrFailed) {
        return true;
      }
      
      // If no paid payments exist, allow payment
      if (totalPaid === 0) {
        return true;
      }
    } else {
      // No payments array exists - check payment_status
      // Only show if status is explicitly pending/failed/null (not paid)
      if (paymentStatus === 'paid') {
        return false;
      }
      
      // If payment_status is null/undefined/pending/failed, allow payment
      if (!paymentStatus || paymentStatus === 'pending' || paymentStatus === 'failed') {
        return true;
      }
    }
    
    return false;
  }

  // Calculate payment amount needed (helper method - not used in current flow)
  getPaymentAmount(booking: any): number {
    // This is a helper method if needed in the future
    // Currently, we fetch the amount from transaction details API
    return 0;
  }

  // Complete payment for a booking
  async completePayment(booking: any) {
    // First, get the transaction details to calculate the correct amount
    this.apiService.getTransactionDetails(booking.id).subscribe({
      next: (transactionDetails) => {
        console.log('Transaction details:', transactionDetails);
        
        // Get remaining amount from payment_summary (most reliable source)
        let remainingAmount = 0;
        if (transactionDetails.payment_summary) {
          remainingAmount = parseFloat(transactionDetails.payment_summary.remaining_amount) || 0;
        }
        
        // Fallback: calculate from payment_summary if remaining_amount is missing
        if (remainingAmount <= 0 && transactionDetails.payment_summary) {
          const totalCost = parseFloat(transactionDetails.payment_summary.total_cost) || 0;
          const totalPaid = parseFloat(transactionDetails.payment_summary.total_paid) || 0;
          remainingAmount = totalCost - totalPaid;
        }
        
        // Final fallback: use direct fields or calculate from payments array
        if (remainingAmount <= 0) {
          const totalCost = parseFloat(transactionDetails.total_price) || 0;
          if (transactionDetails.payments && Array.isArray(transactionDetails.payments)) {
            const totalPaid = transactionDetails.payments
              .filter((p: any) => p.status === 'paid')
              .reduce((sum: number, p: any) => sum + parseFloat(p.amount || 0), 0);
            remainingAmount = totalCost - totalPaid;
          } else if (totalCost > 0) {
            // If no payments exist, remaining amount is the full cost
            remainingAmount = totalCost;
          }
        }
        
        console.log('Calculated remaining amount:', remainingAmount);
        console.log('Payment status:', transactionDetails.payment_status);
        
        // Check payment status - only show "Payment Not Needed" if status is 'paid' AND remaining is 0
        const paymentStatus = transactionDetails.payment_status || booking.payment_status;
        
        // If payment status is paid and remaining amount is 0 or less, don't allow payment
        if (paymentStatus === 'paid' && remainingAmount <= 0) {
          this.alertCtrl.create({
            header: 'Payment Not Needed',
            message: 'This booking is already fully paid.',
            buttons: ['OK']
          }).then(alert => alert.present());
          return;
        }
        
        // If remaining amount is 0 or negative but status is not paid, there might be a data issue
        // But still allow payment attempt if status indicates payment is needed
        if (remainingAmount <= 0 && paymentStatus !== 'paid') {
          // This shouldn't happen, but if it does, show a helpful message
          console.warn('Remaining amount is 0 but payment status is not paid. Status:', paymentStatus);
          this.alertCtrl.create({
            header: 'Payment Information',
            message: 'Unable to determine payment amount. Please view transaction details or contact support.',
            buttons: ['OK']
          }).then(alert => alert.present());
          return;
        }

        // Show confirmation with the calculated amount
        this.alertCtrl.create({
          header: 'Complete Payment',
          message: `Complete payment of ₱${remainingAmount.toFixed(2)} for Booking #${booking.id}?`,
          buttons: [
            {
              text: 'Cancel',
              role: 'cancel'
            },
            {
              text: 'Proceed to Payment',
              handler: () => {
                this.initiatePayment(booking.id, remainingAmount);
              }
            }
          ]
        }).then(alert => alert.present());
      },
      error: (error) => {
        console.error('Error fetching transaction details:', error);
        this.alertCtrl.create({
          header: 'Error',
          message: 'Unable to fetch payment details. Please try again later.',
          buttons: ['OK']
        }).then(alert => alert.present());
      }
    });
  }

  // Initiate payment process
  initiatePayment(bookingId: number, amount: number) {
    // Show loading
    const loadingAlert = this.alertCtrl.create({
      header: 'Processing Payment',
      message: 'Please wait while we prepare your payment...',
      buttons: []
    });
    
    loadingAlert.then(alert => alert.present());

    // Create payment checkout session
    this.apiService.createPayment(amount, bookingId).subscribe({
      next: (paymentResponse: any) => {
        loadingAlert.then(alert => alert.dismiss());
        
        if (paymentResponse.checkout_url) {
          // Store booking ID for tracking
          sessionStorage.setItem('pendingPaymentBookingId', bookingId.toString());
          
          // Redirect to payment URL
          window.location.href = paymentResponse.checkout_url;
        } else {
          this.alertCtrl.create({
            header: 'Error',
            message: 'Payment URL not received. Please try again.',
            buttons: ['OK']
          }).then(alert => alert.present());
        }
      },
      error: (error: any) => {
        loadingAlert.then(alert => alert.dismiss());
        console.error('Error creating payment:', error);
        
        const errorMessage = error.error?.error || error.error?.message || 'Failed to create payment. Please try again.';
        this.alertCtrl.create({
          header: 'Payment Error',
          message: errorMessage,
          buttons: ['OK']
        }).then(alert => alert.present());
      }
    });
  }

  updateNotificationCount() {
    this.notificationService.updateUnreadCount();
    this.notificationService.unreadCount$.subscribe(count => {
      this.unreadCount = count;
    });
  }

  updateRequestNotificationCount() {
    this.requestNotificationService.updateUnreadCount();
    this.requestNotificationService.unreadCount$.subscribe(count => {
      this.requestUnreadCount = count;
    });
  }

  canRequestReschedule(booking: any): boolean {
    return booking.status === 'Pending' || booking.status === 'Approved';
  }

  canRequestCancellation(booking: any): boolean {
    return booking.status === 'Pending' || booking.status === 'Approved';
  }

  async openRescheduleRequest(booking: any) {
    const modal = await this.modalCtrl.create({
      component: RequestModalComponent,
      componentProps: {
        booking: booking,
        requestType: 'reschedule'
      }
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();
    // Always reload bookings when modal closes to get latest data
    setTimeout(() => {
      this.loadBookings();
    }, 500); // Small delay to ensure backend has processed
  }

  async openCancellationRequest(booking: any) {
    const modal = await this.modalCtrl.create({
      component: RequestModalComponent,
      componentProps: {
        booking: booking,
        requestType: 'cancellation'
      }
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();
    // Always reload bookings when modal closes to get latest data
    setTimeout(() => {
      this.loadBookings();
    }, 500); // Small delay to ensure backend has processed
  }

  navigateToRequests() {
    this.router.navigate(['/booking-requests']);
  }

  doRefresh(event: any) {
    this.loadBookings();
    setTimeout(() => {
      event.target.complete();
    }, 1000);
  }

  getCancelledBookingsCount(): number {
    return this.bookings.filter(b => b.status === 'Cancelled').length;
  }

  async deleteBooking(bookingId: number) {
    const alert = await this.alertCtrl.create({
      header: 'Delete Booking',
      message: 'Are you sure you want to permanently delete this cancelled booking? This action cannot be undone.',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            this.apiService.deleteBooking(bookingId).subscribe({
              next: () => {
                this.loadBookings(); // Reload the list
              },
              error: (error) => {
                console.error('Error deleting booking:', error);
                const errorMessage = error.error?.error || error.error?.details || error.message || 'Failed to delete booking. Please try again.';
                this.alertCtrl.create({
                  header: 'Error',
                  message: errorMessage,
                  buttons: ['OK']
                }).then(alert => alert.present());
              }
            });
          }
        }
      ]
    });
    await alert.present();
  }

  async cleanupCancelledBookings() {
    const cancelledBookings = this.bookings.filter(b => b.status === 'Cancelled');
    if (cancelledBookings.length === 0) {
      return;
    }

    const alert = await this.alertCtrl.create({
      header: 'Clean Up Cancelled Bookings',
      message: `Are you sure you want to permanently delete ${cancelledBookings.length} cancelled booking(s)? This action cannot be undone.`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete All',
          role: 'destructive',
          handler: () => {
            const bookingIds = cancelledBookings.map(b => b.id);
            this.apiService.deleteMultipleBookings(bookingIds).subscribe({
              next: (response) => {
                console.log('Deleted bookings:', response);
                this.loadBookings(); // Reload the list
              },
              error: (error) => {
                console.error('Error deleting bookings:', error);
                this.alertCtrl.create({
                  header: 'Error',
                  message: error.error?.error || 'Failed to delete bookings. Please try again.',
                  buttons: ['OK']
                }).then(alert => alert.present());
              }
            });
          }
        }
      ]
    });
    await alert.present();
  }
} 