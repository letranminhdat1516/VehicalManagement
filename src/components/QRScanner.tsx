"use client";

import { useEffect, useState } from "react";

interface QRScannerProps {
  title: string;
  onScan: (value: string) => void;
  onClose: () => void;
}

export default function QRScanner({ title, onScan, onClose }: QRScannerProps) {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let qr: any = null;
    let stopped = false;

    const start = async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (stopped) return;

        qr = new Html5Qrcode("qr-reader");
        const devices = await Html5Qrcode.getCameras();
        const cameraId = devices?.[0]?.id;

        if (!cameraId) {
          setError("Không tìm thấy camera");
          return;
        }

        await qr.start(
          cameraId,
          { fps: 10, qrbox: { width: 250, height: 250 } },
          async (decodedText: string) => {
            try {
              if (qr?.isScanning) {
                await qr.stop();
              }
              qr?.clear?.();
            } catch {}
            onScan(decodedText);
            onClose();
          },
          () => {}
        );
      } catch (err: any) {
        setError(err?.message || "Không thể mở camera");
      }
    };

    start();

    return () => {
      stopped = true;
      if (!qr) return;
      const cleanup = async () => {
        try {
          if (qr.isScanning) {
            await qr.stop();
          }
        } catch {}
        try {
          qr.clear?.();
        } catch {}
      };
      cleanup();
    };
  }, [onScan]);

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(0,0,0,0.6)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 50,
      padding: "1rem",
    }}>
      <div style={{
        background: "white",
        borderRadius: "0.5rem",
        width: "100%",
        maxWidth: "420px",
        padding: "1rem",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0 }}>{title}</h3>
          <button
            onClick={onClose}
            style={{
              background: "#ef4444",
              color: "white",
              border: "none",
              borderRadius: "0.375rem",
              padding: "0.25rem 0.75rem",
              cursor: "pointer",
            }}
          >
            Đóng
          </button>
        </div>

        <div style={{ marginTop: "1rem" }}>
          <div id="qr-reader" style={{ width: "100%" }} />
        </div>

        {error && (
          <div style={{ marginTop: "0.75rem", color: "#dc2626", fontSize: "0.875rem" }}>
            {error}
          </div>
        )}

        <div style={{ marginTop: "0.75rem", fontSize: "0.875rem", color: "#6b7280" }}>
          Hãy cho phép truy cập camera để quét QR.
        </div>
      </div>
    </div>
  );
}
