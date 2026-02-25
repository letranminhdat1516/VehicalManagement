"use client";

import { useAuth } from "@/src/hooks/useAuth";
import { useRentals } from "@/src/hooks/useRentals";
import { useVehicles } from "@/src/hooks/useVehicles";
import DashboardLayout from "@/src/components/DashboardLayout";
import { useState } from "react";
import { Rental, RentalStatus } from "@/src/types";

export default function RentalsPage() {
  const { user } = useAuth();
  const { rentals, loading, createRental, completeRental, cancelRental } =
    useRentals(user?.role || "GUARD", user?.branch_id || null);
  const { vehicles } = useVehicles(user?.role || "GUARD", user?.branch_id || null);

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    vehicle_id: "",
    customer_name: "",
    customer_phone: "",
    customer_id_number: "",
    start_date: new Date().toISOString().split("T")[0],
    daily_rate: 0,
    notes: "",
  });

  const availableVehicles = vehicles.filter((v) => v.status === "AVAILABLE");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const selectedVehicle = vehicles.find((v) => v.id === formData.vehicle_id);
    if (!selectedVehicle) {
      alert("Please select a vehicle");
      return;
    }

    const result = await createRental({
      ...formData,
      guard_id: user?.id || "",
      branch_id: user?.branch_id || selectedVehicle.branch_id,
      daily_rate: selectedVehicle.daily_rate,
      status: "ACTIVE" as RentalStatus,
    });

    if (result.success) {
      alert("Rental created successfully!");
      resetForm();
    } else {
      alert(`Error: ${result.error}`);
    }
  };

  const resetForm = () => {
    setFormData({
      vehicle_id: "",
      customer_name: "",
      customer_phone: "",
      customer_id_number: "",
      start_date: new Date().toISOString().split("T")[0],
      daily_rate: 0,
      notes: "",
    });
    setShowForm(false);
  };

  const handleComplete = async (rental: Rental) => {
    const days = prompt("Enter number of days rented:");
    if (!days) return;

    const totalAmount = parseFloat(days) * rental.daily_rate;
    const confirmed = confirm(`Total amount: $${totalAmount}. Complete rental?`);
    
    if (!confirmed) return;

    const result = await completeRental(rental.id, totalAmount);
    if (result.success) {
      alert("Rental completed successfully!");
    } else {
      alert(`Error: ${result.error}`);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this rental?")) return;

    const result = await cancelRental(id);
    if (result.success) {
      alert("Rental cancelled successfully!");
    } else {
      alert(`Error: ${result.error}`);
    }
  };

  if (!user) return null;

  return (
    <DashboardLayout>
      <div>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.5rem",
        }}>
          <h1 style={{ fontSize: "2rem", fontWeight: "bold" }}>Rentals</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            style={{
              padding: "0.75rem 1.5rem",
              background: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "0.375rem",
              cursor: "pointer",
              fontWeight: "500",
            }}
          >
            {showForm ? "Cancel" : "New Rental"}
          </button>
        </div>

        {showForm && (
          <div style={{
            padding: "1.5rem",
            background: "white",
            borderRadius: "0.5rem",
            border: "1px solid #e5e7eb",
            marginBottom: "1.5rem",
          }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "1rem" }}>
              Create New Rental
            </h2>
            <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1rem" }}>
              <select
                value={formData.vehicle_id}
                onChange={(e) => setFormData({ ...formData, vehicle_id: e.target.value })}
                required
                style={{
                  padding: "0.5rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "0.375rem",
                }}
              >
                <option value="">Select Vehicle</option>
                {availableVehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.code} - {vehicle.brand} {vehicle.model} (${vehicle.daily_rate}/day)
                  </option>
                ))}
              </select>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <input
                  type="text"
                  placeholder="Customer Name"
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  required
                  style={{
                    padding: "0.5rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "0.375rem",
                  }}
                />
                <input
                  type="tel"
                  placeholder="Customer Phone"
                  value={formData.customer_phone}
                  onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                  required
                  style={{
                    padding: "0.5rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "0.375rem",
                  }}
                />
              </div>

              <input
                type="text"
                placeholder="Customer ID Number (Optional)"
                value={formData.customer_id_number}
                onChange={(e) => setFormData({ ...formData, customer_id_number: e.target.value })}
                style={{
                  padding: "0.5rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "0.375rem",
                }}
              />

              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
                style={{
                  padding: "0.5rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "0.375rem",
                }}
              />

              <textarea
                placeholder="Notes (Optional)"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                style={{
                  padding: "0.5rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "0.375rem",
                  resize: "vertical",
                }}
              />

              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  type="submit"
                  style={{
                    padding: "0.75rem 1.5rem",
                    background: "#10b981",
                    color: "white",
                    border: "none",
                    borderRadius: "0.375rem",
                    cursor: "pointer",
                    fontWeight: "500",
                  }}
                >
                  Create Rental
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  style={{
                    padding: "0.75rem 1.5rem",
                    background: "#6b7280",
                    color: "white",
                    border: "none",
                    borderRadius: "0.375rem",
                    cursor: "pointer",
                    fontWeight: "500",
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div>Loading rentals...</div>
        ) : (
          <div style={{
            background: "white",
            borderRadius: "0.5rem",
            border: "1px solid #e5e7eb",
            overflow: "auto",
          }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                  <th style={{ padding: "0.75rem", textAlign: "left", fontWeight: "600" }}>Customer</th>
                  <th style={{ padding: "0.75rem", textAlign: "left", fontWeight: "600" }}>Phone</th>
                  <th style={{ padding: "0.75rem", textAlign: "left", fontWeight: "600" }}>Vehicle ID</th>
                  <th style={{ padding: "0.75rem", textAlign: "left", fontWeight: "600" }}>Start Date</th>
                  <th style={{ padding: "0.75rem", textAlign: "left", fontWeight: "600" }}>End Date</th>
                  <th style={{ padding: "0.75rem", textAlign: "left", fontWeight: "600" }}>Rate/Day</th>
                  <th style={{ padding: "0.75rem", textAlign: "left", fontWeight: "600" }}>Total</th>
                  <th style={{ padding: "0.75rem", textAlign: "left", fontWeight: "600" }}>Status</th>
                  <th style={{ padding: "0.75rem", textAlign: "left", fontWeight: "600" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rentals.map((rental) => (
                  <tr key={rental.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <td style={{ padding: "0.75rem" }}>{rental.customer_name}</td>
                    <td style={{ padding: "0.75rem" }}>{rental.customer_phone}</td>
                    <td style={{ padding: "0.75rem", fontSize: "0.75rem" }}>
                      {rental.vehicle_id.substring(0, 8)}...
                    </td>
                    <td style={{ padding: "0.75rem" }}>
                      {new Date(rental.start_date).toLocaleDateString()}
                    </td>
                    <td style={{ padding: "0.75rem" }}>
                      {rental.end_date ? new Date(rental.end_date).toLocaleDateString() : "-"}
                    </td>
                    <td style={{ padding: "0.75rem" }}>${rental.daily_rate}</td>
                    <td style={{ padding: "0.75rem" }}>
                      {rental.total_amount ? `$${rental.total_amount}` : "-"}
                    </td>
                    <td style={{ padding: "0.75rem" }}>
                      <span style={{
                        padding: "0.25rem 0.75rem",
                        borderRadius: "9999px",
                        fontSize: "0.75rem",
                        fontWeight: "500",
                        background: rental.status === "ACTIVE" ? "#dbeafe" :
                                   rental.status === "COMPLETED" ? "#d1fae5" : "#fecaca",
                        color: rental.status === "ACTIVE" ? "#1e40af" :
                               rental.status === "COMPLETED" ? "#065f46" : "#991b1b",
                      }}>
                        {rental.status}
                      </span>
                    </td>
                    <td style={{ padding: "0.75rem" }}>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        {rental.status === "ACTIVE" && (
                          <>
                            <button
                              onClick={() => handleComplete(rental)}
                              style={{
                                padding: "0.25rem 0.75rem",
                                background: "#10b981",
                                color: "white",
                                border: "none",
                                borderRadius: "0.25rem",
                                cursor: "pointer",
                                fontSize: "0.75rem",
                              }}
                            >
                              Complete
                            </button>
                            <button
                              onClick={() => handleCancel(rental.id)}
                              style={{
                                padding: "0.25rem 0.75rem",
                                background: "#ef4444",
                                color: "white",
                                border: "none",
                                borderRadius: "0.25rem",
                                cursor: "pointer",
                                fontSize: "0.75rem",
                              }}
                            >
                              Cancel
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
