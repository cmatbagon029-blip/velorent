import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { IonicModule, ToastController, ModalController, IonContent } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { ApiService } from '../api.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-rent-vehicle',
  standalone: true,
  imports: [IonicModule, CommonModule, RouterModule, FormsModule],
  templateUrl: './rent-vehicle.page.html',
  styleUrls: ['./rent-vehicle.page.scss']
})
export class RentVehiclePage implements OnInit, AfterViewInit {
  vehicleId: number | null = null;
  vehicle: any = null;

  // Multi-step form
  step: number = 1;

  // Step 1 fields
  fullName: string = '';
  mobileNumber: string = '';
  serviceType: string = '';
  serviceOptions = ['Self Drive', 'Pick-up/Drop-off'];

  // Step 2 fields
  rentFromDate: string = '';
  rentToDate: string = '';
  rentTime: string = '';
  withDriver: string = '';
  destination: string = '';
  occasion: string = '';
  message: string = '';
  validIdFile: File | null = null;
  validIdPreview: SafeUrl | null = null;
  additionalIdFile: File | null = null;
  additionalIdPreview: SafeUrl | null = null;

  driverOptions = ['With Driver', 'Without Driver'];

  // Modal state
  showTermsModal: boolean = false;
  showServiceTypeModal: boolean = false;
  showCompanyRulesModal: boolean = false;
  hasScrolledToBottom: boolean = false;
  scrollCheckInterval: any = null;

  // Company rules
  companyRules: any[] = [];
  loadingRules: boolean = false;

  @ViewChild('scrollContent', { static: false }) scrollContent!: IonContent;
  @ViewChild('termsContent', { static: false }) termsContent!: IonContent;

  private subscriptions = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService,
    private sanitizer: DomSanitizer,
    private toastCtrl: ToastController,
    private modalCtrl: ModalController,
    private router: Router
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.vehicleId = params['vehicleId'] ? +params['vehicleId'] : null;
      if (!this.vehicleId || isNaN(this.vehicleId)) {
        this.showToast('No vehicle selected. Please choose a vehicle to rent.', 'danger');
        this.router.navigate(['/vehicles']);
        return;
      }
      this.apiService.getVehicle(this.vehicleId).subscribe(vehicle => {
        this.vehicle = vehicle;
      });
    });
  }

  ngAfterViewInit() {
    // Subscribe to scroll event when modal is shown
    if (this.termsContent) {
      this.termsContent.ionScroll.subscribe(() => {
        this.checkTermsScrollPosition();
      });
    }
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
    this.stopScrollPolling();
  }

  nextStep() {
    if (!this.fullName || !this.mobileNumber || !this.serviceType) {
      this.showToast('Please fill in all required fields.');
      return;
    }
    this.withDriver = this.serviceType;
    this.loadCompanyRules();
    this.hasScrolledToBottom = false;
    // Start polling for scroll position
    this.startScrollPolling();
  }

  startScrollPolling() {
    if (this.scrollCheckInterval) {
      clearInterval(this.scrollCheckInterval);
    }
    this.scrollCheckInterval = setInterval(() => {
      this.checkTermsScrollPosition();
      if (this.hasScrolledToBottom) {
        clearInterval(this.scrollCheckInterval);
        this.scrollCheckInterval = null;
      }
    }, 100);
  }

  stopScrollPolling() {
    if (this.scrollCheckInterval) {
      clearInterval(this.scrollCheckInterval);
      this.scrollCheckInterval = null;
    }
  }

  prevStep() {
    this.step = 1;
  }

  async checkTermsScrollPosition() {
    if (this.termsContent) {
      const scrollElement = await this.termsContent.getScrollElement();
      const scrollTop = scrollElement.scrollTop;
      const scrollHeight = scrollElement.scrollHeight;
      const clientHeight = scrollElement.clientHeight;
      // 30px tolerance
      if (scrollTop + clientHeight >= scrollHeight - 30) {
        this.hasScrolledToBottom = true;
      }
    }
  }

  closeTermsModal() {
    if (this.hasScrolledToBottom) {
      this.showTermsModal = false;
      this.step = 2;
      this.hasScrolledToBottom = false; // Reset for next time
      this.stopScrollPolling();
    } else {
      this.showToast('Please scroll to the bottom to read all terms and conditions.');
    }
  }

  openServiceTypeModal() {
    this.showServiceTypeModal = true;
  }

  closeServiceTypeModal() {
    console.log('Closing modal, service type is:', this.serviceType);
    this.showServiceTypeModal = false;
  }

  selectServiceType(option: string) {
    console.log('Selecting service type:', option);
    this.serviceType = option;
    console.log('Service type set to:', this.serviceType);
  }

  confirmServiceType() {
    console.log('Confirming service type:', this.serviceType);
    this.closeServiceTypeModal();
  }

  // Company rules methods
  loadCompanyRules() {
    if (!this.vehicle?.company_id) {
      this.showToast('Vehicle company information not available.', 'danger');
      return;
    }

    this.loadingRules = true;
    this.apiService.getCompanyRules(this.vehicle.company_id).subscribe({
      next: (response) => {
        this.companyRules = response.rules || [];
        this.loadingRules = false;
        this.showCompanyRulesModal = true;
        console.log('Company rules loaded:', this.companyRules);
      },
      error: (error) => {
        console.error('Error loading company rules:', error);
        this.loadingRules = false;
        this.showToast('Failed to load company rules. Proceeding without rules.', 'warning');
        // Proceed to next step even if rules fail to load
        this.step = 2;
      }
    });
  }

  closeCompanyRulesModal() {
    this.showCompanyRulesModal = false;
  }

  acceptCompanyRules() {
    this.closeCompanyRulesModal();
    this.step = 2;
  }

  onFileChange(event: any, type: 'valid' | 'additional') {
    const file = event.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      this.showToast('Only image files are allowed.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) { // 10 MB limit
      this.showToast('File size must be less than 10 MB.');
      return;
    }

    // Process file preview
    const reader = new FileReader();
    reader.onload = () => {
      const url = this.sanitizer.bypassSecurityTrustUrl(reader.result as string);
      if (type === 'valid') {
        this.validIdFile = file;
        this.validIdPreview = url;
      } else {
        this.additionalIdFile = file;
        this.additionalIdPreview = url;
      }
    };
    reader.readAsDataURL(file);
  }

  async showToast(message: string, color: string = 'danger') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000, // Increase duration for better readability
      color
    });
    toast.present();
  }

  submitBooking() {
    // Conditional validation for IDs
    if (!this.vehicleId || !this.rentFromDate || !this.rentToDate || !this.rentTime || !this.withDriver || !this.destination) {
      this.showToast('Please fill in all required fields.');
      return;
    }

    if (!this.additionalIdFile) {
      this.showToast('Please upload an additional valid ID.');
      return;
    }

    // Proceed with booking submission if all checks pass
    const formData = new FormData();
    formData.append('vehicleId', this.vehicleId.toString());
    formData.append('fullName', this.fullName);
    formData.append('mobileNumber', this.mobileNumber);
    formData.append('serviceType', this.serviceType);
    formData.append('rentFromDate', this.rentFromDate);
    formData.append('rentToDate', this.rentToDate);
    formData.append('rentTime', this.rentTime);
    formData.append('withDriver', this.withDriver);
    formData.append('destination', this.destination);
    formData.append('occasion', this.occasion);
    formData.append('message', this.message);
    if (this.validIdFile) formData.append('validId', this.validIdFile);
    if (this.additionalIdFile) formData.append('additionalId', this.additionalIdFile);

    this.apiService.createRentalWithFiles(formData).subscribe({
      next: (response) => {
        this.showToast('Booking submitted successfully!', 'success');
        this.router.navigate(['/my-rentals']);
      },
      error: (error) => {
        console.error('Error submitting booking:', error);
        if (error?.error?.error && error.error.error.includes('pending, approved, or ongoing booking')) {
          this.showToast('You already have a pending, approved, or ongoing booking. Please complete or cancel it before making a new booking.', 'danger');
        } else {
          this.showToast('Failed to submit booking. Please try again.');
        }
      }
    });
  }
}