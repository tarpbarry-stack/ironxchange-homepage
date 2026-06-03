<section
  className={`ixi-page-indicator mode-${railMode}`}
  onMouseEnter={() => {
  if (railMode === "ghost") {
    setTimeout(() => {
      setRailMode(current =>
        current === "ghost" ? "discover" : current
      );
    }, 120);
  }
}}
onMouseLeave={() => {
  if (railMode === "discover") {
    setTimeout(() => {
      setRailMode(current =>
        current === "discover" ? "ghost" : current
      );
    }, 220);
  }
}}
>
         {RAIL_ITEMS.map(item => (
<a
  key={item.label}
  href={item.href}
  className={`ixi-page-indicator-link state-${getRailItemState(item)} ${
    item.postFree ? "post-free" : ""
  }`}
>
    {renderRailLabel(item) ? (
  renderRailLabel(item)
) : (
  <span
    className="ixi-env-dash"
    style={{
      width: `${getDashWidth(item.label)}px`
    }}
  />
)}
  </a>
))}

          <button
  type="button"
  className={`ixi-power-switch ${
    railMode !== "ghost" ? "active" : ""
  }`}
  onClick={cycleRailMode}
  aria-label="Toggle environment rail"
  title="IXI Environment Rail"
/>
          </section>
