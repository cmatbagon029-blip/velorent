import { Vehicle } from './vehicle.model';
import { RentalCompany } from './rental-company.model';

export interface Rental {
  id: number;
  userId: number;
  vehicleId: number;
  companyId: number;
  startDate: string;
  endDate: string;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  totalPrice: number;
  createdAt: string;
  updatedAt: string;
  vehicle?: Vehicle;
  company?: RentalCompany;
} 