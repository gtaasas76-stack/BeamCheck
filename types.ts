
export enum AppTab {
  HOME = 'home',
  FUEL = 'fuel',
  MAP = 'map',
  HEALTH = 'health',
  CALC = 'calc',
  EMERGENCY = 'emergency',
  ABOUT = 'about'
}

export interface FuelPrice {
  type: string;
  price: number;
}

export interface GasStation {
  name: string;
  address: string;
  distance?: string;
  rating?: number;
  uri?: string;
}

export interface VehicleSymptom {
  part: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
}

export interface TripCalculation {
  distance: number;
  consumptionRate: number;
  fuelPrice: number;
  totalCost: number;
  totalFuelUsed: number;
}
