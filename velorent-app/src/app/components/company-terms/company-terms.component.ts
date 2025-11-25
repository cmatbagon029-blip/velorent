import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { BookingRequestService, CompanyPolicy } from '../../services/booking-request.service';

@Component({
  selector: 'app-company-terms',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <div class="terms-container" *ngIf="policy">
      <ion-card>
        <ion-card-header>
          <ion-card-title>Company Terms & Policies</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <!-- Reschedule Terms -->
          <div class="terms-section" *ngIf="policy.allow_reschedule">
            <h3>
              <ion-icon name="calendar-outline"></ion-icon>
              Reschedule Terms
            </h3>
            <div [innerHTML]="sanitizedRescheduleTerms"></div>
            <div class="terms-highlight">
              <ion-icon name="information-circle-outline"></ion-icon>
              <span>Free reschedule if requested at least {{ policy.reschedule_free_days }} days before booking</span>
            </div>
          </div>

          <!-- Cancellation Terms -->
          <div class="terms-section" *ngIf="policy.allow_cancellation">
            <h3>
              <ion-icon name="close-circle-outline"></ion-icon>
              Cancellation Terms
            </h3>
            <div [innerHTML]="sanitizedCancellationTerms"></div>
            <div class="terms-highlight">
              <ion-icon name="information-circle-outline"></ion-icon>
              <span>Cancellation fee: {{ policy.cancellation_fee_percentage }}%</span>
            </div>
          </div>

          <!-- Refund Terms -->
          <div class="terms-section">
            <h3>
              <ion-icon name="cash-outline"></ion-icon>
              Refund Terms
            </h3>
            <div [innerHTML]="sanitizedRefundTerms"></div>
            <div class="terms-highlight" *ngIf="!policy.deposit_refundable">
              <ion-icon name="warning-outline" color="warning"></ion-icon>
              <span>Deposits and reservation fees are non-refundable</span>
            </div>
            <div class="terms-highlight" *ngIf="policy.deposit_refundable">
              <ion-icon name="checkmark-circle-outline" color="success"></ion-icon>
              <span>Deposits are refundable</span>
            </div>
          </div>
        </ion-card-content>
      </ion-card>
    </div>

    <div *ngIf="loading" class="loading-container">
      <ion-spinner></ion-spinner>
      <p>Loading terms...</p>
    </div>

    <div *ngIf="error" class="error-container">
      <ion-icon name="alert-circle-outline"></ion-icon>
      <p>{{ error }}</p>
    </div>
  `,
  styles: [`
    // Black and Gold Theme
    .terms-container {
      margin: 16px 0;
    }

    ion-card {
      --background: #1e1e1e;
      background: #1e1e1e !important;
      border-radius: 16px;
      box-shadow: 0 4px 16px 0 rgba(255, 215, 0, 0.12);
    }

    ion-card-header {
      padding-bottom: 12px;
    }

    ion-card-title {
      color: #ffd700 !important;
      font-weight: 600;
      font-size: 1.2em;
    }

    ion-card-content {
      color: #fff;
    }

    .terms-section {
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid rgba(255, 215, 0, 0.2);
    }

    .terms-section:last-child {
      border-bottom: none;
    }

    .terms-section h3 {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 1.1em;
      font-weight: 600;
      margin-bottom: 12px;
      color: #ffd700;
    }

    .terms-section h3 ion-icon {
      color: #ffd700;
    }

    .terms-section p {
      margin-bottom: 12px;
      line-height: 1.6;
      color: #fff;
    }

    .terms-section div[innerHTML] {
      margin-bottom: 12px;
      line-height: 1.6;
      color: #fff;
    }

    .terms-section div[innerHTML] p {
      margin-bottom: 8px;
      line-height: 1.6;
      color: #fff;
    }

    .terms-section div[innerHTML] strong {
      color: #ffd700;
      font-weight: 600;
    }

    .terms-section div[innerHTML] ul,
    .terms-section div[innerHTML] ol {
      margin: 8px 0;
      padding-left: 24px;
      color: #fff;
    }

    .terms-section div[innerHTML] li {
      margin-bottom: 4px;
      line-height: 1.6;
      color: #fff;
    }

    .terms-highlight {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      background: rgba(255, 215, 0, 0.1);
      border-radius: 8px;
      margin-top: 8px;
      border: 1px solid rgba(255, 215, 0, 0.3);
    }

    .terms-highlight ion-icon {
      font-size: 1.2em;
      color: #ffd700;
    }

    .terms-highlight span {
      color: #fff;
    }

    .terms-highlight[color="warning"] {
      background: rgba(255, 215, 0, 0.15);
      border-color: rgba(255, 215, 0, 0.4);
    }

    .terms-highlight[color="success"] {
      background: rgba(34, 197, 94, 0.15);
      border-color: rgba(34, 197, 94, 0.3);
    }

    .terms-highlight[color="success"] ion-icon {
      color: #22c55e;
    }

    .loading-container,
    .error-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 32px;
      text-align: center;
    }

    .loading-container p {
      color: #ffd700;
      margin-top: 16px;
    }

    ion-spinner {
      --color: #ffd700;
    }

    .error-container ion-icon {
      font-size: 3em;
      margin-bottom: 16px;
      color: #ffd700;
    }

    .error-container p {
      color: #ffd700;
    }
  `]
})
export class CompanyTermsComponent implements OnInit {
  @Input() companyId!: number;
  policy: CompanyPolicy | null = null;
  loading = false;
  error: string | null = null;
  
  // Cached sanitized HTML to prevent infinite change detection
  sanitizedRescheduleTerms: SafeHtml = '';
  sanitizedCancellationTerms: SafeHtml = '';
  sanitizedRefundTerms: SafeHtml = '';

  constructor(
    private bookingRequestService: BookingRequestService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit() {
    if (this.companyId) {
      this.loadPolicy();
    }
  }

  loadPolicy() {
    this.loading = true;
    this.error = null;
    this.bookingRequestService.getCompanyPolicies(this.companyId).subscribe({
      next: (policy) => {
        this.policy = policy;
        // Cache sanitized HTML once when policy loads
        this.sanitizedRescheduleTerms = this.sanitizeHtml(policy.reschedule_terms);
        this.sanitizedCancellationTerms = this.sanitizeHtml(policy.cancellation_terms);
        this.sanitizedRefundTerms = this.sanitizeHtml(policy.refund_terms);
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading policy:', err);
        this.error = 'Failed to load company terms';
        this.loading = false;
      }
    });
  }

  private sanitizeHtml(html: string): SafeHtml {
    if (!html) return '';
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
}

