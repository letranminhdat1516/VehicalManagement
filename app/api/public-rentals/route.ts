import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/src/lib/supabaseAdmin";
import { ALLOWED_QR_CODES } from "@/src/lib/allowedQrCodes";
import crypto from "crypto";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      vehicle_code,
      customer_name,
      customer_phone,
      notes,
      cccd_url,
    } = body || {};

    if (!vehicle_code || !ALLOWED_QR_CODES.includes(vehicle_code)) {
      return NextResponse.json({ error: "Mã xe không hợp lệ" }, { status: 400 });
    }

    if (!customer_name || !customer_phone) {
      return NextResponse.json({ error: "Thiếu thông tin khách hàng" }, { status: 400 });
    }

    const { data: vehicle, error: vehicleError } = await supabaseAdmin
      .from("vehicles")
      .select("*")
      .eq("code", vehicle_code)
      .single();

    if (vehicleError || !vehicle) {
      return NextResponse.json({ error: "Không tìm thấy xe" }, { status: 404 });
    }

    if (vehicle.status && vehicle.status !== "AVAILABLE") {
      return NextResponse.json({ error: "Xe không sẵn sàng để mượn" }, { status: 400 });
    }

    const citizenIdHash = cccd_url
      ? crypto.createHash("sha256").update(cccd_url).digest("hex")
      : crypto.createHash("sha256").update(customer_phone).digest("hex");
    const phoneDigits = String(customer_phone || "").replace(/\D/g, "");
    const citizenIdLast4 = phoneDigits.slice(-4) || "0000";

    const noteContent = notes
      ? `${notes}\nCCCD: ${cccd_url || "không có"}`
      : `CCCD: ${cccd_url || "không có"}`;

    // Single clean payload using real DB columns
    const payload = {
      vehicle_id: vehicle.id,
      branch_id: vehicle.branch_id ?? null,
      customer_name,
      phone: customer_phone,
      status: "PENDING",
      borrow_time: new Date().toISOString(),
      note: noteContent,
      citizen_id_hash: citizenIdHash,
      citizen_id_last4: citizenIdLast4,
      citizen_image_path: cccd_url || null,
    };

    const { data: rental, error: rentalError } = await supabaseAdmin
      .from("rentals")
      .insert([payload])
      .select()
      .single();

    if (rentalError || !rental) {
      return NextResponse.json(
        { error: rentalError?.message || "Không thể tạo đơn thuê" },
        { status: 400 }
      );
    }

    return NextResponse.json({ data: rental }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Server error" }, { status: 500 });
  }
}
