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

  // Payment fields
  totalCost: number = 0;
  downPayment: number = 0;
  remainingAmount: number = 0;
  paymentMethod: string = '';
  paymentMethods = ['GCash'];

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

  // Driver selection
  drivers: any[] = [];
  selectedDriver: any = null;
  loadingDrivers: boolean = false;
  driversError: string = '';

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
    // Load drivers if service type requires a driver
    if (this.serviceType === 'Pick-up/Drop-off' && this.vehicle?.company_id) {
      this.loadDrivers();
    }
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
        // Check if time is within available range
        const requestedTime = this.rentTime;
        const startTime = dayAvailability.startTime;
        const endTime = dayAvailability.endTime;

         if (requestedTime >= startTime && requestedTime <= endTime) {
           this.availabilityError = '';
           this.selectedDateAvailability = { isAvailable: true, message: `Available from ${this.formatTimeForDisplay(startTime)} to ${this.formatTimeForDisplay(endTime)}` };
         } else {
           this.availabilityError = `Not available at this time. Available from ${this.formatTimeForDisplay(startTime)} to ${this.formatTimeForDisplay(endTime)}`;
           this.selectedDateAvailability = { isAvailable: false, message: `Not available at this time. Available from ${this.formatTimeForDisplay(startTime)} to ${this.formatTimeForDisplay(endTime)}` };
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

  async loadDrivers() {
    if (!this.vehicle?.company_id) {
      console.log('No vehicle or company_id found for drivers');
      return;
    }

    try {
      console.log('Loading drivers for company_id:', this.vehicle.company_id);
      this.loadingDrivers = true;
      this.driversError = '';
      const response = await this.apiService.getDrivers(this.vehicle.company_id).toPromise();
      console.log('Drivers response:', response);
      this.drivers = response.drivers || [];
      console.log('Set drivers to:', this.drivers);
    } catch (error) {
      console.error('Error loading drivers:', error);
      this.driversError = 'Failed to load drivers. Please try again.';
      this.drivers = [];
    } finally {
      this.loadingDrivers = false;
    }
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
    if (!this.rentFromDate || !this.companyAvailability.length) {
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

    const requestedTime = time;
    const startTime = dayAvailability.startTime;
    const endTime = dayAvailability.endTime;

    return requestedTime >= startTime && requestedTime <= endTime;
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

  submitBooking() {
    // Check if user is logged in
    const user = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (!user || !token) {
      // User is not logged in, show login prompt
      this.showLoginPrompt();
      return;
    }

    // Check rental limit first
    if (this.userRentalCount >= this.maxRentals) {
      this.showToast('You have reached the maximum limit of 3 rentals. Please contact support if you need to make additional bookings.', 'danger');
      return;
    }

    // Conditional validation for IDs
    if (!this.vehicleId || !this.rentFromDate || !this.rentToDate || !this.rentTime || !this.withDriver || !this.destination) {
      this.showToast('Please fill in all required fields.');
      return;
    }

    // Check if driver is required but not selected
    if (this.serviceType === 'Pick-up/Drop-off' && !this.selectedDriver) {
      this.showToast('Please select a driver for this service.');
      return;
    }

    // Availability is now enforced by the UI, so no need to check here

    if (!this.additionalIdFile) {
      this.showToast('Please upload an additional valid ID.');
      return;
    }

    if (!this.paymentMethod) {
      this.showToast('Please select a payment method for the down payment.');
      return;
    }

    // Calculate costs before submission
    this.calculateTotalCost();

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
    formData.append('totalCost', this.totalCost.toString());
    formData.append('downPayment', this.downPayment.toString());
    formData.append('remainingAmount', this.remainingAmount.toString());
    formData.append('paymentMethod', this.paymentMethod);
    
    // Add driver information if selected
    if (this.selectedDriver) {
      console.log('Adding driver info to form data:', {
        driverId: this.selectedDriver.id,
        driverName: this.selectedDriver.fullName,
        driverPhone: this.selectedDriver.phone,
        driverExperience: this.selectedDriver.experience
      });
      formData.append('driverId', this.selectedDriver.id.toString());
      formData.append('driverName', this.selectedDriver.fullName);
      formData.append('driverPhone', this.selectedDriver.phone);
      formData.append('driverExperience', this.selectedDriver.experience);
    } else {
      console.log('No driver selected for service type:', this.serviceType);
    }
    
    if (this.validIdFile) formData.append('validId', this.validIdFile);
    if (this.additionalIdFile) formData.append('additionalId', this.additionalIdFile);

    this.apiService.createRentalWithFiles(formData).subscribe({
      next: (response) => {
        this.showToast('Booking submitted successfully! Please pay the down payment to confirm your reservation.', 'success');
        this.router.navigate(['/my-rentals']);
      },
      error: (error) => {
        console.error('Error submitting booking:', error);
        if (error?.error?.error && error.error.error.includes('pending or ongoing booking')) {
          this.showToast('You already have a pending or ongoing booking. Please complete or cancel it before making a new booking.', 'danger');
        } else if (error?.error?.error && error.error.error.includes('maximum limit of 3 rentals')) {
          this.showToast('You have reached the maximum limit of 3 rentals. Please contact support if you need to make additional bookings.', 'danger');
        } else {
          this.showToast('Failed to submit booking. Please try again.');
        }
      }
    });
  }
}