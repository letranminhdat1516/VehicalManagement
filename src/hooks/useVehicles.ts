"use client";

import { useState, useEffect, useCallback } from "react";
import { vehicleService } from "@/src/services/vehicleService";
import { Vehicle, UserRole } from "@/src/types";

export function useVehicles(userRole: UserRole, branchId: string | null) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadVehicles = useCallback(async () => {
    console.log("Loading vehicles...");
    setLoading(true);
    const response = await vehicleService.getVehicles(userRole, branchId);
    
    if (response.error || !response.data) {
      setError(response.error);
      setVehicles([]);
    } else {
      console.log("Vehicles loaded:", response.data);
      setVehicles(response.data);
      setError(null);
    }
    
    setLoading(false);
  }, [userRole, branchId]);

  useEffect(() => {
    loadVehicles();
  }, [loadVehicles]);

  const createVehicle = async (vehicle: Partial<Vehicle>) => {
    const response = await vehicleService.createVehicle(vehicle);
    
    if (response.error) {
      return { success: false, error: response.error };
    }
    
    await loadVehicles();
    return { success: true, error: null };
  };

  const updateVehicle = async (id: string, updates: Partial<Vehicle>) => {
    const response = await vehicleService.updateVehicle(id, updates);
    
    if (response.error) {
      return { success: false, error: response.error };
    }
    
    await loadVehicles();
    return { success: true, error: null };
  };

  const deleteVehicle = async (id: string) => {
    const response = await vehicleService.deleteVehicle(id);
    
    if (response.error) {
      return { success: false, error: response.error };
    }
    
    await loadVehicles();
    return { success: true, error: null };
  };

  const updateVehicleStatus = async (id: string, status: Vehicle["status"]) => {
    const response = await vehicleService.updateVehicleStatus(id, status);
    
    if (response.error) {
      return { success: false, error: response.error };
    }
    
    await loadVehicles();
    return { success: true, error: null };
  };

  return {
    vehicles,
    loading,
    error,
    refresh: loadVehicles,
    createVehicle,
    updateVehicle,
    deleteVehicle,
    updateVehicleStatus,
  };
}
