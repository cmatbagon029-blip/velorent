import { Component, OnInit } from '@angular/core';
import { IonicModule, ModalController, AlertController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../api.service';
import { NotificationService } from '../services/notification.service';
import { AlertModalComponent } from '../components/alert-modal/alert-modal.component';
import { Rental } from '../../models/rental.model';
import { addIcons } from 'ionicons';
import { 
  home, 
  searchOutline, 
  carOutline, 
  personOutline,
  notificationsOutline
} from 'ionicons/icons';

// Register icons
addIcons({ 
  home, 
  'search-outline': searchOutline, 
  'car-outline': carOutline, 
  'person-outline': personOutline,
  'notifications-outline': notificationsOutline
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

  constructor(
    private router: Router,
    private modalCtrl: ModalController,
    private alertCtrl: AlertController,
    private apiService: ApiService,
    private notificationService: NotificationService
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
  }

  ionViewWillEnter() {
    this.updateNotificationCount();
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
        this.bookings = data;
        this.loading = false;
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
} 