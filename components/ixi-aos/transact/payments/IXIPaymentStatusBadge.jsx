import styles from "./IXIPaymentStatusBadge.module.css";

export default function IXIPaymentStatusBadge({ status }) {
  const value = String(status || "").trim().toUpperCase();
  const label = ["PART PAID", "PARTIALLY PAID", "PARTIAL"].includes(value)
    ? "PARTIAL"
    : value;
  const tone = label === "PAID" ? "paid" : label === "UNPAID" ? "unpaid" : label === "PARTIAL" ? "partial" : "neutral";
  return label ? <span className={styles.badge} data-payment-status={label} data-tone={tone} aria-label={`Payment status: ${label}`}>{label}</span> : null;
}
