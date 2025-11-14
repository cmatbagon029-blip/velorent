import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { BookingRequestService, BookingRequest } from './booking-request.service';

@Injectable({
  providedIn: 'root'
})
export class RequestNotificationService {
  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();
  private previousRequestStatuses: Map<number, string> = new Map();

  constructor(private bookingRequestService: BookingRequestService) {
    this.loadPreviousStatuses();
  }

  loadPreviousStatuses() {
    const stored = localStorage.getItem('requestStatuses');
    if (stored) {
      try {
        const statusArray = JSON.parse(stored) as [number, string][];
        this.previousRequestStatuses = new Map<number, string>(statusArray);
      } catch (e) {
        console.error('Error loading previous request statuses:', e);
      }
    }
  }

  savePreviousStatuses() {
    const statusArray = Array.from(this.previousRequestStatuses.entries());
    localStorage.setItem('requestStatuses', JSON.stringify(statusArray));
  }

  updateUnreadCount() {
    console.log('RequestNotificationService: Updating unread count...');
    this.bookingRequestService.getMyRequests().subscribe({
      next: (requests) => {
        console.log('RequestNotificationService: Received requests:', requests);
        let unreadCount = 0;
        
        requests.forEach(request => {
          if (!request.id) return;
          
          const previousStatus = this.previousRequestStatuses.get(request.id);
          const currentStatus = request.status;
          
          // Check if status changed to approved or rejected (new response)
          if (previousStatus && previousStatus !== currentStatus && 
              (currentStatus === 'approved' || currentStatus === 'rejected')) {
            // Check if user has seen this status change
            const seenKey = `request_seen_${request.id}_${currentStatus}`;
            const hasSeen = localStorage.getItem(seenKey) === 'true';
            
            if (!hasSeen) {
              unreadCount++;
              console.log('Found unread request status change for request:', request.id);
            }
          }
          
          // Update the stored status
          this.previousRequestStatuses.set(request.id, currentStatus);
        });
        
        this.savePreviousStatuses();
        console.log('RequestNotificationService: Total unread count:', unreadCount);
        this.unreadCountSubject.next(unreadCount);
      },
      error: (error) => {
        console.error('RequestNotificationService: Error updating unread count:', error);
      }
    });
  }

  markRequestAsSeen(requestId: number, status: string) {
    const seenKey = `request_seen_${requestId}_${status}`;
    localStorage.setItem(seenKey, 'true');
    this.updateUnreadCount(); // Refresh count
  }

  markAllAsSeen() {
    // Mark all current status changes as seen
    this.bookingRequestService.getMyRequests().subscribe({
      next: (requests) => {
        requests.forEach(request => {
          if (request.id && (request.status === 'approved' || request.status === 'rejected')) {
            const seenKey = `request_seen_${request.id}_${request.status}`;
            localStorage.setItem(seenKey, 'true');
          }
        });
        this.updateUnreadCount();
      }
    });
  }

  getUnreadCount(): number {
    return this.unreadCountSubject.value;
  }
}

