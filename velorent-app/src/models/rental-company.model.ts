export interface RentalCompany {
  id: number;
  name: string;
  logoUrl?: string;
  description?: string;
  rating?: number;
  location?: string;
  contactNumber?: string;
  email?: string;
  website?: string;
  address?: string;
  contactPerson?: string;
  vehicles?: number[];
}

export interface Vehicle {
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