import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { TermsOfServicePage } from './terms-of-service/terms-of-service.page';
import { LoginPage } from './login/login.page';
import { RegisterPage } from './register/register.page';
import { DashboardPage } from './dashboard/dashboard.page';
import { CompanyDetailsPage } from './company-details/company-details.page';
import { VehicleDetailsPage } from './vehicle-details/vehicle-details.page';
import { MyRentalsPage } from './my-rentals/my-rentals.page';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'vehicles',
    loadComponent: () => import('./vehicles/vehicles.page').then(m => m.VehiclesPage),
    // Public route: browsing vehicles does not require auth
  },
  {
    path: 'login',
    loadComponent: () => import('./login/login.page').then(m => m.LoginPage),
  },
  {
    path: 'register',
    loadComponent: () => import('./register/register.page').then(m => m.RegisterPage),
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard.page').then(m => m.DashboardPage),
  },
  {
    path: 'settings',
    loadComponent: () => import('./settings/settings.page').then((m) => m.SettingsPage),
  },
  {
    path: 'privacy-policy',
    loadComponent: () => import('./privacy-policy/privacy-policy.page').then((m) => m.PrivacyPolicyPage),
  },
  {
    path: 'terms-of-service',
    component: TermsOfServicePage
  },
  {
    path: 'my-rentals',
    loadComponent: () => import('./my-rentals/my-rentals.page').then(m => m.MyRentalsPage),
    canActivate: [authGuard], // Require authentication to access my-rentals
  },
  {
    path: 'vehicle/:id',
    loadComponent: () => import('./vehicle-details/vehicle-details.page').then(m => m.VehicleDetailsPage),
    // Public route: viewing vehicle details does not require auth
  },
  {
    path: 'company/:id',
    loadComponent: () => import('./company-details/company-details.page').then(m => m.CompanyDetailsPage),
    // Public route: viewing company details does not require auth
  },
  {
    path: 'rent-vehicle',
    loadComponent: () => import('./rent-vehicle/rent-vehicle.page').then(m => m.RentVehiclePage),
  },
  {
    path: 'profile',
    loadComponent: () => import('./profile/profile.page').then(m => m.ProfilePage),
  },
  {
    path: 'notifications',
    loadComponent: () => import('./notifications/notifications.page').then(m => m.NotificationsPage),
  },
  {
    path: 'chat',
    loadComponent: () => import('./chat/chat.page').then(m => m.ChatPage),
  },
  {
    path: 'auth/google/callback',
    loadComponent: () => import('./auth/google-callback/google-callback.component').then(m => m.GoogleCallbackComponent),
  },
  {
    path: 'auth/facebook/callback',
    loadComponent: () => import('./auth/facebook-callback/facebook-callback.component').then(m => m.FacebookCallbackComponent),
  },
];
