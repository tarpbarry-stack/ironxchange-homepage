export default function IXIControlSurface({ children, className = "" }) {
  return (
    <section className={`ixi-control-surface ${className}`}>
      {children}

<style jsx>{`
.ixi-control-surface {
  width: 50vw;
  max-width: 600px;
  min-width: 420px;

  margin: 24px auto 0;
  padding: 18px;

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
`}</style>
    </section>
  );
}
