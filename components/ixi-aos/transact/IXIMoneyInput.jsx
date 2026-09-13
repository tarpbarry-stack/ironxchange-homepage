"use client";

import { forwardRef, useId, useState } from "react";
import { useIXITransactLocale } from "./IXITransactLocale";
import { formatIXIMoneyInput, parseIXIMoneyInput } from "./IXIMoney";

const IXIMoneyInput = forwardRef(function IXIMoneyInput({ value = "", onChange, onValueChange, onFocus, onBlur, allowNegative = false, ...props }, ref) {
  const { t } = useIXITransactLocale();
  const [focused, setFocused] = useState(false);
  const [message, setMessage] = useState("");
  const messageId = useId();
  return <>
    <input {...props} ref={ref} type="text" inputMode="decimal" data-ixi-money="true"
      value={focused ? value : formatIXIMoneyInput(value)}
      aria-describedby={[props["aria-describedby"], message ? messageId : ""].filter(Boolean).join(" ") || undefined}
      onFocus={event => { setFocused(true); onFocus?.(event); }}
      onBlur={event => {
        setFocused(false);
        if (value === "-") {
          const target = { value: "", name: event.target.name, id: event.target.id };
          onChange?.({ ...event, target, currentTarget: target }); onValueChange?.("");
        }
        onBlur?.(event);
      }}
      onChange={event => {
        const parsed = parseIXIMoneyInput(event.target.value, { allowNegative });
        if (!parsed.valid) { setMessage(t("Use an amount such as 1,234.07, with at most two decimal places.")); return; }
        setMessage("");
        // Existing TRAN$ACT controls consume event.target.value; keep that API.
        const target = { value: parsed.value, name: event.target.name, id: event.target.id };
        onChange?.({ ...event, target, currentTarget: target });
        onValueChange?.(parsed.value);
      }} />
    {message ? <small id={messageId} role="status" style={{ display: "block", color: "#ffd24a", fontSize: 10, lineHeight: 1.3 }}>{message}</small> : null}
  </>;
});

export default IXIMoneyInput;

export function IXINumericInput({ currency, onValueChange, ...props }) {
  return currency ? <IXIMoneyInput {...props} onValueChange={onValueChange} /> :
    <input {...props} onChange={event => onValueChange?.(event.target.value)} />;
}
