"use client";

import { useState, useEffect } from "react";
import { authService } from "@/src/services/authService";
import { AppUser } from "@/src/types";
import { useRouter } from "next/navigation";

export function useAuth() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    setLoading(true);
    const response = await authService.getCurrentUser();
    
    if (response.error || !response.data) {
      setUser(null);
      setError(response.error);
    } else {
      setUser(response.data);
      setError(null);
    }
    
    setLoading(false);
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    const response = await authService.signIn(email, password);
    
    if (response.error || !response.data) {
      setError(response.error);
      setLoading(false);
      return { success: false, error: response.error };
    }
    
    setUser(response.data);
    setLoading(false);
    return { success: true, error: null };
  };

  const signOut = async () => {
    const response = await authService.signOut();
    
    if (response.error) {
      setError(response.error);
      return { success: false, error: response.error };
    }
    
    setUser(null);
    router.push("/login");
    return { success: true, error: null };
  };

  return {
    user,
    loading,
    error,
    signIn,
    signOut,
    isAuthenticated: !!user,
    isAdmin: user?.role === "ADMIN",
    isGuard: user?.role === "GUARD",
  };
}
