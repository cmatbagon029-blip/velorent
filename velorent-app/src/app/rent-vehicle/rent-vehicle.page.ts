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
  firstName: string = '';
  lastName: string = '';
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

  // Payment fields
  totalCost: number = 0;
  downPayment: number = 0;
  remainingAmount: number = 0;
  paymentMethod: string = '';
  paymentMethods = ['GCash', 'GrabPay', 'PayMaya']; // Add more payment options

  // Payment flow state
  paymentInitiated: boolean = false;
  paymentCheckoutUrl: string = '';
  paymentStatus: string = 'pending'; // pending, paid, failed
  tempBookingId: number | null = null;
  isProcessingPayment: boolean = false;

  driverOptions = ['With Driver', 'Without Driver'];

  // Modal state
  showTermsModal: boolean = false;
  showServiceTypeModal: boolean = false;
  showCompanyRulesModal: boolean = false;
  showLoginModal: boolean = false;
  hasScrolledToBottom: boolean = false;
  scrollCheckInterval: any = null;

  // Company rules
  companyRules: any[] = [];
  loadingRules: boolean = false;

  // Company availability
  companyAvailability: any[] = [];
  loadingAvailability: boolean = false;
  availabilityError: string = '';
  selectedDateAvailability: any = null;


  // Rental limit tracking
  userRentalCount: number = 0;
  maxRentals: number = 3;

  // Date constraints
  minDate: string = new Date().toISOString().split('T')[0];
  maxDate: string = '';
  unavailableDates: string[] = [];

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
    this.prefillUserInfo();
    this.route.queryParams.subscribe(params => {
      this.vehicleId = params['vehicleId'] ? +params['vehicleId'] : null;
      if (!this.vehicleId || isNaN(this.vehicleId)) {
        this.showToast('No vehicle selected. Please choose a vehicle to rent.', 'danger');
        this.router.navigate(['/vehicles']);
        return;
      }
      this.apiService.getVehicle(this.vehicleId).subscribe(vehicle => {
        this.vehicle = vehicle;
        // Load company availability when vehicle is loaded
        this.loadCompanyAvailability();
      });
    });
    this.loadUserRentalCount();
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
    // Build full name from first/last for validation and submission
    this.fullName = [this.firstName, this.lastName].filter(Boolean).join(' ').trim();

    if (!this.firstName || !this.lastName || !this.mobileNumber || !this.serviceType) {
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

  calculateTotalCost() {
    if (!this.rentFromDate || !this.rentToDate || !this.vehicle) return;

    const start = new Date(this.rentFromDate);
    const end = new Date(this.rentToDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    if (days > 0) {
      // Use appropriate price based on service type
      const dailyPrice = this.serviceType === 'Self Drive' 
        ? this.vehicle.price_without_driver 
        : this.vehicle.price_with_driver;
      
      this.totalCost = days * dailyPrice;
      this.downPayment = this.totalCost / 2; // Half of total cost
      this.remainingAmount = this.totalCost - this.downPayment;
    } else {
      this.totalCost = 0;
      this.downPayment = 0;
      this.remainingAmount = 0;
    }
  }

  onDateFocus() {
    // Validate selected dates when user clicks on date input
    if (this.rentFromDate || this.rentToDate) {
      this.validateSelectedDates();
    }
  }

  onDateChange() {
    // Validate if the selected date is available
    this.validateSelectedDates();
    
    this.calculateTotalCost();
    this.checkAvailability();
    this.checkDateAvailability();
    // Clear time selection when date changes since available times will be different
    this.rentTime = '';
  }

  validateSelectedDates() {
    if (!this.rentFromDate) return;
    
    // Check if start date is unavailable
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const startDate = new Date(this.rentFromDate);
    const dayOfWeek = dayNames[startDate.getDay()];
    
    const dayAvailability = this.companyAvailability.find(
      (avail: any) => avail.dayOfWeek === dayOfWeek
    );
    
    if (!dayAvailability || !dayAvailability.isAvailable) {
      this.availabilityError = `Company is not available on ${this.formatDayName(dayOfWeek)}`;
      this.selectedDateAvailability = { isAvailable: false, message: this.availabilityError };
      // Clear the date if it's not available
      this.rentFromDate = '';
      this.rentToDate = '';
    } else {
      this.availabilityError = '';
    }
    
    // Also validate end date if selected
    if (this.rentToDate) {
      const endDate = new Date(this.rentToDate);
      const endDayOfWeek = dayNames[endDate.getDay()];
      
      const endDayAvailability = this.companyAvailability.find(
        (avail: any) => avail.dayOfWeek === endDayOfWeek
      );
      
      if (!endDayAvailability || !endDayAvailability.isAvailable) {
        this.availabilityError = `Company is not available on ${this.formatDayName(endDayOfWeek)}`;
        this.selectedDateAvailability = { isAvailable: false, message: this.availabilityError };
        this.rentToDate = '';
      }
    }
  }

  formatDayName(dayOfWeek: string): string {
    const dayNames: { [key: string]: string } = {
      'monday': 'Monday',
      'tuesday': 'Tuesday',
      'wednesday': 'Wednesday',
      'thursday': 'Thursday',
      'friday': 'Friday',
      'saturday': 'Saturday',
      'sunday': 'Sunday'
    };
    return dayNames[dayOfWeek.toLowerCase()] || dayOfWeek;
  }

  calculateDays(): number {
    if (!this.rentFromDate || !this.rentToDate) {
      return 0;
    }
    
    const start = new Date(this.rentFromDate);
    const end = new Date(this.rentToDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    return days > 0 ? days : 0;
  }

  async checkDateAvailability() {
    if (!this.rentFromDate || !this.rentToDate || !this.vehicle?.id) {
      return;
    }

    try {
      this.loadingAvailability = true;
      this.availabilityError = '';
      
      const response = await this.apiService.checkVehicleAvailability(this.vehicle.id, this.rentFromDate, this.rentToDate).toPromise();
      
      if (!response.isAvailable) {
        this.availabilityError = response.message || 'Vehicle is not available for the selected dates.';
        this.selectedDateAvailability = { isAvailable: false, message: this.availabilityError };
      } else {
        this.selectedDateAvailability = { isAvailable: true, message: 'Vehicle is available for the selected dates.' };
      }
    } catch (error) {
      console.error('Error checking date availability:', error);
      this.availabilityError = 'Error checking availability. Please try again.';
      this.selectedDateAvailability = { isAvailable: false, message: this.availabilityError };
    } finally {
      this.loadingAvailability = false;
    }
  }

  onTimeChange() {
    // Clear any previous validation errors by re-validating
    if (this.rentTime && this.rentFromDate) {
      const isValid = this.isTimeAvailableForSelection(this.rentTime);
      if (!isValid) {
        console.warn('Selected time is not available:', this.rentTime);
      }
    }
    this.checkAvailability();
  }

  async checkAvailability() {
    if (!this.rentFromDate || !this.rentTime || !this.vehicle?.company_id) {
      return;
    }

    try {
      this.loadingAvailability = true;
      this.availabilityError = '';
      
      // Since we now have local availability data, check it locally instead of API
      const dateObj = new Date(this.rentFromDate);
      const dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      
      const dayAvailability = this.companyAvailability.find(
        (avail: any) => avail.dayOfWeek === dayOfWeek
      );

      if (!dayAvailability || !dayAvailability.isAvailable) {
        this.availabilityError = 'Company is not available on this day';
        this.selectedDateAvailability = { isAvailable: false, message: 'Company is not available on this day' };
      } else if (dayAvailability.is24Hours) {
        this.availabilityError = '';
        this.selectedDateAvailability = { isAvailable: true, message: 'Available 24 hours' };
      } else {
        // Check if time is within available range using proper time comparison
        const normalizeTime = (timeStr: string): string => {
          if (!timeStr) return '00:00';
          if (timeStr.length > 5) {
            return timeStr.substring(0, 5);
          }
          if (timeStr.length === 5 && timeStr.includes(':')) {
            return timeStr;
          }
          return '00:00';
        };

        const timeToMinutes = (timeStr: string): number => {
          if (!timeStr || !timeStr.includes(':')) return 0;
          const parts = timeStr.split(':');
          const hours = parseInt(parts[0], 10) || 0;
          const minutes = parseInt(parts[1], 10) || 0;
          return hours * 60 + minutes;
        };

        const requestedTime = normalizeTime(this.rentTime);
        const startTime = normalizeTime(dayAvailability.startTime || '00:00');
        const endTime = normalizeTime(dayAvailability.endTime || '23:59');

        const requestedMinutes = timeToMinutes(requestedTime);
        const startMinutes = timeToMinutes(startTime);
        const endMinutes = timeToMinutes(endTime);

        if (requestedMinutes >= startMinutes && requestedMinutes <= endMinutes) {
          this.availabilityError = '';
          this.selectedDateAvailability = { isAvailable: true, message: `Available from ${this.formatTimeForDisplay(dayAvailability.startTime)} to ${this.formatTimeForDisplay(dayAvailability.endTime)}` };
        } else {
          this.availabilityError = `Not available at this time. Available from ${this.formatTimeForDisplay(dayAvailability.startTime)} to ${this.formatTimeForDisplay(dayAvailability.endTime)}`;
          this.selectedDateAvailability = { isAvailable: false, message: `Not available at this time. Available from ${this.formatTimeForDisplay(dayAvailability.startTime)} to ${this.formatTimeForDisplay(dayAvailability.endTime)}` };
        }
      }
    } catch (error) {
      console.error('Error checking availability:', error);
      this.availabilityError = 'Error checking availability. Please try again.';
    } finally {
      this.loadingAvailability = false;
    }
  }

  async loadCompanyAvailability() {
    if (!this.vehicle?.company_id) {
      console.log('No vehicle or company_id found');
      return;
    }

    try {
      console.log('Loading company availability for company_id:', this.vehicle.company_id);
      this.loadingAvailability = true;
      const response = await this.apiService.getCompanyAvailability(this.vehicle.company_id).toPromise();
      console.log('Company availability response:', response);
      this.companyAvailability = response.availability || [];
      console.log('Set companyAvailability to:', this.companyAvailability);
      
      // If no availability data, create default availability (Monday-Friday 9-5)
      if (this.companyAvailability.length === 0) {
        console.log('No availability data found, creating default schedule');
        this.companyAvailability = [
          { dayOfWeek: 'monday', isAvailable: true, startTime: '09:00:00', endTime: '17:00:00', is24Hours: false },
          { dayOfWeek: 'tuesday', isAvailable: true, startTime: '09:00:00', endTime: '17:00:00', is24Hours: false },
          { dayOfWeek: 'wednesday', isAvailable: true, startTime: '09:00:00', endTime: '17:00:00', is24Hours: false },
          { dayOfWeek: 'thursday', isAvailable: true, startTime: '09:00:00', endTime: '17:00:00', is24Hours: false },
          { dayOfWeek: 'friday', isAvailable: true, startTime: '09:00:00', endTime: '17:00:00', is24Hours: false },
          { dayOfWeek: 'saturday', isAvailable: false, startTime: null, endTime: null, is24Hours: false },
          { dayOfWeek: 'sunday', isAvailable: false, startTime: null, endTime: null, is24Hours: false }
        ];
      }
      
      // Generate unavailable dates based on company availability
      this.generateUnavailableDates();
    } catch (error) {
      console.error('Error loading company availability:', error);
      // Create default availability on error
      this.companyAvailability = [
        { dayOfWeek: 'monday', isAvailable: true, startTime: '09:00:00', endTime: '17:00:00', is24Hours: false },
        { dayOfWeek: 'tuesday', isAvailable: true, startTime: '09:00:00', endTime: '17:00:00', is24Hours: false },
        { dayOfWeek: 'wednesday', isAvailable: true, startTime: '09:00:00', endTime: '17:00:00', is24Hours: false },
        { dayOfWeek: 'thursday', isAvailable: true, startTime: '09:00:00', endTime: '17:00:00', is24Hours: false },
        { dayOfWeek: 'friday', isAvailable: true, startTime: '09:00:00', endTime: '17:00:00', is24Hours: false },
        { dayOfWeek: 'saturday', isAvailable: false, startTime: null, endTime: null, is24Hours: false },
        { dayOfWeek: 'sunday', isAvailable: false, startTime: null, endTime: null, is24Hours: false }
      ];
      this.generateUnavailableDates();
    } finally {
      this.loadingAvailability = false;
    }
  }

  generateUnavailableDates() {
    this.unavailableDates = [];
    const today = new Date();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    
    // Check next 60 days for unavailable dates based on company schedule
    for (let i = 0; i < 60; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() + i);
      const dayOfWeek = dayNames[checkDate.getDay()];
      
      const dayAvailability = this.companyAvailability.find(
        (avail: any) => avail.dayOfWeek === dayOfWeek
      );
      
      // If day is not available, add to unavailable dates
      if (!dayAvailability || !dayAvailability.isAvailable) {
        this.unavailableDates.push(checkDate.toISOString().split('T')[0]);
      }
    }
    
    console.log('Unavailable dates based on company schedule:', this.unavailableDates);
  }


  loadUserRentalCount() {
    this.apiService.getMyBookings().subscribe({
      next: (bookings) => {
        this.userRentalCount = bookings.length;
        console.log('User rental count:', this.userRentalCount);
      },
      error: (error) => {
        console.error('Error loading user rental count:', error);
        this.userRentalCount = 0;
      }
    });
  }

  isDateAvailable(date: string): boolean {
    if (!this.companyAvailability.length) {
      return true; // If no availability data, allow all dates
    }

    const dateObj = new Date(date);
    const dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    
    const dayAvailability = this.companyAvailability.find(
      (avail: any) => avail.dayOfWeek === dayOfWeek
    );

    return dayAvailability ? dayAvailability.isAvailable : false;
  }

  getAvailableTimeSlots(date: string): string[] {
    if (!this.companyAvailability.length) {
      return []; // If no availability data, return empty array
    }

    const dateObj = new Date(date);
    const dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    
    const dayAvailability = this.companyAvailability.find(
      (avail: any) => avail.dayOfWeek === dayOfWeek
    );

    if (!dayAvailability || !dayAvailability.isAvailable) {
      return [];
    }

    if (dayAvailability.is24Hours) {
      // Generate hourly slots for 24-hour availability
      const slots = [];
      for (let hour = 0; hour < 24; hour++) {
        slots.push(`${hour.toString().padStart(2, '0')}:00`);
      }
      return slots;
    }

    // Generate time slots within the available range
    const slots = [];
    const startHour = parseInt(dayAvailability.startTime.split(':')[0]);
    const endHour = parseInt(dayAvailability.endTime.split(':')[0]);
    
    for (let hour = startHour; hour <= endHour; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
    }
    
    return slots;
  }

  // Get available dates for the next 30 days
  getAvailableDates(): string[] {
    console.log('getAvailableDates called, companyAvailability:', this.companyAvailability);
    
    if (!this.companyAvailability.length) {
      console.log('No availability data, returning empty array');
      return []; // If no availability data, return empty array
    }

    const availableDates: string[] = [];
    const today = new Date();
    
    // Check next 30 days
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() + i);
      
      const dayOfWeek = checkDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const dateString = checkDate.toISOString().split('T')[0];
      
      const dayAvailability = this.companyAvailability.find(
        (avail: any) => avail.dayOfWeek === dayOfWeek
      );

      console.log(`Checking ${dayOfWeek} (${dateString}):`, dayAvailability);

      if (dayAvailability && dayAvailability.isAvailable) {
        availableDates.push(dateString);
      }
    }
    
    console.log('Available dates:', availableDates);
    return availableDates;
  }

  // Check if a specific date is available
  isDateAvailableForSelection(date: string): boolean {
    if (!this.companyAvailability.length) {
      return true; // If no availability data, allow all dates
    }

    const dateObj = new Date(date);
    const dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    
    const dayAvailability = this.companyAvailability.find(
      (avail: any) => avail.dayOfWeek === dayOfWeek
    );

    return dayAvailability ? dayAvailability.isAvailable : false;
  }

  // Check if a specific time is available for the selected date
  isTimeAvailableForSelection(time: string): boolean {
    if (!this.rentFromDate || !this.companyAvailability.length || !time) {
      return true; // If no date selected or no availability data, allow all times
    }

    const dateObj = new Date(this.rentFromDate);
    const dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    
    const dayAvailability = this.companyAvailability.find(
      (avail: any) => avail.dayOfWeek === dayOfWeek
    );

    if (!dayAvailability || !dayAvailability.isAvailable) {
      return false;
    }

    if (dayAvailability.is24Hours) {
      return true;
    }

    // Normalize time format (remove seconds if present, ensure HH:MM format)
    const normalizeTime = (timeStr: string): string => {
      if (!timeStr) return '00:00';
      // Remove seconds if present (format: HH:MM:SS -> HH:MM)
      if (timeStr.length > 5) {
        return timeStr.substring(0, 5);
      }
      // Ensure it's in HH:MM format
      if (timeStr.length === 5 && timeStr.includes(':')) {
        return timeStr;
      }
      return '00:00';
    };

    const requestedTime = normalizeTime(time);
    const startTime = normalizeTime(dayAvailability.startTime || '00:00');
    const endTime = normalizeTime(dayAvailability.endTime || '23:59');

    // Convert to minutes for proper comparison
    const timeToMinutes = (timeStr: string): number => {
      if (!timeStr || !timeStr.includes(':')) return 0;
      const parts = timeStr.split(':');
      const hours = parseInt(parts[0], 10) || 0;
      const minutes = parseInt(parts[1], 10) || 0;
      return hours * 60 + minutes;
    };

    const requestedMinutes = timeToMinutes(requestedTime);
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);

    // Debug logging
    console.log('Time validation:', {
      requestedTime,
      startTime,
      endTime,
      requestedMinutes,
      startMinutes,
      endMinutes,
      isValid: requestedMinutes >= startMinutes && requestedMinutes <= endMinutes
    });

    // Allow times from start time (inclusive) to end time (inclusive)
    return requestedMinutes >= startMinutes && requestedMinutes <= endMinutes;
  }

  // Get available end dates (must be after start date)
  getAvailableEndDates(): string[] {
    if (!this.rentFromDate) {
      return [];
    }

    const availableDates = this.getAvailableDates();
    const startDate = new Date(this.rentFromDate);
    
    return availableDates.filter(date => {
      const endDate = new Date(date);
      return endDate >= startDate;
    });
  }

  // Format date for display
  formatDateForDisplay(dateString: string): string {
    console.log('formatDateForDisplay called with:', dateString);
    
    // Handle invalid or empty date strings
    if (!dateString || dateString === '' || dateString === 'Invalid Date') {
      console.log('Invalid or empty date string:', dateString);
      return 'Invalid Date';
    }
    
    const date = new Date(dateString);
    console.log('Parsed date:', date, 'isValid:', !isNaN(date.getTime()));
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      console.error('Invalid date string:', dateString);
      return 'Invalid Date';
    }
    
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    // Check if it's today
    if (date.toDateString() === today.toDateString()) {
      return `Today (${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`;
    }
    
    // Check if it's tomorrow
    if (date.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow (${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`;
    }
    
    // Check if it's within the next 7 days
    const daysDiff = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff <= 7) {
      const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'short' });
      return `${dayOfWeek} ${date.getDate()}/${date.getMonth() + 1}`;
    }
    
    // Default format for dates further out
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'short' });
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const day = date.getDate();
    
    return `${dayOfWeek} ${month} ${day}`;
  }

  // Format time for display
  formatTimeForDisplay(timeString: string): string {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    
    // Add time period labels for better UX
    let periodLabel = '';
    if (hour >= 6 && hour < 12) {
      periodLabel = ' (Morning)';
    } else if (hour >= 12 && hour < 17) {
      periodLabel = ' (Afternoon)';
    } else if (hour >= 17 && hour < 21) {
      periodLabel = ' (Evening)';
    } else {
      periodLabel = ' (Night)';
    }
    
    return `${displayHour}:${minutes} ${ampm}${periodLabel}`;
  }

  formatTimeForClock(time: string): string {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  }

  getTimePeriod(time: string): string {
    if (!time) return '';
    const [hours] = time.split(':');
    const hour = parseInt(hours);
    if (hour >= 6 && hour < 12) {
      return 'Morning';
    } else if (hour >= 12 && hour < 17) {
      return 'Afternoon';
    } else if (hour >= 17 && hour < 21) {
      return 'Evening';
    } else {
      return 'Night';
    }
  }

  isMorningTime(time: string): boolean {
    if (!time) return false;
    const [hours] = time.split(':');
    const hour = parseInt(hours);
    return hour >= 6 && hour < 12;
  }

  isAfternoonTime(time: string): boolean {
    if (!time) return false;
    const [hours] = time.split(':');
    const hour = parseInt(hours);
    return hour >= 12 && hour < 17;
  }

  isEveningTime(time: string): boolean {
    if (!time) return false;
    const [hours] = time.split(':');
    const hour = parseInt(hours);
    return hour >= 17 && hour < 21;
  }

  isNightTime(time: string): boolean {
    if (!time) return false;
    const [hours] = time.split(':');
    const hour = parseInt(hours);
    return hour >= 21 || hour < 6;
  }

  getMinTime(): string {
    if (!this.rentFromDate || !this.companyAvailability.length) {
      return '00:00';
    }

    const dateObj = new Date(this.rentFromDate);
    const dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    
    const dayAvailability = this.companyAvailability.find(
      (avail: any) => avail.dayOfWeek === dayOfWeek
    );

    if (!dayAvailability || !dayAvailability.isAvailable) {
      return '00:00';
    }

    if (dayAvailability.is24Hours) {
      return '00:00';
    }

    // Ensure proper HH:MM format (remove seconds if present)
    const startTime = dayAvailability.startTime || '';
    if (startTime.length >= 5) {
      return startTime.substring(0, 5);
    }
    return '00:00';
  }

  getMaxTime(): string {
    if (!this.rentFromDate || !this.companyAvailability.length) {
      return '23:59';
    }

    const dateObj = new Date(this.rentFromDate);
    const dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    
    const dayAvailability = this.companyAvailability.find(
      (avail: any) => avail.dayOfWeek === dayOfWeek
    );

    if (!dayAvailability || !dayAvailability.isAvailable) {
      return '23:59';
    }

    if (dayAvailability.is24Hours) {
      return '23:59';
    }

    // Ensure proper HH:MM format (remove seconds if present)
    const endTime = dayAvailability.endTime || '';
    if (endTime.length >= 5) {
      return endTime.substring(0, 5);
    }
    return '23:59';
  }

  getAvailableDaysText(): string {
    if (!this.companyAvailability.length) {
      return 'Loading availability...';
    }

    const availableDays = this.companyAvailability
      .filter(day => day.isAvailable)
      .map(day => day.dayOfWeek.charAt(0).toUpperCase() + day.dayOfWeek.slice(1));

    if (availableDays.length === 0) {
      return 'No days available';
    }

    if (availableDays.length === 7) {
      return 'Every day';
    }

    // Format as "Monday, Tuesday, Wednesday" or "Monday - Friday"
    if (availableDays.length === 5 && 
        availableDays.includes('Monday') && 
        availableDays.includes('Friday') &&
        !availableDays.includes('Saturday') && 
        !availableDays.includes('Sunday')) {
      return 'Monday - Friday';
    }

    return availableDays.join(', ');
  }

  getAvailableTimeRangeText(date: string): string {
    if (!date || !this.companyAvailability.length) {
      return '';
    }

    const dateObj = new Date(date);
    const dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    
    const dayAvailability = this.companyAvailability.find(
      (avail: any) => avail.dayOfWeek === dayOfWeek
    );

    if (!dayAvailability || !dayAvailability.isAvailable) {
      return 'No times available';
    }

    if (dayAvailability.is24Hours) {
      return '24 Hours';
    }

    const startTime = this.formatTimeForDisplay(dayAvailability.startTime);
    const endTime = this.formatTimeForDisplay(dayAvailability.endTime);
    
    // Remove period labels from the range display
    const startTimeClean = startTime.split(' (')[0];
    const endTimeClean = endTime.split(' (')[0];
    
    return `${startTimeClean} - ${endTimeClean}`;
  }

  async showToast(message: string, color: string = 'danger') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000, // Increase duration for better readability
      color
    });
    toast.present();
  }

  showLoginPrompt() {
    this.showLoginModal = true;
  }

  closeLoginModal() {
    this.showLoginModal = false;
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  goToRegister() {
    this.router.navigate(['/register']);
  }

  // Validate booking form before proceeding to payment
  validateBookingForm(): boolean {
    if (!this.vehicleId || !this.rentFromDate || !this.rentToDate || !this.rentTime || !this.withDriver || !this.destination) {
      this.showToast('Please fill in all required fields.', 'danger');
      return false;
    }

    if (!this.additionalIdFile) {
      this.showToast('Please upload an additional valid ID.', 'danger');
      return false;
    }

    if (!this.paymentMethod) {
      this.showToast('Please select a payment method for the down payment.', 'danger');
      return false;
    }

    return true;
  }

  // Step 1: Create booking and proceed to payment
  proceedToPayment() {
    // Ensure fullName is synced from first/last name before submission
    this.fullName = [this.firstName, this.lastName].filter(Boolean).join(' ').trim();

    // Check if user is logged in
    const user = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (!user || !token) {
      this.showLoginPrompt();
      return;
    }

    // Check rental limit
    if (this.userRentalCount >= this.maxRentals) {
      this.showToast('You have reached the maximum limit of 3 rentals. Please contact support if you need to make additional bookings.', 'danger');
      return;
    }

    // Validate form
    if (!this.validateBookingForm()) {
      return;
    }

    // Calculate costs
    this.calculateTotalCost();

    if (this.isProcessingPayment) {
      return; // Prevent multiple submissions
    }

    this.isProcessingPayment = true;

    // First, create the booking
    const formData = new FormData();
    formData.append('vehicleId', this.vehicleId!.toString());
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
    formData.append('totalCost', this.totalCost.toString());
    formData.append('downPayment', this.downPayment.toString());
    formData.append('remainingAmount', this.remainingAmount.toString());
    formData.append('paymentMethod', this.paymentMethod);
    
    if (this.validIdFile) formData.append('validId', this.validIdFile);
    if (this.additionalIdFile) formData.append('additionalId', this.additionalIdFile);

    this.apiService.createRentalWithFiles(formData).subscribe({
      next: (response: any) => {
        console.log('=== BOOKING CREATED RESPONSE ===');
        console.log('Full response:', response);
        console.log('Response type:', typeof response);
        console.log('Response keys:', Object.keys(response || {}));
        
        // Get booking ID from response - check multiple possible locations
        let bookingId = null;
        
        if (response) {
          bookingId = response.booking_id || response.id || response.bookingId || 
                     response.data?.booking_id || response.data?.id ||
                     (response.insertId ? response.insertId : null);
        }
        
        console.log('Extracted booking ID:', bookingId);
        
        if (!bookingId || isNaN(Number(bookingId))) {
          console.error('Could not extract valid booking ID from response');
          console.error('Response structure:', JSON.stringify(response, null, 2));
          
          // Try to get the latest booking for this user as fallback
          this.getLatestBookingAndCreatePayment();
          return;
        }

        this.tempBookingId = Number(bookingId);
        
        // Now create payment
        this.createPaymentForBooking(Number(bookingId));
      },
      error: (error) => {
        this.isProcessingPayment = false;
        console.error('Error creating booking:', error);
        console.error('Error response:', error.error);
        
        // If error is about existing booking, try to get that booking and proceed with payment
        const errorMessage = error?.error?.error || error?.error?.message || '';
        if (errorMessage.includes('pending or ongoing booking')) {
          // Booking already exists, try to get it and proceed with payment
          this.getLatestBookingAndCreatePayment();
        } else {
          this.handleBookingError(error);
        }
      }
    });
  }

  // Fallback: Get latest booking if we can't extract ID from response
  getLatestBookingAndCreatePayment() {
    console.log('Attempting to get latest booking...');
    this.apiService.getMyBookings().subscribe({
      next: (bookings: any[]) => {
        if (bookings && bookings.length > 0) {
          // Get the most recent booking (should be the one just created)
          const latestBooking = bookings[0]; // Assuming they're sorted by date DESC
          const bookingId = latestBooking.id;
          
          console.log('Found latest booking ID:', bookingId);
          
          if (bookingId) {
            this.tempBookingId = bookingId;
            this.createPaymentForBooking(bookingId);
          } else {
            this.showToast('Could not find booking. Please check My Rentals and try payment from there.', 'warning');
            this.isProcessingPayment = false;
            setTimeout(() => {
        this.router.navigate(['/my-rentals']);
            }, 3000);
          }
        } else {
          this.showToast('Booking may have been created but could not be found. Please check My Rentals.', 'warning');
          this.isProcessingPayment = false;
          setTimeout(() => {
            this.router.navigate(['/my-rentals']);
          }, 3000);
        }
      },
      error: (error) => {
        console.error('Error fetching bookings:', error);
        this.showToast('Could not retrieve booking. Please check My Rentals manually.', 'warning');
        this.isProcessingPayment = false;
        setTimeout(() => {
          this.router.navigate(['/my-rentals']);
        }, 3000);
      }
    });
  }

  // Step 2: Create payment for the booking
  createPaymentForBooking(bookingId: number) {
    this.apiService.createPayment(this.downPayment, bookingId).subscribe({
      next: (paymentResponse: any) => {
        this.paymentCheckoutUrl = paymentResponse.checkout_url;
        this.paymentInitiated = true;
        this.isProcessingPayment = false;
        
        // Redirect to payment URL in the same window
        if (this.paymentCheckoutUrl) {
          // Store booking ID in sessionStorage so we can track it after redirect
          sessionStorage.setItem('pendingPaymentBookingId', bookingId.toString());
          
          // Redirect to PayMongo checkout in the same window
          window.location.href = this.paymentCheckoutUrl;
        } else {
          this.showToast('Payment URL not received. Please try again.', 'danger');
        }
      },
      error: (error: any) => {
        this.isProcessingPayment = false;
        console.error('=== PAYMENT ERROR DEBUG ===');
        console.error('Full error object:', error);
        
        // Show detailed error message
        let errorMessage = 'Failed to create payment. ';
        
        // The error might be wrapped, try to get the actual error
        const httpError = error.error || error;
        
        // Check for message field (most common)
        if (httpError?.message) {
          errorMessage += httpError.message;
        }
        // Check for error field
        else if (httpError?.error) {
          errorMessage += httpError.error;
        }
        // Check for details array
        else if (httpError?.details && Array.isArray(httpError.details) && httpError.details.length > 0) {
          errorMessage += httpError.details[0];
        }
        // Check for paymongo_error
        else if (httpError?.paymongo_error) {
          const pmError = httpError.paymongo_error;
          if (Array.isArray(pmError) && pmError.length > 0) {
            errorMessage += pmError[0].detail || pmError[0].message || JSON.stringify(pmError[0]);
          } else if (pmError.message) {
            errorMessage += pmError.message;
          } else {
            errorMessage += JSON.stringify(pmError);
          }
        }
        // Last resort
        else {
          errorMessage += 'Please check your PayMongo API key configuration.';
          console.error('Full error structure:', JSON.stringify(httpError, null, 2));
        }
        
        // Special handling for API key errors
        if (errorMessage.includes('API key') && errorMessage.includes('does not exist')) {
          errorMessage += ' Please update your PayMongo secret key in backend/config.env file.';
        }
        
        console.error('Final error message:', errorMessage);
        this.showToast(errorMessage, 'danger');
      }
    });
  }

  // Poll payment status after user completes payment
  startPaymentStatusPolling(bookingId: number) {
    const maxAttempts = 60; // Poll for 5 minutes (60 * 5 seconds)
    let attempts = 0;
    
    const pollInterval = setInterval(() => {
      attempts++;
      
      this.apiService.getPaymentStatus(bookingId).subscribe({
        next: (paymentStatus: any) => {
          if (paymentStatus.status === 'paid') {
            clearInterval(pollInterval);
            this.paymentStatus = 'paid';
            this.showToast('Payment confirmed! Your booking has been submitted successfully.', 'success');
            setTimeout(() => {
              this.router.navigate(['/my-rentals']);
            }, 2000);
          } else if (paymentStatus.status === 'failed') {
            clearInterval(pollInterval);
            this.paymentStatus = 'failed';
            this.showToast('Payment failed. Please try again.', 'danger');
          }
        },
        error: (error) => {
          console.error('Error checking payment status:', error);
        }
      });

      if (attempts >= maxAttempts) {
        clearInterval(pollInterval);
        this.showToast('Payment verification timeout. Please check your booking status in My Rentals.', 'warning');
      }
    }, 5000); // Poll every 5 seconds
  }

  // Handle booking creation errors
  handleBookingError(error: any) {
    // Check for authentication errors
    if (error?.status === 401 || error?.error?.message?.includes('token') || error?.error?.message?.includes('Token')) {
      this.showToast('Your session has expired. Please log in again.', 'danger');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 2000);
      return;
    }
    
    // Check error message
    const errorMessage = error?.error?.error || error?.error?.message || error?.message || '';
    
    if (errorMessage.includes('pending or ongoing booking')) {
          this.showToast('You already have a pending or ongoing booking. Please complete or cancel it before making a new booking.', 'danger');
    } else if (errorMessage.includes('maximum limit of 3 rentals')) {
          this.showToast('You have reached the maximum limit of 3 rentals. Please contact support if you need to make additional bookings.', 'danger');
        } else {
      const displayMessage = errorMessage || 'Failed to create booking. Please try again.';
      this.showToast(displayMessage, 'danger');
        }
      }

  // Legacy method - now redirects to proceedToPayment
  submitBooking() {
    this.proceedToPayment();
  }

  private prefillUserInfo() {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        return;
      }
      const user = JSON.parse(userStr);
      const name: string = user?.name || '';
      if (name) {
        const parts = name.trim().split(/\s+/);
        this.firstName = parts.shift() || '';
        this.lastName = parts.join(' ');
        this.fullName = [this.firstName, this.lastName].filter(Boolean).join(' ').trim();
      }
    } catch (err) {
      console.warn('Could not prefill user info', err);
    }
  }
}