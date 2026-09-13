const pad = value => String(value).padStart(2, "0");

// Date-only values stay date-only; never infer a century or roll an invalid day.
export function parsePaymentDate(value) {
  const text = String(value ?? "").trim();
  let year, month, day;
  let match = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) [, year, month, day] = match;
  else {
    match = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/) || text.match(/^(\d{2})(\d{2})(\d{4})$/);
    if (!match) return "";
    [, month, day, year] = match;
  }
  if (Number(year) < 1000 || Number(year) > 9999) return "";
  const iso = `${year}-${pad(month)}-${pad(day)}`;
  const date = new Date(`${iso}T12:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === iso ? iso : "";
}

export function formatPaymentDate(value) {
  const iso = parsePaymentDate(value);
  return iso ? `${iso.slice(5, 7)}/${iso.slice(8, 10)}/${iso.slice(0, 4)}` : String(value ?? "");
}

export function paymentCalendarDays(year, month) {
  const first = new Date(Date.UTC(year, month, 1));
  const days = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return [...Array(first.getUTCDay()).fill(null), ...Array.from({ length: days }, (_, index) => `${year}-${pad(month + 1)}-${pad(index + 1)}`)];
}
