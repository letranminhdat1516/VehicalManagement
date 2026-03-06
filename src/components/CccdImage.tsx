"use client";
import { useEffect, useState } from "react";

interface CccdImageProps {
  src: string;
  onClick: () => void;
}

export default function CccdImage({ src, onClick }: CccdImageProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!src) { setLoading(false); return; }
    setLoading(true); setError(false);

    fetch(`/api/cccd-signed-url?path=${encodeURIComponent(src)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.signedUrl) setUrl(d.signedUrl);
        else setError(true);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [src]);

  if (!src) return <span style={{ color: "#999", fontSize: 12 }}>—</span>;
  if (loading)
    return (
      <div style={{ width: 48, height: 36, background: "#f0f0f0", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#999" }}>
        ...
      </div>
    );
  if (error || !url)
    return <span style={{ color: "#f44", fontSize: 11 }}>Lỗi</span>;

  return (
    <img
      src={url}
      alt="CCCD"
      onClick={onClick}
      style={{
        width: 48,
        height: 36,
        objectFit: "cover",
        borderRadius: 4,
        border: "1px solid #ddd",
        cursor: "pointer",
        transition: "opacity .2s",
      }}
      onMouseEnter={(e) => ((e.target as HTMLImageElement).style.opacity = "0.8")}
      onMouseLeave={(e) => ((e.target as HTMLImageElement).style.opacity = "1")}
    />
  );
}
