"use client";

import { useState, useEffect, useCallback } from "react";
import { rentalService } from "@/src/services/rentalService";
import { Rental, UserRole } from "@/src/types";

export function useRentals(userRole: UserRole, branchId: string | null) {
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRentals = useCallback(async () => {
    setLoading(true);
    const response = await rentalService.getRentals(userRole, branchId);
    
    if (response.error || !response.data) {
      setError(response.error);
      setRentals([]);
    } else {
      setRentals(response.data);
      setError(null);
    }
    
    setLoading(false);
  }, [userRole, branchId]);

  useEffect(() => {
    loadRentals();
  }, [loadRentals]);

  const createRental = async (rental: Partial<Rental>) => {
    const response = await rentalService.createRental(rental);
    
    if (response.error) {
      return { success: false, error: response.error };
    }
    
    await loadRentals();
    return { success: true, error: null, data: response.data };
  };

  const completeRental = async (id: string, totalAmount: number) => {
    const response = await rentalService.completeRental(id, totalAmount);
    
    if (response.error) {
      return { success: false, error: response.error };
    }
    
    await loadRentals();
    return { success: true, error: null };
  };

  const cancelRental = async (id: string) => {
    const response = await rentalService.cancelRental(id);
    
    if (response.error) {
      return { success: false, error: response.error };
    }
    
    await loadRentals();
    return { success: true, error: null };
  };

  const approveRental = async (id: string) => {
    const response = await rentalService.approveRental(id);

    if (response.error) {
      return { success: false, error: response.error };
    }

    await loadRentals();
    return { success: true, error: null };
  };

  return {
    rentals,
    loading,
    error,
    refresh: loadRentals,
    createRental,
    completeRental,
    cancelRental,
    approveRental,
  };
}
