import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../api.service';
import { FormsModule } from '@angular/forms';

interface Vehicle {
  id: number;
  name: string;
  type: string;
  price: number;
  imageUrl?: string;
  rating?: number;
  discount?: number;
  company_id?: number;
  description?: string;
  features?: string;
}

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
  selectedDate: string = '';
  selectedDuration: number = 1;
  minDate: string;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService
  ) {
    // Set minimum date to today
    const today = new Date();
    this.minDate = today.toISOString();
  }

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
        console.error('Error loading vehicle:', error);
        this.error = 'Failed to load vehicle details. Please try again.';
        this.loading = false;
      }
    });
  }

  calculateTotalPrice(): number {
    if (!this.vehicle || !this.selectedDuration) return 0;
    const basePrice = this.vehicle.price;
    const discount = this.vehicle.discount || 0;
    const discountedPrice = basePrice * (1 - discount / 100);
    return discountedPrice * this.selectedDuration;
  }

  rentVehicle() {
    if (!this.vehicle || !this.selectedDate) {
      // Show error message
      return;
    }

    const rentalData = {
      vehicleId: this.vehicle.id,
      startDate: this.selectedDate,
      duration: this.selectedDuration,
      totalPrice: this.calculateTotalPrice()
    };

    this.apiService.createRental(rentalData).subscribe({
      next: (response) => {
        // Show success message and navigate to my rentals
        this.router.navigate(['/my-rentals']);
      },
      error: (error) => {
        console.error('Error creating rental:', error);
        // Show error message
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
} 