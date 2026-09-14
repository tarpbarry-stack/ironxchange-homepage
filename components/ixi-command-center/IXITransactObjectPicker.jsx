import { useEffect, useId, useRef, useState } from "react";
import styles from "./IXITransactRebuild.module.css";

export default function IXITransactObjectPicker({
  label,
  items = [],
  selectedId,
  onSelect,
}) {
  const [open, setOpen] = useState(false),
    [query, setQuery] = useState(""),
    [index, setIndex] = useState(0);
  const root = useRef(null),
    input = useRef(null),
    trigger = useRef(null);
  const id = useId();
  const results = items.filter((item) =>
    `${item.title} ${item.serialNumber || ""} ${item.passportId || ""}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  const current = items.find((item) => item.id === selectedId);
  function close() {
    setOpen(false);
    trigger.current?.focus();
  }
  function choose(item) {
    if (!item) return;
    onSelect(item);
    close();
  }
  useEffect(() => {
    if (!open) return undefined;
    input.current?.focus();
    const dismiss = (event) => {
      if (!root.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, [open]);
  return (
    <div
      ref={root}
      className={styles.picker}
      data-active={Boolean(current)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <button
        ref={trigger}
        type="button"
        aria-label={`Choose ${label}`}
        aria-expanded={open}
        aria-controls={`${id}-list`}
        disabled={!items.length}
        onClick={() => {
          setQuery("");
          setIndex(0);
          setOpen((value) => !value);
        }}
      >
        <strong>{label}</strong>
        <span>{items.length} ▾</span>
      </button>
      {open ? (
        <div className={styles.pickerMenu}>
          <input
            ref={input}
            type="search"
            role="combobox"
            aria-label={`Search ${label}`}
            aria-autocomplete="list"
            aria-expanded="true"
            aria-controls={`${id}-list`}
            aria-activedescendant={
              results[index] ? `${id}-${index}` : undefined
            }
            value={query}
            placeholder={`Find ${label.toLowerCase()}…`}
            onChange={(event) => {
              setQuery(event.target.value);
              setIndex(0);
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.preventDefault();
                close();
              }
              if (event.key === "Enter") {
                event.preventDefault();
                choose(results[index]);
              }
              if (["ArrowDown", "ArrowUp"].includes(event.key)) {
                event.preventDefault();
                const next = Math.max(
                  0,
                  Math.min(
                    results.length - 1,
                    index + (event.key === "ArrowDown" ? 1 : -1),
                  ),
                );
                setIndex(next);
                document
                  .getElementById(`${id}-${next}`)
                  ?.scrollIntoView({ block: "nearest" });
              }
            }}
          />
          <div
            id={`${id}-list`}
            role="listbox"
            aria-label={label}
            className={styles.pickerResults}
          >
            {results.map((item, i) => (
              <button
                type="button"
                role="option"
                tabIndex={-1}
                id={`${id}-${i}`}
                aria-selected={i === index}
                key={item.id}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(item)}
              >
                <strong>{item.title}</strong>
                <small>{item.serialNumber || item.passportId}</small>
              </button>
            ))}
          </div>
          {!results.length ? <p role="status">No matching objects.</p> : null}
        </div>
      ) : null}
    </div>
  );
}
