export const IX_PREMIUM_UPLOAD_EMAILS = [
  "tarpbarry@gmail.com"
];

export const IX_PREMIUM_COMPANY_NAMES = [
  "IronXchange",
  "Concho Operations",
  "Sales Inc"
];

export function getUploadPolicy({ userEmail, companyName }) {
  const email = String(userEmail || "").toLowerCase();
  const company = String(companyName || "").toLowerCase();

  const isPremiumUploader =
    IX_PREMIUM_UPLOAD_EMAILS.includes(email) ||
    IX_PREMIUM_COMPANY_NAMES.some(name =>
      company.includes(name.toLowerCase())
    );

  if (isPremiumUploader) {
    return {
      lane: "premium",
      preserveOriginal: true,
      destructiveCompression: false,
      maxWidth: 6000,
      outputQuality: 0.98,
      defaultMode: "clean"
    };
  }

  return {
    lane: "standard",
    preserveOriginal: false,
    destructiveCompression: true,
    maxWidth: 1800,
    outputQuality: 0.9,
    defaultMode: "clean"
  };
}
