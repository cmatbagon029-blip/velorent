import { Component, OnInit } from '@angular/core';
import { IonicModule, AlertController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../api.service';
import { FormsModule } from '@angular/forms';
import { Vehicle } from '../../models/vehicle.model';

@Component({
  selector: 'app-vehicle-details',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
  templateUrl: './vehicle-details.page.html',
  styleUrls: ['./vehicle-details.page.scss']
})
export class VehicleDetailsPage implements OnInit {
  vehicle: Vehicle | null = null;
  loading: boolean = true;
  error: string | null = null;
  startDate: string = '';
  endDate: string = '';
  totalPrice: number = 0;
  minDate: string = new Date().toISOString().split('T')[0]; // Today's date in YYYY-MM-DD format

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private alertController: AlertController
  ) {}

  ngOnInit() {
    const vehicleId = this.route.snapshot.paramMap.get('id');
    if (vehicleId) {
      this.loadVehicleDetails(parseInt(vehicleId));
    }
  }

  loadVehicleDetails(vehicleId: number) {
    this.loading = true;
    this.apiService.getVehicle(vehicleId).subscribe({
      next: (vehicle) => {
        this.vehicle = vehicle;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading vehicle details:', error);
        this.error = 'Failed to load vehicle details. Please try again.';
        this.loading = false;
      }
    });
  }

  calculateTotalPrice() {
    if (!this.startDate || !this.endDate || !this.vehicle) return;

    const start = new Date(this.startDate);
    const end = new Date(this.endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    if (days > 0) {
      this.totalPrice = days * this.vehicle.price;
    } else {
      this.totalPrice = 0;
    }
  }

  rentVehicle() {
    if (!this.vehicle || !this.startDate || !this.endDate) return;

    const rentalData = {
      vehicleId: this.vehicle.id,
      startDate: this.startDate,
      endDate: this.endDate,
      totalPrice: this.totalPrice
    };

    this.apiService.createRental(rentalData).subscribe({
      next: (response) => {
        // Navigate to rental confirmation or my rentals page
        this.router.navigate(['/my-rentals']);
      },
      error: (error) => {
        console.error('Error creating rental:', error);
        this.error = 'Failed to create rental. Please try again.';
      }
    });
  }

  refreshVehicle(event: any) {
    const vehicleId = this.route.snapshot.paramMap.get('id');
    if (vehicleId) {
      this.loadVehicleDetails(parseInt(vehicleId));
    }
    event.target.complete();
  }

  async goToRentVehicle() {
    if (!this.vehicle || !this.isVehicleAvailable()) {
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      await this.showLoginRequiredModal();
      return;
    }

      this.router.navigate(['/rent-vehicle'], { queryParams: { vehicleId: this.vehicle.id } });
    }

  private async showLoginRequiredModal() {
    const alert = await this.alertController.create({
      header: 'Login Required',
      message: 'Please log in first to book this vehicle.',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Go to Login',
          handler: () => {
            this.router.navigate(['/login'], {
              queryParams: { returnUrl: `/rent-vehicle?vehicleId=${this.vehicle?.id}` }
            });
          }
        }
      ]
    });

    await alert.present();
  }

  // Vehicle status helper functions
  isVehicleAvailable(): boolean {
    return this.vehicle?.status === 'available' || !this.vehicle?.status;
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
        return 'Under Maintenance';
      case 'currently rented':
        return 'Currently Rented';
      case 'unavailable':
        return 'Unavailable';
      default:
        return status;
    }
  }
} 