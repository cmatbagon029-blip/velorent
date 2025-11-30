import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController, AlertController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { BookingRequestService, BookingRequest, FeeComputation } from '../../services/booking-request.service';
import { CompanyTermsComponent } from '../company-terms/company-terms.component';

@Component({
  selector: 'app-request-modal',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, CompanyTermsComponent],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ requestType === 'reschedule' ? 'Request Reschedule' : 'Request Cancellation' }}</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="dismiss()">
            <ion-icon name="close"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <!-- Company Terms -->
      <app-company-terms [companyId]="booking.company_id"></app-company-terms>

      <!-- Booking Info -->
      <ion-card>
        <ion-card-header>
          <ion-card-title>Booking Details</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <p><strong>Vehicle:</strong> {{ booking.vehicle_name }}</p>
          <p><strong>Date:</strong> {{ formatDate(booking.start_date) }} - {{ formatDate(booking.end_date) }}</p>
          <p><strong>Time:</strong> {{ formatTime(booking.rent_time) }}</p>
        </ion-card-content>
      </ion-card>

      <!-- Reschedule Form -->
      <ion-card *ngIf="requestType === 'reschedule'">
        <ion-card-header>
          <ion-card-title>New Booking Details</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <ion-item>
            <ion-label position="stacked">New Start Date *</ion-label>
            <ion-input type="date" [(ngModel)]="newStartDate" (ionChange)="onDateChange()"></ion-input>
          </ion-item>

          <ion-item>
            <ion-label position="stacked">New End Date *</ion-label>
            <ion-input type="date" [(ngModel)]="newEndDate"></ion-input>
          </ion-item>

          <ion-item>
            <ion-label position="stacked">New Time</ion-label>
            <ion-input type="time" [(ngModel)]="newRentTime"></ion-input>
          </ion-item>
        </ion-card-content>
      </ion-card>

      <!-- Fee Information -->
      <ion-card *ngIf="feeComputation || computingFee">
        <ion-card-header>
          <ion-card-title>Fee Information</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <div class="fee-display" *ngIf="computingFee">
            <ion-spinner name="crescent"></ion-spinner>
            <p>Computing fee...</p>
          </div>
          <div class="fee-display" *ngIf="feeComputation && !computingFee">
            <h3>Computed Fee: {{ feeComputation.computed_fee }}%</h3>
            <p>{{ feeComputation.fee_details.reason }}</p>
          </div>
        </ion-card-content>
      </ion-card>

      <!-- Reason -->
      <ion-card>
        <ion-card-header>
          <ion-card-title>Reason *</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <ion-textarea
            [(ngModel)]="reason"
            placeholder="Please provide a reason for your request..."
            rows="4"
            required
          ></ion-textarea>
        </ion-card-content>
      </ion-card>

      <!-- Error Message -->
      <ion-item *ngIf="error" color="danger">
        <ion-label>
          <h3>Error</h3>
          <p>{{ error }}</p>
        </ion-label>
      </ion-item>
    </ion-content>

    <ion-footer>
      <ion-toolbar>
        <ion-button expand="block" (click)="submitRequest()" [disabled]="!canSubmit() || submitting">
          <ion-spinner *ngIf="submitting" name="crescent"></ion-spinner>
          <span *ngIf="!submitting">Submit Request</span>
        </ion-button>
      </ion-toolbar>
    </ion-footer>
  `,
  styles: [`
    // Premium Gold & Black Theme
    :host {
      --background: #0A0A0A;
    }

    ion-header {
      --background: #0A0A0A;
      background: #0A0A0A !important;
    }

    ion-toolbar {
      --background: #0A0A0A;
      background: #0A0A0A !important;
    }

    ion-title {
      color: #D4AF37 !important;
      font-weight: 600;
    }

    ion-content {
      --background: #0A0A0A;
      background: #0A0A0A !important;
    }

    ion-card {
      --background: #1B1B1B;
      background: #1B1B1B !important;
      border-radius: 18px;
      border: 1px solid #2A2A2A;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
      margin-bottom: 16px;
    }

    ion-card-header {
      padding-bottom: 12px;
    }

    ion-card-title {
      color: #D4AF37 !important;
      font-weight: 600;
      font-size: 1.2em;
    }

    ion-card-content {
      color: #EDEDED;
    }

    ion-card-content p {
      color: #EDEDED;
      margin: 8px 0;
    }

    ion-card-content p strong {
      color: #D4AF37;
      font-weight: 500;
    }

    ion-item {
      --background: #1B1B1B;
      --color: #EDEDED;
      --border-color: rgba(212, 175, 55, 0.2);
      margin-bottom: 12px;
      border-radius: 12px;
    }

    ion-label {
      color: #D4AF37 !important;
      font-weight: 500;
    }

    ion-input,
    ion-textarea {
      --color: #EDEDED;
      --placeholder-color: #9E9E9E;
      --background: #0A0A0A;
      border-radius: 12px;
      padding: 8px;
    }

    ion-textarea {
      min-height: 100px;
      line-height: 1.5;
    }

    .fee-display {
      padding: 16px;
      background: rgba(212, 175, 55, 0.15);
      border-radius: 12px;
      border: 1px solid rgba(212, 175, 55, 0.4);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
    }

    .fee-display h3 {
      margin: 0 0 8px 0;
      color: #D4AF37;
      font-weight: 600;
    }

    .fee-display p {
      margin: 0;
      color: #EDEDED;
    }

    .fee-display ion-spinner {
      --color: #D4AF37;
    }

    ion-button {
      --background: linear-gradient(180deg, #F4D57B 0%, #D4AF37 50%, #A87C1C 100%);
      --color: #000000;
      font-weight: 600;
      border-radius: 18px;
      margin-top: 10px;
    }

    ion-button[disabled] {
      --background: #444;
      --color: #9E9E9E;
      opacity: 0.6;
    }

    ion-footer {
      --background: #0A0A0A;
      background: #0A0A0A !important;
      border-top: 1px solid #2A2A2A;
    }

    ion-footer ion-toolbar {
      --background: #0A0A0A;
      background: #0A0A0A !important;
    }

    // Error message styling
    ion-item[color="danger"] {
      --background: rgba(239, 68, 68, 0.15);
      --border-color: rgba(239, 68, 68, 0.3);
      border-radius: 12px;
    }

    ion-item[color="danger"] ion-label h3 {
      color: #ef4444;
    }

    ion-item[color="danger"] ion-label p {
      color: #EDEDED;
    }

    // Close button
    ion-button[slot="end"] {
      --color: #D4AF37;
    }

    // Spinner
    ion-spinner {
      --color: #D4AF37;
    }
  `]
})
export class RequestModalComponent implements OnInit {
  @Input() booking: any;
  @Input() requestType: 'reschedule' | 'cancellation' = 'reschedule';

  newStartDate: string = '';
  newEndDate: string = '';
  newRentTime: string = '';
  reason: string = '';
  feeComputation: FeeComputation | null = null;
  submitting = false;
  error: string | null = null;

  constructor(
    private modalController: ModalController,
    private alertController: AlertController,
    private bookingRequestService: BookingRequestService
  ) {}

  computingFee = false;
  private feeComputeTimeout: any = null;

  ngOnInit() {
    // Don't compute fee on init for reschedule - wait for user to select a date
    // Only compute for cancellation immediately
    if (this.requestType === 'cancellation') {
      this.computeFee();
    }
  }

  onDateChange() {
    if (this.requestType === 'reschedule' && this.newStartDate) {
      // Clear any existing timeout
      if (this.feeComputeTimeout) {
        clearTimeout(this.feeComputeTimeout);
      }
      // Add a small delay to debounce rapid date changes
      this.feeComputeTimeout = setTimeout(() => {
        if (this.newStartDate) {
          this.computeFee();
        }
        this.feeComputeTimeout = null;
      }, 300);
    }
  }

  computeFee() {
    if (!this.booking || !this.booking.id) return;
    
    // Prevent multiple simultaneous fee computations
    if (this.computingFee) return;
    
    // For reschedule, require a date before computing
    if (this.requestType === 'reschedule' && !this.newStartDate) {
      this.feeComputation = null;
      return;
    }

    this.computingFee = true;
    this.bookingRequestService.computeFee(
      this.booking.id,
      this.requestType,
      this.newStartDate || undefined
    ).subscribe({
      next: (computation) => {
        this.feeComputation = computation;
        this.computingFee = false;
      },
      error: (err) => {
        console.error('Error computing fee:', err);
        this.computingFee = false;
        // Don't show error to user, just log it
      }
    });
  }

  canSubmit(): boolean {
    if (!this.reason || this.reason.trim().length === 0) {
      return false;
    }

    if (this.requestType === 'reschedule') {
      return !!(this.newStartDate && this.newEndDate);
    }

    return true;
  }

  async submitRequest() {
    if (!this.canSubmit()) {
      return;
    }

    this.submitting = true;
    this.error = null;

    const requestData: Partial<BookingRequest> = {
      booking_id: this.booking.id,
      request_type: this.requestType,
      reason: this.reason,
      new_start_date: this.requestType === 'reschedule' ? this.newStartDate : undefined,
      new_end_date: this.requestType === 'reschedule' ? this.newEndDate : undefined,
      new_rent_time: this.requestType === 'reschedule' ? this.newRentTime : undefined
    };

    this.bookingRequestService.createRequest(requestData).subscribe({
      next: async (request) => {
        this.submitting = false;
        const alert = await this.alertController.create({
          header: 'Request Submitted',
          message: `Your ${this.requestType} request has been submitted successfully and is pending approval.`,
          buttons: ['OK']
        });
        await alert.present();
        this.dismiss(true);
      },
      error: async (err) => {
        this.submitting = false;
        console.error('Request submission error:', err);
        console.error('Error details:', err.error);
        
        // Extract error message
        let errorMessage = 'Failed to submit request';
        if (err.error) {
          if (typeof err.error === 'string') {
            errorMessage = err.error;
          } else if (err.error.error) {
            errorMessage = err.error.error;
          } else if (err.error.message) {
            errorMessage = err.error.message;
          } else if (err.error.details) {
            errorMessage = `${err.error.error || 'Error'}: ${err.error.details}`;
          }
        } else if (err.message) {
          errorMessage = err.message;
        }
        
        this.error = errorMessage;
        const alert = await this.alertController.create({
          header: 'Error',
          message: errorMessage,
          buttons: ['OK']
        });
        await alert.present();
      }
    });
  }

  formatDate(date: string): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatTime(time: string): string {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  }

  dismiss(success: boolean = false) {
    this.modalController.dismiss(success);
  }
}

