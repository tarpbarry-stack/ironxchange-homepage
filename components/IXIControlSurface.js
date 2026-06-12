export default function IXIControlSurface({ children, className = "" }) {
  return (
    <section className={`ixi-control-surface ${className}`}>
      {children}

<style jsx>{`
.ixi-control-surface {
  width: clamp(420px, 34vw, 600px);

  margin: 24px auto 0;
  padding: clamp(10px, 1vw, 16px);

  position: relative;

  border: 1px solid rgba(255,255,255,.055);
  border-radius: 16px 10px 16px 10px;

  background:
    linear-gradient(180deg, rgba(255,255,255,.024), rgba(255,255,255,0)),
    radial-gradient(circle at top left, rgba(255,196,0,.035), transparent 60%),
    rgba(7,7,7,.76);

  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.028),
    0 8px 18px rgba(0,0,0,.20);
}

.ixi-control-surface::before {
  content: "";

  position: absolute;
  left: 12px;
  right: 12px;
  top: 8px;

  height: 1px;

  background: rgba(255,196,0,.10);
  pointer-events: none;
}

.ixi-control-surface::after {
  content: "IXI™ 2026";

  position: absolute;
  right: 12px;
  bottom: 6px;

  color: rgba(255,255,255,.16);

  font-size: 6px;
  font-weight: 950;
  letter-spacing: .8px;
  text-transform: uppercase;

  pointer-events: none;
}

@media (max-width: 1200px) {
  .ixi-control-surface {
    width: clamp(360px, 34vw, 420px);
    min-width: 0;
  }
}

@media (max-width: 850px) {
  .ixi-control-surface {
    width: 100%;
    max-width: 100%;
    min-width: 0;
    margin-top: 18px;
    padding: 12px;
  }
}
`}</style>
    </section>
  );
}
