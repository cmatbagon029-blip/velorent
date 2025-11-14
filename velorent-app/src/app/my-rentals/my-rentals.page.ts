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
  trashOutline
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
  'trash-outline': trashOutline
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