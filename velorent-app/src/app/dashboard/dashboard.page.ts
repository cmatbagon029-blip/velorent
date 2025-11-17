import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalController, NavController, AlertController } from '@ionic/angular';
import { AlertModalComponent } from '../components/alert-modal/alert-modal.component';
import { ApiService } from '../api.service';
import { Vehicle } from '../../models/vehicle.model';
import { RentalCompany } from '../../models/rental-company.model';
import { NotificationService } from '../services/notification.service';
import { RequestNotificationService } from '../services/request-notification.service';
import { addIcons } from 'ionicons';
import { 
  star, 
  home, 
  searchOutline, 
  carOutline, 
  personOutline,
  personCircleOutline,
  notificationsOutline,
  documentTextOutline,
  appsOutline,
  carSportOutline,
  busOutline,
  optionsOutline,
  closeOutline,
  checkmarkCircle,
  checkmark
} from 'ionicons/icons';
import { TermsModalComponent } from '../settings/settings.page';
import { PrivacyModalComponent } from '../settings/settings.page';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

// Register icons
addIcons({ 
  star, 
  home, 
  'search-outline': searchOutline, 
  'car-outline': carOutline, 
  'person-outline': personOutline,
  'person-circle-outline': personCircleOutline,
  'notifications-outline': notificationsOutline,
  'document-text-outline': documentTextOutline,
  'apps-outline': appsOutline,
  'car-sport-outline': carSportOutline,
  'bus-outline': busOutline,
  'options-outline': optionsOutline,
  'close-outline': closeOutline,
  'checkmark-circle': checkmarkCircle,
  'checkmark': checkmark
});

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [IonicModule, RouterModule, CommonModule, FormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss']
})
export class DashboardPage implements OnInit {
  companies: RentalCompany[] = [];
  vehicles: Vehicle[] = [];
  loading: boolean = true;
  error: string | null = null;
  selectedCategory: string = 'all';
  filteredVehicles: Vehicle[] = [];
  showAllVehicles: boolean = false;
  readonly INITIAL_VEHICLE_COUNT = 4;
  unreadCount: number = 0;
  requestUnreadCount: number = 0;
  showFilters: boolean = false;

  get displayedVehicles(): Vehicle[] {
    if (this.showAllVehicles || this.filteredVehicles.length <= this.INITIAL_VEHICLE_COUNT) {
      return this.filteredVehicles;
    }
    return this.filteredVehicles.slice(0, this.INITIAL_VEHICLE_COUNT);
  }

  onBrowseAllVehicles() {
    this.showAllVehicles = true;
  }

  onMinimizeVehicles() {
    this.showAllVehicles = false;
  }

  companiesSwiperConfig = {
    slidesPerView: 'auto',
    spaceBetween: 20,
    centeredSlides: true,
    loop: true,
    autoplay: {
      delay: 3000,
      disableOnInteraction: false,
    },
    pagination: {
      el: '.swiper-pagination',
      clickable: true,
    },
    navigation: {
      nextEl: '.swiper-button-next',
      prevEl: '.swiper-button-prev',
    },
    breakpoints: {
      320: {
        slidesPerView: 1,
        spaceBetween: 10
      },
      480: {
        slidesPerView: 2,
        spaceBetween: 20
      },
      768: {
        slidesPerView: 3,
        spaceBetween: 30
      }
    }
  };

  constructor(
    private router: Router,
    private modalCtrl: ModalController,
    private alertCtrl: AlertController,
    private apiService: ApiService,
    private navCtrl: NavController,
    private notificationService: NotificationService,
    private requestNotificationService: RequestNotificationService
  ) {
    console.log('Dashboard component constructed');
  }

  ngOnInit() {
    console.log('Dashboard component initialized');
    
    // Note: Dashboard is now public - no authentication required for browsing
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');  // Changed from userInfo to user
    console.log('Token exists:', !!token);
    console.log('User exists:', !!user);
    
    this.loadCompanies();
    this.loadVehicles();
    
    // Only update notification count if user is logged in
    if (token && user) {
      this.updateNotificationCount();
      this.updateRequestNotificationCount();
    }
  }

  ionViewWillEnter() {
    // Refresh notification count when returning to dashboard
    console.log('Dashboard ionViewWillEnter - updating notification count');
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    // Only update notification count if user is logged in
    if (token && user) {
      this.updateNotificationCount();
      this.updateRequestNotificationCount();
    }
  }

  loadCompanies() {
    this.apiService.getCompanies().subscribe({
      next: (companies) => {
        console.log('Companies loaded:', companies);
        this.companies = Array.isArray(companies) ? companies : [];
        // Don't set loading to false here - let loadVehicles handle it
      },
      error: (error) => {
        console.error('Error loading companies:', error);
        this.companies = []; // Set empty array on error
        // Don't set loading to false here - let loadVehicles handle it
      }
    });
  }

  loadVehicles() {
    this.loading = true;
    this.error = null; // Clear previous errors
    this.apiService.getVehicles().subscribe({
      next: (vehicles) => {
        console.log('Vehicles loaded:', vehicles);
        console.log('Vehicles type:', typeof vehicles);
        console.log('Is array:', Array.isArray(vehicles));
        
        // Ensure vehicles is an array
        if (Array.isArray(vehicles)) {
          this.vehicles = vehicles;
          this.filteredVehicles = [...vehicles];
          console.log('Vehicles count:', vehicles.length);
        } else {
          console.warn('Vehicles response is not an array:', vehicles);
          this.vehicles = [];
          this.filteredVehicles = [];
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading vehicles:', error);
        console.error('Error details:', JSON.stringify(error));
        this.vehicles = [];
        this.filteredVehicles = [];
        this.error = 'Failed to load vehicles. Please try again.';
        this.loading = false;
      }
    });
  }

  filterByCategory(event: any) {
    const category = event.detail.value;
    this.selectedCategory = category;
    this.showAllVehicles = false; // Reset on filter
    
    if (category === 'all') {
      this.filteredVehicles = [...this.vehicles];
    } else {
      this.filteredVehicles = this.vehicles.filter(vehicle => 
        vehicle.type.toLowerCase() === category.toLowerCase()
      );
    }
  }

  selectCategory(category: string) {
    this.selectedCategory = category;
    this.showAllVehicles = false; // Reset on filter
    
    if (category === 'all') {
      this.filteredVehicles = [...this.vehicles];
    } else {
      this.filteredVehicles = this.vehicles.filter(vehicle => 
        vehicle.type.toLowerCase() === category.toLowerCase()
      );
    }
  }

  toggleFilters() {
    this.showFilters = !this.showFilters;
  }

  getCategoryLabel(category: string): string {
    const labels: { [key: string]: string } = {
      'all': 'All',
      'sedan': 'Sedan',
      'suv': 'SUV',
      'hatchback': 'Hatchback',
      'coupe': 'Coupe',
      'convertible': 'Convertible',
      'truck': 'Truck',
      'van': 'Van',
      'motorcycle': 'Motorcycle',
      'bus': 'Bus',
      'other': 'Other'
    };
    return labels[category] || 'All';
  }

  searchVehicles(event: any) {
    const searchTerm = event.detail.value.toLowerCase();
    this.showAllVehicles = false; // Reset on search
    this.filteredVehicles = this.vehicles.filter(vehicle =>
      vehicle.name.toLowerCase().includes(searchTerm) ||
      vehicle.type.toLowerCase().includes(searchTerm)
    );
  }

  viewCompanyDetails(companyId: number) {
    this.router.navigate(['/company', companyId]);
  }

  viewVehicleDetails(vehicleId: number) {
    this.router.navigate(['/vehicle', vehicleId]);
  }

  refreshDashboard(event: any) {
    this.loadCompanies();
    this.loadVehicles();
    event.target.complete();
  }

  // Vehicle status helper functions
  isVehicleAvailable(vehicle: Vehicle): boolean {
    return vehicle.status === 'available' || !vehicle.status;
  }

  getStatusColor(status: string | undefined): string {
    if (!status) return 'success';
    
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case 'available':
        return 'success';
      case 'under maintenance':
        return 'warning';
      case 'currently rented':
        return 'tertiary';
      case 'unavailable':
        return 'danger';
      default:
        return 'medium';
    }
  }

  getStatusLabel(status: string | undefined): string {
    if (!status) return 'Available';
    
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case 'available':
        return 'Available';
      case 'under maintenance':
        return 'Maintenance';
      case 'currently rented':
        return 'Rented';
      case 'unavailable':
        return 'Unavailable';
      default:
        return status;
    }
  }

  // Removed global logout from dashboard; logout is now on Profile page only

  async openTermsOfService() {
    const modal = await this.modalCtrl.create({
      component: TermsModalComponent
    });
    return await modal.present();
  }

  async openPrivacyPolicy() {
    const modal = await this.modalCtrl.create({
      component: PrivacyModalComponent
    });
    return await modal.present();
  }

  navigateToMyRentals() {
    console.log('Navigating to My Rentals...');
    const user = localStorage.getItem('user');
    if (user) {
      this.router.navigate(['/my-rentals']);
    } else {
      this.showLoginAlert();
    }
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

  navigateToProfile() {
    console.log('Navigating to Profile...');
    this.router.navigate(['/profile']);
  }

  navigateToHome() {
    console.log('Already on Home page');
    // Already on home page, could scroll to top or refresh
  }

  navigateToRequests() {
    console.log('Navigating to Requests...');
    const user = localStorage.getItem('user');
    if (user) {
      this.router.navigate(['/booking-requests']);
    } else {
      this.showLoginAlert();
    }
  }

  navigateToNotifications() {
    console.log('Navigating to Notifications...');
    this.router.navigate(['/notifications']);
  }

  getCompanyName(companyId: number): string {
    const company = this.companies.find(c => c.id === companyId);
    return company ? company.name : 'Unknown Company';
  }

  updateNotificationCount() {
    console.log('Updating notification count...');
    this.notificationService.updateUnreadCount();
    this.notificationService.unreadCount$.subscribe(count => {
      console.log('Unread count updated:', count);
      this.unreadCount = count;
    });
  }

  updateRequestNotificationCount() {
    console.log('Updating request notification count...');
    this.requestNotificationService.updateUnreadCount();
    this.requestNotificationService.unreadCount$.subscribe(count => {
      console.log('Request unread count updated:', count);
      this.requestUnreadCount = count;
    });
  }

  // Check if user is properly authenticated
  private   checkAuthentication() {
    // Now optional - allow guest browsing
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
      console.log('User is authenticated');
      return true;
    }
    
    console.log('User is browsing as guest');
    return false; // But don't redirect - allow guest access
  }

}
