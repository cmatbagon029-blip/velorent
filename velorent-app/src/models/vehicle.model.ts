export interface Vehicle {
  id: number;
  name: string;
  model?: string;
  type: string;
  price: number;
  price_with_driver?: number;
  price_without_driver?: number;
  owner?: string;
  imageUrl?: string;
  rating?: number;
  company_id?: number;
  company_name?: string;
  description?: string;
  features?: string;
  year?: string;
  color?: string;
  engine_size?: string;
  transmission?: string;
  mileage?: string;
  capacity?: string;
  status?: string;
} 