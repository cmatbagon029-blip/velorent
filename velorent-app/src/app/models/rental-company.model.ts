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