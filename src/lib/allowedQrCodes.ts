export const ALLOWED_QR_CODES = [
  "WC-001",
  "WC-002",
  "WC-003",
  "ST-001",
  "ST-002",
  "ST-003",
];

export const isAllowedQrCode = (code: string) =>
  ALLOWED_QR_CODES.includes(code);
