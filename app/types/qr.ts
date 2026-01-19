export type ErrorCorrectionLevel = "L" | "M" | "Q" | "H";

export interface QRConfig {
  data: string;
  fgColor: string;
  bgColor: string;
  errorCorrectionLevel: ErrorCorrectionLevel;
  logo: File | null;
  logoPadding: number;
  logoSize: number; // %
  qrSize: number;   // px
}
