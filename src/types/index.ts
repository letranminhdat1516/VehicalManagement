// Database Types
export type UserRole = "ADMIN" | "GUARD" | "USER";
export type VehicleStatus = "AVAILABLE" | "BORROWING" | "MAINTENANCE";
export type VehicleType = "CAR" | "MOTORCYCLE" | "TRUCK" | "VAN" | "WHEELCHAIR" | "STROLLER";
export type RentalStatus = "PENDING" | "BORROWING" | "RETURNED" | "CANCELLED";

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
  status: VehicleStatus;
  branch_id: string;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface Rental {
  id: string;
  vehicle_id: string;
  branch_id: string | null;
  customer_name: string;
  phone: string;
  citizen_id_hash: string | null;
  citizen_id_last4: string | null;
  citizen_image_path: string | null;
  status: RentalStatus;
  borrow_time: string;
  approved_at: string | null;
  approved_by: string | null;
  return_time: string | null;
  returned_by: string | null;
  note: string | null;
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
