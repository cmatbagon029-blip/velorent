import { Component, OnInit } from '@angular/core';
import { IonicModule, ModalController, AlertController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { NotificationService } from '../services/notification.service';
import { TermsModalComponent } from '../settings/settings.page';
import { PrivacyModalComponent } from '../settings/settings.page';
import { addIcons } from 'ionicons';
import { 
  home,
  carOutline,
  carSportOutline,
  personOutline,
  personCircle,
  personCircleOutline,
  logInOutline,
  notificationsOutline,
  locationOutline,
  languageOutline,
  shieldOutline,
  documentTextOutline,
  helpCircleOutline,
  informationCircleOutline,
  mailOutline,
  createOutline,
  keyOutline,
  settingsOutline,
  logOutOutline,
  calendarOutline,
  logoGoogle,
  logoFacebook
} from 'ionicons/icons';

// Register icons
addIcons({ 
  home,
  'car-outline': carOutline,
  'car-sport-outline': carSportOutline,
  'person-outline': personOutline,
  'person-circle': personCircle,
  'person-circle-outline': personCircleOutline,
  'log-in-outline': logInOutline,
  'notifications-outline': notificationsOutline,
  'location-outline': locationOutline,
  'language-outline': languageOutline,
  'shield-outline': shieldOutline,
  'document-text-outline': documentTextOutline,
  'help-circle-outline': helpCircleOutline,
  'information-circle-outline': informationCircleOutline,
  'mail-outline': mailOutline,
  'create-outline': createOutline,
  'key-outline': keyOutline,
  'settings-outline': settingsOutline,
  'log-out-outline': logOutOutline,
  'calendar-outline': calendarOutline,
  'logo-google': logoGoogle,
  'logo-facebook': logoFacebook
});

// About Modal Component
@Component({
  selector: 'app-about-modal',
  standalone: true,
  imports: [IonicModule, CommonModule],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>About VeloRent</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="dismiss()">Close</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <div class="about-content">
        <div class="about-header">
          <ion-icon name="car-sport-outline" class="app-icon"></ion-icon>
          <h2>VeloRent</h2>
        </div>
        
        <p><strong>VeloRent</strong> is a comprehensive vehicle rental management system designed to connect customers with rental companies.</p>
        
        <h3>Features:</h3>
        <ul>
          <li>Browse and search vehicles</li>
          <li>Book vehicles with or without drivers</li>
          <li>Manage your bookings</li>
          <li>Real-time booking status updates</li>
        </ul>
        
        <h3>Developed by:</h3>
        <p>Westen Leyte College of Ormoc</p>
        <p>Capstone Project 2025</p>
      </div>
    </ion-content>
  `,
  styles: [`
    :host {
      --background: #000000;
      --ion-background-color: #000000;
    }
    
    ion-header {
      --background: #000000;
      background: #000000 !important;
    }
    
    ion-toolbar {
      --background: #000000;
      background: #000000 !important;
    }
    
    ion-title {
      color: #ffd700 !important;
    }
    
    ion-content {
      --background: #000000;
      background: #000000 !important;
    }
    
    .about-content {
      max-width: 800px;
      margin: 0 auto;
      background: #000000;
    }
    
    .about-header {
      text-align: center;
      margin-bottom: 24px;
      
      .app-icon {
        font-size: 64px;
        color: #ffd700;
        margin-bottom: 16px;
      }
      
      h2 {
        color: #ffd700;
        font-size: 2rem;
        font-weight: 700;
        margin: 0;
      }
    }
    
    h3 {
      color: #ffd700;
      font-size: 1.2rem;
      font-weight: 600;
      margin-top: 24px;
      margin-bottom: 12px;
    }
    
    p {
      color: #e0e0e0;
      line-height: 1.6;
      margin-bottom: 12px;
      
      strong {
        color: #ffd700;
      }
    }
    
    ul {
      color: #e0e0e0;
      line-height: 1.8;
      padding-left: 20px;
      
      li {
        margin-bottom: 8px;
      }
    }
  `]
})
export class AboutModalComponent {
  constructor(private modalCtrl: ModalController) {}

  dismiss() {
    this.modalCtrl.dismiss();
  }
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss']
})
export class ProfilePage implements OnInit {
  user: any = null;
  unreadCount: number = 0;
  
  // App Settings (Available to all users)
  notifications: boolean = true;
  locationServices: boolean = true;

  constructor(
    private authService: AuthService, 
    private router: Router,
    private modalController: ModalController,
    private alertController: AlertController,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    this.loadUserData();
    this.loadSettings();
    this.updateNotificationCount();
  }

  ionViewWillEnter() {
    // Refresh user data when page is about to be displayed
    this.loadUserData();
    this.updateNotificationCount();
  }

  loadUserData() {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (userStr) {
      try {
        this.user = JSON.parse(userStr);
        console.log('User data loaded:', this.user.name, this.user.email);
      } catch (error) {
        console.error('Error parsing user data:', error);
        this.user = null;
      }
    } else {
      this.user = null;
    }
  }

  loadSettings() {
    // Load settings from localStorage
    this.notifications = localStorage.getItem('notifications') === 'true' || true;
    this.locationServices = localStorage.getItem('locationServices') === 'true' || true;
  }

  saveSettings() {
    // Save settings to localStorage
    localStorage.setItem('notifications', this.notifications.toString());
    localStorage.setItem('locationServices', this.locationServices.toString());
  }

  toggleNotifications() {
    this.saveSettings();
    if (this.notifications) {
      this.showAlert('Notifications Enabled', 'You will receive push notifications for booking updates and important announcements.');
    } else {
      this.showAlert('Notifications Disabled', 'You will not receive push notifications. You can enable them anytime in settings.');
    }
  }

  toggleLocationServices() {
    this.saveSettings();
    if (this.locationServices) {
      this.showAlert('Location Services Enabled', 'Location services will help us provide better vehicle recommendations and accurate pickup locations.');
    } else {
      this.showAlert('Location Services Disabled', 'Some features may not work optimally without location services.');
    }
  }

  openLanguageSettings() {
    this.showAlert('Language Settings', 'Currently only English is available. More languages will be added in future updates.');
  }

  // Legal & Support Methods
  async openPrivacyPolicy() {
    const modal = await this.modalController.create({
      component: PrivacyModalComponent
    });
    return await modal.present();
  }

  async openTermsOfService() {
    const modal = await this.modalController.create({
      component: TermsModalComponent
    });
    return await modal.present();
  }

  async openHelp() {
    const alert = await this.alertController.create({
      header: 'Help & Support',
      message: `
        <p><strong>How to book a vehicle:</strong></p>
        <p>1. Browse available vehicles on the home page</p>
        <p>2. Select a vehicle and choose your dates</p>
        <p>3. Fill in your details and confirm booking</p>
        <p>4. Wait for approval from the rental company</p>
        
        <p><strong>Need more help?</strong></p>
        <p>Contact us at: support@velorent.com</p>
        <p>Phone: +63 123 456 7890</p>
      `,
      buttons: ['OK']
    });
    await alert.present();
  }

  async openAbout() {
    const modal = await this.modalController.create({
      component: AboutModalComponent
    });
    return await modal.present();
  }

  async openContact() {
    const alert = await this.alertController.create({
      header: 'Contact Us',
      message: `
        <p><strong>Get in touch with us:</strong></p>
        
        <p><strong>Email:</strong> support@velorent.com</p>
        <p><strong>Phone:</strong> +63 123 456 7890</p>
        <p><strong>Address:</strong> Ormoc City, Leyte, Philippines</p>
        
        <p><strong>Business Hours:</strong></p>
        <p>Monday - Friday: 8:00 AM - 6:00 PM</p>
        <p>Saturday: 9:00 AM - 4:00 PM</p>
        <p>Sunday: Closed</p>
      `,
      buttons: ['OK']
    });
    await alert.present();
  }

  // Account Management Methods (Only for logged-in users)
  async openEditProfile() {
    if (!this.user) return;
    
    const alert = await this.alertController.create({
      header: 'Edit Profile',
      message: 'Profile editing feature will be available in the next update.',
      buttons: ['OK']
    });
    await alert.present();
  }

  async openChangePassword() {
    if (!this.user) return;
    
    const alert = await this.alertController.create({
      header: 'Change Password',
      message: 'Password change feature will be available in the next update.',
      buttons: ['OK']
    });
    await alert.present();
  }

  async openAccountSettings() {
    if (!this.user) return;
    
    const alert = await this.alertController.create({
      header: 'Account Settings',
      message: 'Advanced account settings will be available in the next update.',
      buttons: ['OK']
    });
    await alert.present();
  }

  // Authentication Methods
  logout() {
    if (this.user) {
      this.authService.logout();
      this.user = null;
      this.showAlert('Logged Out', 'You have been successfully logged out.');
    }
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  // Navigation methods for bottom navigation
  navigateToHome() {
    this.router.navigate(['/dashboard']);
  }

  navigateToNotifications() {
    console.log('Navigating to Notifications...');
    this.router.navigate(['/notifications']);
  }

  navigateToMyRentals() {
    if (this.user) {
      this.router.navigate(['/my-rentals']);
    } else {
      this.showAlert('Login Required', 'Please log in to view your rentals.');
    }
  }

  navigateToRequests() {
    if (this.user) {
      this.router.navigate(['/booking-requests']);
    } else {
      this.showAlert('Login Required', 'Please log in to view your requests.');
    }
  }

  navigateToProfile() {
    // Already on profile page
    console.log('Already on Profile page');
  }

  // Helper method for showing alerts
  private async showAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }

  updateNotificationCount() {
    this.notificationService.updateUnreadCount();
    this.notificationService.unreadCount$.subscribe(count => {
      this.unreadCount = count;
    });
  }
}