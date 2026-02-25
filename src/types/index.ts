// Database Types
export type UserRole = "ADMIN" | "GUARD" | "USER";
export type VehicleStatus = "AVAILABLE" | "RENTED" | "MAINTENANCE";
export type VehicleType = "CAR" | "MOTORCYCLE" | "TRUCK" | "VAN";
export type RentalStatus = "ACTIVE" | "COMPLETED" | "CANCELLED";

export interface AppUser {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  branch_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Branch {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface Vehicle {
  id: string;
  code: string;
  type: VehicleType;
  brand: string | null;
  model: string | null;
  year: number | null;
  plate_number: string | null;
  status: VehicleStatus;
  branch_id: string;
  daily_rate: number;
  created_at: string;
  updated_at: string;
}

export interface Rental {
  id: string;
  vehicle_id: string;
  customer_name: string;
  customer_phone: string;
  customer_id_number: string | null;
  start_date: string;
  end_date: string | null;
  daily_rate: number;
  total_amount: number | null;
  status: RentalStatus;
  guard_id: string;
  branch_id: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// UI State Types
export interface DashboardStats {
  totalVehicles: number;
  availableVehicles: number;
  rentedVehicles: number;
  maintenanceVehicles: number;
  rentalsToday: number;
  rentalsThisMonth: number;
  totalRevenue: number;
}

// API Response Types
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
