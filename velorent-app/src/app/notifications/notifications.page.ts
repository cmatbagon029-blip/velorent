import { Component, OnInit } from '@angular/core';
import { IonicModule, AlertController, ModalController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../api.service';
import { NotificationService } from '../services/notification.service';
import { addIcons } from 'ionicons';
import { 
  home, 
  carOutline, 
  personOutline,
  notificationsOutline,
  chatbubbleOutline,
  checkmarkCircleOutline,
  informationCircleOutline,
  warningOutline,
  timeOutline,
  businessOutline,
  closeOutline
} from 'ionicons/icons';

// Register icons
addIcons({ 
  home, 
  'car-outline': carOutline, 
  'person-outline': personOutline,
  'notifications-outline': notificationsOutline,
  'chatbubble-outline': chatbubbleOutline,
  'checkmark-circle-outline': checkmarkCircleOutline,
  'information-circle-outline': informationCircleOutline,
  'warning-outline': warningOutline,
  'time-outline': timeOutline,
  'business-outline': businessOutline,
  'close-outline': closeOutline
});

interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'booking';
  timestamp: Date;
  read: boolean;
  companyName?: string;
  bookingId?: string;
}

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [IonicModule, CommonModule, RouterModule],
  templateUrl: './notifications.page.html',
  styleUrls: ['./notifications.page.scss']
})
export class NotificationsPage implements OnInit {
  notifications: Notification[] = [];
  loading = true;

  constructor(
    private router: Router,
    private alertCtrl: AlertController,
    private modalCtrl: ModalController,
    private apiService: ApiService,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    this.loadNotifications();
  }

  loadNotifications() {
    this.loading = true;
    this.apiService.getMyBookings().subscribe({
      next: (bookings) => {
        this.notifications = [];
        
        // Convert company messages to notifications
        bookings.forEach(booking => {
          if (booking.company_message) {
            // Clean up the message - remove any formatting issues
            let cleanMessage = booking.company_message.trim();
            
            // Remove common formatting artifacts like "h [Admin Remarks]: ll"
            cleanMessage = cleanMessage.replace(/^h\s*\[Admin Remarks\]:\s*ll\s*/i, '');
            cleanMessage = cleanMessage.replace(/\[Admin Remarks\]:\s*/gi, '');
            
            // Only add if there's actual content
            if (cleanMessage && cleanMessage.length > 0) {
              this.notifications.push({
                id: booking.id,
                title: `Message from ${booking.company_name || 'Company'}`,
                message: cleanMessage,
                type: 'booking',
                timestamp: new Date(booking.message_sent_at || booking.booking_date),
                read: booking.notification_sent === 1,
                companyName: booking.company_name,
                bookingId: booking.id.toString()
              });
            }
          }
        });
        
        // Sort by timestamp (newest first)
        this.notifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        
        this.loading = false;
        console.log('Loaded notifications:', this.notifications);
      },
      error: (error) => {
        console.error('Error loading notifications:', error);
        this.loading = false;
      }
    });
  }

  markAsRead(notification: Notification) {
    notification.read = true;
    // Update the notification_sent status in backend
    this.apiService.markNotificationAsRead(notification.id).subscribe({
      next: () => {
        console.log('Notification marked as read');
        this.notificationService.updateUnreadCount();
      },
      error: (error) => {
        console.error('Error marking notification as read:', error);
      }
    });
  }

  markAllAsRead() {
    this.notifications.forEach(notification => {
      notification.read = true;
      // Update each notification in backend
      this.apiService.markNotificationAsRead(notification.id).subscribe({
        next: () => {
          console.log('All notifications marked as read');
        },
        error: (error) => {
          console.error('Error marking notifications as read:', error);
        }
      });
    });
    this.notificationService.updateUnreadCount();
  }

  deleteNotification(notification: Notification) {
    this.notifications = this.notifications.filter(n => n.id !== notification.id);
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'success':
        return 'checkmark-circle-outline';
      case 'warning':
        return 'warning-outline';
      case 'booking':
        return 'car-outline';
      default:
        return 'information-circle-outline';
    }
  }

  getNotificationColor(type: string): string {
    switch (type) {
      case 'success':
        return 'success';
      case 'warning':
        return 'warning';
      case 'booking':
        return 'primary';
      default:
        return 'medium';
    }
  }

  formatTimestamp(timestamp: Date): string {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) {
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else {
      return `${days}d ago`;
    }
  }

  getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  openChat() {
    console.log('Navigating to Chat...');
    this.router.navigate(['/chat']);
  }

  // Navigation methods
  navigateToHome() {
    this.router.navigate(['/dashboard']);
  }

  navigateToMyRentals() {
    const user = localStorage.getItem('user');
    if (user) {
      this.router.navigate(['/my-rentals']);
    } else {
      this.showLoginAlert();
    }
  }

  navigateToRequests() {
    const user = localStorage.getItem('user');
    if (user) {
      this.router.navigate(['/booking-requests']);
    } else {
      this.showLoginAlert();
    }
  }

  navigateToNotifications() {
    console.log('Already on Notifications page');
  }

  navigateToProfile() {
    this.router.navigate(['/profile']);
  }

  private async showLoginAlert() {
    const alert = await this.alertCtrl.create({
      header: 'Login Required',
      message: 'Please log in to view your rentals.',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Login',
          handler: () => {
            this.router.navigate(['/login']);
          }
        }
      ]
    });
    await alert.present();
  }
}
