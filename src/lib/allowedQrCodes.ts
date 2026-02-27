export const ALLOWED_QR_CODES = [
  "DEV-01",
  "DEV-02",
  "DEV-03",
  "DEV-04",
  "DEV-05",
  "DEV-06",
];

export const isAllowedQrCode = (code: string) =>
  ALLOWED_QR_CODES.includes(code);
