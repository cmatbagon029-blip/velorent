import { Component, OnInit } from '@angular/core';
import { IonicModule, ModalController, AlertController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { TermsModalComponent } from '../settings/settings.page';
import { PrivacyModalComponent } from '../settings/settings.page';
import { addIcons } from 'ionicons';
import { 
  home, 
  searchOutline, 
  carOutline, 
  personOutline,
  personCircle,
  logInOutline,
  personAddOutline,
  moonOutline,
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
  carSportOutline
} from 'ionicons/icons';

// Register icons
addIcons({ 
  home, 
  'search-outline': searchOutline, 
  'car-outline': carOutline, 
  'person-outline': personOutline,
  'person-circle': personCircle,
  'log-in-outline': logInOutline,
  'person-add-outline': personAddOutline,
  'moon-outline': moonOutline,
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
  'car-sport-outline': carSportOutline
});

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss']
})
export class ProfilePage implements OnInit {
  user: any = null;
  
  // App Settings (Available to all users)
  darkMode: boolean = true;
  notifications: boolean = true;
  locationServices: boolean = true;

  constructor(
    private authService: AuthService, 
    private router: Router,
    private modalController: ModalController,
    private alertController: AlertController
  ) {}

  ngOnInit() {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      this.user = JSON.parse(userStr);
    }
    
    // Load saved settings
    this.loadSettings();
  }

  loadSettings() {
    // Load settings from localStorage
    this.darkMode = localStorage.getItem('darkMode') === 'true' || true;
    this.notifications = localStorage.getItem('notifications') === 'true' || true;
    this.locationServices = localStorage.getItem('locationServices') === 'true' || true;
  }

  saveSettings() {
    // Save settings to localStorage
    localStorage.setItem('darkMode', this.darkMode.toString());
    localStorage.setItem('notifications', this.notifications.toString());
    localStorage.setItem('locationServices', this.locationServices.toString());
  }

  // App Settings Methods
  toggleDarkMode() {
    this.saveSettings();
    // Apply dark mode theme
    document.body.classList.toggle('dark', this.darkMode);
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
    const alert = await this.alertController.create({
      header: 'About VeloRent',
      message: `
        <p><strong>VeloRent</strong> is a comprehensive vehicle rental management system designed to connect customers with rental companies.</p>
        
        <p><strong>Features:</strong></p>
        <p>• Browse and search vehicles</p>
        <p>• Book vehicles with or without drivers</p>
        <p>• Manage your bookings</p>
        <p>• Real-time booking status updates</p>
        
        <p><strong>Developed by:</strong></p>
        <p>Westen Leyte College of Ormoc</p>
        <p>Capstone Project 2025</p>
      `,
      buttons: ['OK']
    });
    await alert.present();
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

  goToRegister() {
    this.router.navigate(['/register']);
  }

  // Navigation methods
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
}