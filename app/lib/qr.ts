import qrcode from 'qrcode';
import { QRConfig } from '../types/qr';

export async function generateBaseQR(config: QRConfig) {
  return await qrcode.toDataURL(config.data, {
    width: config.qrSize,
    margin: 2,
    errorCorrectionLevel: config.errorCorrectionLevel,
    color: {
      dark: config.fgColor,
      light: config.bgColor,
    },
  });
}