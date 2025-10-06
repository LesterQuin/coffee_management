// utils/qr_generator.js
import QRCode from "qrcode";

export async function generateQrDataUrl(payload) {
  // payload can be an object; we'll stringify
  const text = JSON.stringify(payload);
  return QRCode.toDataURL(text);
}
