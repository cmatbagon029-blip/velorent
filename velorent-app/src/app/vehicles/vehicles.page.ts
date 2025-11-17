import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { ApiService } from '../api.service';
import { Router } from '@angular/router';

interface Vehicle {
  id: number;
  name: string;
  type: string;
  price: number;
  price_with_driver?: number;
  price_without_driver?: number;
  imageUrl?: string; // Optional property for vehicle image
  status?: string;
}

@Component({
  selector: 'app-vehicles',
  standalone: true,
  imports: [IonicModule, CommonModule],
  templateUrl: './vehicles.page.html',
  styleUrls: ['./vehicles.page.scss'],
})
export class VehiclesPage implements OnInit {
  vehicles: Vehicle[] = [];
  loading: boolean = true;
  error: string | null = null;

  constructor(
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadVehicles();
  }

  loadVehicles() {
    this.loading = true;
    this.error = null;
    
    this.apiService.getVehicles().subscribe({
      next: (data) => {
        this.vehicles = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load vehicles. Please try again later.';
        this.loading = false;
        console.error('Error loading vehicles:', err);
      }
    });
  }

  viewVehicleDetails(vehicleId: number) {
    this.router.navigate(['/vehicle', vehicleId]);
  }

  refreshVehicles(event: any) {
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
}
