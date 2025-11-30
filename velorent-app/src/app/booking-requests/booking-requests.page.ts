import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { BookingRequestService, BookingRequest } from '../services/booking-request.service';
import { RequestNotificationService } from '../services/request-notification.service';
import { NotificationService } from '../services/notification.service';
import { addIcons } from 'ionicons';
import { 
  home,
  carOutline,
  documentTextOutline,
  notificationsOutline,
  personOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  timeOutline,
  closeOutline,
  trashOutline
} from 'ionicons/icons';

// Register icons
addIcons({ 
  home,
  'car-outline': carOutline,
  'document-text-outline': documentTextOutline,
  'notifications-outline': notificationsOutline,
  'person-outline': personOutline,
  'checkmark-circle-outline': checkmarkCircleOutline,
  'close-circle-outline': closeCircleOutline,
  'time-outline': timeOutline,
  'close-outline': closeOutline,
  'trash-outline': trashOutline
});

interface RequestNotification {
  id: number;
  requestId: number;
  status: 'approved' | 'rejected';
  message: string;
  timestamp: Date;
  read: boolean;
}

@Component({
  selector: 'app-booking-requests',
  standalone: true,
  imports: [CommonModule, IonicModule, RouterModule, FormsModule],
  templateUrl: './booking-requests.page.html',
  styleUrls: ['./booking-requests.page.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class BookingRequestsPage implements OnInit {
  requests: BookingRequest[] = [];
  loading = true;
  error: string | null = null;
  filterStatus: 'all' | 'pending' | 'approved' | 'rejected' = 'all';
  notifications: RequestNotification[] = [];
  previousRequestStatuses: Map<number, string> = new Map();
  unreadCount: number = 0;
  requestUnreadCount: number = 0;

  constructor(
    private router: Router,
    private bookingRequestService: BookingRequestService,
    private requestNotificationService: RequestNotificationService,
    private notificationService: NotificationService,
    private alertCtrl: AlertController
  ) {}

  ngOnInit() {
    this.loadPreviousStatuses();
    this.loadRequests();
    // Update the global notification count
    this.requestNotificationService.updateUnreadCount();
    this.notificationService.updateUnreadCount();
    
    // Subscribe to notification counts
    this.notificationService.unreadCount$.subscribe(count => {
      this.unreadCount = count;
    });
    
    this.requestNotificationService.unreadCount$.subscribe(count => {
      this.requestUnreadCount = count;
    });
  }

  ionViewWillEnter() {
    this.loadRequests(); // Reload requests when page is entered
    // Update the global notification count
    this.requestNotificationService.updateUnreadCount();
    this.notificationService.updateUnreadCount();
  }

  loadPreviousStatuses() {
    const stored = localStorage.getItem('requestStatuses');
    if (stored) {
      try {
        const statusArray = JSON.parse(stored) as [number, string][];
        this.previousRequestStatuses = new Map<number, string>(statusArray);
      } catch (e) {
        console.error('Error loading previous statuses:', e);
      }
    }
  }

  savePreviousStatuses() {
    const statusArray = Array.from(this.previousRequestStatuses.entries());
    localStorage.setItem('requestStatuses', JSON.stringify(statusArray));
  }

  loadRequests() {
    this.loading = true;
    this.error = null;

    this.bookingRequestService.getMyRequests().subscribe({
      next: (requests) => {
        // Extract admin remarks from reason field if company_remarks is not set
        this.requests = requests.map(request => {
          if (request.reason && !request.company_remarks) {
            const adminRemarks = this.extractAdminRemarks(request.reason);
            if (adminRemarks) {
              request.company_remarks = adminRemarks;
              // Clean the reason field
              request.reason = this.cleanReasonText(request.reason);
            }
          }
          return request;
        });
        this.checkForStatusChanges(this.requests);
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading requests:', err);
        this.error = 'Failed to load requests';
        this.loading = false;
      }
    });
  }

  checkForStatusChanges(requests: BookingRequest[]) {
    const newNotifications: RequestNotification[] = [];
    
    requests.forEach(request => {
      // Skip if request doesn't have an ID
      if (!request.id) {
        return;
      }
      
      const previousStatus = this.previousRequestStatuses.get(request.id);
      const currentStatus = request.status;
      
      // Check if status changed to approved or rejected
      if (previousStatus && previousStatus !== currentStatus && 
          (currentStatus === 'approved' || currentStatus === 'rejected')) {
        
        const timestamp = request.updated_at || request.created_at || new Date().toISOString();
        
        const notification: RequestNotification = {
          id: Date.now() + request.id, // Unique ID
          requestId: request.id,
          status: currentStatus,
          message: currentStatus === 'approved' 
            ? `Your ${request.request_type} request for ${request.vehicle_name || 'vehicle'} has been approved!`
            : `Your ${request.request_type} request for ${request.vehicle_name || 'vehicle'} has been rejected.`,
          timestamp: new Date(timestamp),
          read: false
        };
        
        newNotifications.push(notification);
      }
      
      // Update the stored status
      this.previousRequestStatuses.set(request.id, currentStatus);
    });
    
    // Add new notifications to the list
    if (newNotifications.length > 0) {
      this.notifications = [...newNotifications, ...this.notifications];
      this.savePreviousStatuses();
    }
  }

  getUnreadNotificationCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  markNotificationAsRead(notification: RequestNotification) {
    notification.read = true;
    // Mark as seen in the global service
    this.requestNotificationService.markRequestAsSeen(notification.requestId, notification.status);
  }

  dismissNotification(notification: RequestNotification) {
    this.notifications = this.notifications.filter(n => n.id !== notification.id);
  }

  dismissAllNotifications() {
    this.notifications = [];
  }

  getNotificationIcon(status: string): string {
    return status === 'approved' ? 'checkmark-circle-outline' : 'close-circle-outline';
  }

  getNotificationColor(status: string): string {
    return status === 'approved' ? 'success' : 'danger';
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

  hasNewStatus(requestId: number | undefined): boolean {
    if (!requestId) return false;
    return this.notifications.some(n => n.requestId === requestId && !n.read);
  }

  scrollToRequest(requestId: number) {
    // Scroll to the request card
    const element = document.querySelector(`[data-request-id="${requestId}"]`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Highlight the card briefly
      element.classList.add('highlight');
      setTimeout(() => {
        element.classList.remove('highlight');
      }, 2000);
      
      // Find the request and mark it as seen
      const request = this.requests.find(r => r.id === requestId);
      if (request && (request.status === 'approved' || request.status === 'rejected')) {
        this.requestNotificationService.markRequestAsSeen(requestId, request.status);
      }
    }
  }

  getFilteredRequests(): BookingRequest[] {
    if (this.filterStatus === 'all') {
      return this.requests;
    }
    return this.requests.filter(r => r.status === this.filterStatus);
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'danger';
      case 'pending':
        return 'warning';
      default:
        return 'medium';
    }
  }

  getRequestTypeIcon(type: string): string {
    return type === 'reschedule' ? 'calendar-outline' : 'close-circle-outline';
  }

  formatDate(date: string | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatTime(time: string | undefined): string {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  }

  cleanReasonText(reason: string | undefined): string {
    if (!reason) return 'No reason provided';
    
    // Remove admin remarks from reason (they should be displayed separately)
    let cleaned = reason.trim();
    
    // Remove patterns like "sa [Admin Remarks]: a" or similar corrupted text
    cleaned = cleaned.replace(/^[a-z]+\s*\[Admin Remarks\]:\s*[a-z]\s*/i, '');
    // Remove [Admin Remarks]: pattern and everything after it
    cleaned = cleaned.replace(/\[Admin Remarks\]:\s*.+$/gi, '');
    cleaned = cleaned.replace(/\[Admin Remarks\]:\s*/gi, '');
    
    // Remove any leading/trailing whitespace and single character artifacts
    cleaned = cleaned.trim();
    
    // If the cleaned text is too short or seems corrupted, return original
    if (cleaned.length < 2) {
      return reason.trim();
    }
    
    return cleaned;
  }

  extractAdminRemarks(reason: string | undefined): string | null {
    if (!reason) return null;
    
    // Pattern to match [Admin Remarks]: content (captures everything after the colon)
    const adminRemarksMatch = reason.match(/\[Admin Remarks\]:\s*(.+)$/is);
    
    if (adminRemarksMatch) {
      // Extract admin remarks (everything after [Admin Remarks]:)
      return adminRemarksMatch[1].trim();
    }
    
    return null;
  }

  navigateToHome() {
    this.router.navigate(['/dashboard']);
  }

  navigateToMyRentals() {
    this.router.navigate(['/my-rentals']);
  }

  navigateToRequests() {
    // Already on requests page
    console.log('Already on Requests page');
  }

  navigateToNotifications() {
    this.router.navigate(['/notifications']);
  }

  navigateToProfile() {
    this.router.navigate(['/profile']);
  }

  getCompletedRequestsCount(): number {
    return this.requests.filter(r => r.status === 'approved' || r.status === 'rejected').length;
  }

  async deleteRequest(requestId: number | undefined) {
    if (!requestId) return;

    const alert = await this.alertCtrl.create({
      header: 'Delete Request',
      message: 'Are you sure you want to permanently delete this request? This action cannot be undone.',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            this.bookingRequestService.deleteRequest(requestId).subscribe({
              next: () => {
                this.loadRequests(); // Reload the list
                this.requestNotificationService.updateUnreadCount(); // Update notification count
              },
              error: (error) => {
                console.error('Error deleting request:', error);
                const errorMessage = error.error?.error || error.error?.details || error.message || 'Failed to delete request. Please try again.';
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

  async cleanupCompletedRequests() {
    const completedRequests = this.requests.filter(r => r.status === 'approved' || r.status === 'rejected');
    if (completedRequests.length === 0) {
      return;
    }

    const alert = await this.alertCtrl.create({
      header: 'Clean Up Completed Requests',
      message: `Are you sure you want to permanently delete ${completedRequests.length} completed request(s)? This action cannot be undone.`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete All',
          role: 'destructive',
          handler: () => {
            const requestIds = completedRequests.map(r => r.id).filter((id): id is number => id !== undefined);
            if (requestIds.length === 0) return;

            this.bookingRequestService.deleteMultipleRequests(requestIds).subscribe({
              next: (response) => {
                console.log('Deleted requests:', response);
                this.loadRequests(); // Reload the list
                this.requestNotificationService.updateUnreadCount(); // Update notification count
              },
              error: (error) => {
                console.error('Error deleting requests:', error);
                this.alertCtrl.create({
                  header: 'Error',
                  message: error.error?.error || 'Failed to delete requests. Please try again.',
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

