export interface Vehicle {
  id: number;
  name: string;
  type: string;
  price: number;
  price_with_driver?: number;
  price_without_driver?: number;
  owner?: string;
  imageUrl?: string;
  rating?: number;
  company_id?: number;
  description?: string;
  features?: string;
} 