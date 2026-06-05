export default function IXIControlSurface({ children, className = "" }) {
  return (
    <section className={`ixi-control-surface ${className}`}>
      {children}

<style jsx>{`
.ixi-control-surface {
  width: clamp(420px, 34vw, 600px);

  margin: 24px auto 0;
  padding: clamp(10px, 1vw, 18px);

  border: 1px solid rgba(255,255,255,.045);
  border-radius: 10px;

  background:
    linear-gradient(
      180deg,
      rgba(255,196,0,.035),
      rgba(255,196,0,0)
    ),
    rgba(8,8,8,.72);

  box-shadow:
    0 12px 30px rgba(0,0,0,.24);
}

@media (max-width: 1200px) {
  .ixi-control-surface {
    width: min(92vw, 520px);
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
