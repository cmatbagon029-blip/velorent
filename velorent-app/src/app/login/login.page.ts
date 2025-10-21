import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { IonicModule, ModalController, NavController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { AlertModalComponent } from '../components/alert-modal/alert-modal.component';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { eyeOutline, eyeOffOutline } from 'ionicons/icons';

addIcons({ eyeOutline, eyeOffOutline });

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [IonicModule, FormsModule, RouterModule, CommonModule, ReactiveFormsModule],
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {
  email = '';
  password = '';
  isLockedOut = false;
  remainingTime = 0;
  private lockoutInterval: any;
  loginForm: FormGroup;
  showPassword = false;
  isLoading = false;

  constructor(
    private navCtrl: NavController,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private modalCtrl: ModalController,
    private formBuilder: FormBuilder
  ) {
    // Clear any existing auth data when landing on login page
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  ngOnInit() {
    // If user is already logged in, redirect to dashboard
    const token = localStorage.getItem('token');
    if (token) {
      const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
      this.router.navigateByUrl(returnUrl || '/dashboard', { replaceUrl: true });
      return;
    }
    this.checkLockoutStatus();
  }

  ngOnDestroy() {
    if (this.lockoutInterval) {
      clearInterval(this.lockoutInterval);
    }
  }

  private checkLockoutStatus() {
    this.isLockedOut = this.authService.isLockedOut();
    if (this.isLockedOut) {
      this.startLockoutTimer();
    }
  }

  private startLockoutTimer() {
    this.updateRemainingTime();
    this.lockoutInterval = setInterval(() => {
      this.updateRemainingTime();
    }, 1000);
  }

  private updateRemainingTime() {
    this.remainingTime = this.authService.getRemainingLockoutTime();
    if (this.remainingTime <= 0) {
      this.isLockedOut = false;
      clearInterval(this.lockoutInterval);
    }
  }

  private async showAlert(title: string, message: string, type: 'error' | 'info' = 'error') {
    const modal = await this.modalCtrl.create({
      component: AlertModalComponent,
      componentProps: {
        title,
        message,
        type
      },
      cssClass: 'alert-modal'
    });
    return modal.present();
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  async login() {
    if (this.isLockedOut) {
      return;
    }

    if (this.loginForm.valid) {
      this.isLoading = true;
      try {
        const response = await this.authService.login(this.loginForm.value.email, this.loginForm.value.password);
        
        if (response.success) {
          console.log('Login successful, navigating to dashboard...');
          const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
          this.navCtrl.navigateRoot(returnUrl || '/dashboard');
        } else {
          await this.showAlert('Login Failed', response.message);
          this.checkLockoutStatus();
        }
      } catch (err: any) {
        console.error('Login error:', err);
        if (err.response) {
          await this.showAlert('Error', err.response.data.message || 'Login failed. Please try again.');
        } else {
          await this.showAlert('Error', 'Network error. Please check if the server is running.');
        }
        this.checkLockoutStatus();
      } finally {
        this.isLoading = false;
      }
    }
  }
}