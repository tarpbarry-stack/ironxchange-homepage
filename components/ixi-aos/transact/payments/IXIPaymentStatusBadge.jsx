import styles from "./IXIPaymentStatusBadge.module.css";

export default function IXIPaymentStatusBadge({ status, kind = "payment" }) {
  const value = String(status || "").trim().toUpperCase();
  const label = ["PART PAID", "PARTIALLY PAID", "PARTIAL"].includes(value)
    ? "PARTIAL"
    : value;
  const tone = label === "PAID" ? "paid"
    : ["UNPAID", "OVERDUE"].includes(label) ? "unpaid"
    : ["PARTIAL", "DUE"].includes(label) ? "partial"
    : label === "COMMITTED" ? "committed" : "neutral";
  return label ? <span className={styles.badge} data-payment-status={kind === "payment" ? label : undefined} data-transaction-status={label} data-tone={tone} aria-label={`${kind === "payment" ? "Payment" : "Transaction"} status: ${label}`}>{label}</span> : null;
}
