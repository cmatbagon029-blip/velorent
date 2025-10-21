import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../api.service';
import { RentalCompany } from '../../models/rental-company.model';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { 
  personOutline,
  callOutline,
  mailOutline,
  locationOutline,
  globeOutline,
  star,
  carOutline
} from 'ionicons/icons';

// Register icons
addIcons({ 
  'person-outline': personOutline,
  'call-outline': callOutline,
  'mail-outline': mailOutline,
  'location-outline': locationOutline,
  'globe-outline': globeOutline,
  star,
  'car-outline': carOutline
});

interface Vehicle {
  id: number;
  name: string;
  type: string;
  price: number;
  price_with_driver?: number;
  price_without_driver?: number;
  imageUrl?: string;
  rating?: number;
  discount?: number;
  company_id?: number;
  description?: string;
  features?: string;
}

@Component({
  selector: 'app-company-details',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
  templateUrl: './company-details.page.html',
  styleUrls: ['./company-details.page.scss']
})
export class CompanyDetailsPage implements OnInit {
  company: RentalCompany | null = null;
  vehicles: Vehicle[] = [];
  loading: boolean = true;
  error: string | null = null;
  selectedCategory: string = 'all';
  filteredVehicles: Vehicle[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService
  ) {}

  ngOnInit() {
    const companyId = this.route.snapshot.paramMap.get('id');
    if (companyId) {
      this.loadCompanyDetails(parseInt(companyId));
      this.loadCompanyVehicles(parseInt(companyId));
    }
  }

  loadCompanyDetails(companyId: number) {
    this.loading = true;
    this.apiService.getCompany(companyId).subscribe({
      next: (company: RentalCompany) => {
        this.company = company;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading company:', error);
        this.error = 'Failed to load company details. Please try again.';
        this.loading = false;
      }
    });
  }

  loadCompanyVehicles(companyId: number) {
    this.loading = true;
    this.apiService.getVehicles().subscribe({
      next: (vehicles) => {
        this.vehicles = vehicles.filter(v => v.company_id === companyId);
        this.filteredVehicles = [...this.vehicles];
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading vehicles:', error);
        this.error = 'Failed to load vehicles. Please try again.';
        this.loading = false;
      }
    });
  }

  filterByCategory(event: any) {
    const category = event.detail.value;
    this.selectedCategory = category;
    
    if (category === 'all') {
      this.filteredVehicles = [...this.vehicles];
    } else {
      this.filteredVehicles = this.vehicles.filter(vehicle => 
        vehicle.type.toLowerCase() === category.toLowerCase()
      );
    }
  }

  searchVehicles(event: any) {
    const searchTerm = event.detail.value.toLowerCase();
    this.filteredVehicles = this.vehicles.filter(vehicle =>
      vehicle.name.toLowerCase().includes(searchTerm) ||
      vehicle.type.toLowerCase().includes(searchTerm)
    );
  }

  viewVehicleDetails(vehicleId: number) {
    this.router.navigate(['/vehicle', vehicleId]);
  }

  refreshCompany(event: any) {
    const companyId = this.route.snapshot.paramMap.get('id');
    if (companyId) {
      this.loadCompanyDetails(parseInt(companyId));
    }
    event.target.complete();
  }
} 