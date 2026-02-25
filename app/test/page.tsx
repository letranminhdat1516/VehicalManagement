"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/src/lib/supabaseClient";

export default function TestPage() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVehicles = async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("*");

      if (error) {
        setError(error.message);
      } else {
        setVehicles(data || []);
      }
    };

    fetchVehicles();
  }, []);

  return (
    <div style={{ padding: 40 }}>
      <h1>Vehicles</h1>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <pre>{JSON.stringify(vehicles, null, 2)}</pre>
    </div>
  );
}