import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ApiService } from '../api.service';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();

  constructor(private apiService: ApiService) {}

  updateUnreadCount() {
    console.log('NotificationService: Updating unread count...');
    this.apiService.getMyBookings().subscribe({
      next: (bookings) => {
        console.log('NotificationService: Received bookings:', bookings);
        let unreadCount = 0;
        
        bookings.forEach(booking => {
          console.log('Checking booking:', {
            id: booking.id,
            company_message: booking.company_message,
            notification_sent: booking.notification_sent,
            hasMessage: !!booking.company_message,
            isUnread: booking.notification_sent !== 1
          });
          
          if (booking.company_message && booking.notification_sent !== 1) {
            unreadCount++;
            console.log('Found unread message for booking:', booking.id);
          }
        });
        
        console.log('NotificationService: Total unread count:', unreadCount);
        this.unreadCountSubject.next(unreadCount);
      },
      error: (error) => {
        console.error('NotificationService: Error updating unread count:', error);
      }
    });
  }

  getUnreadCount(): number {
    return this.unreadCountSubject.value;
  }
}
