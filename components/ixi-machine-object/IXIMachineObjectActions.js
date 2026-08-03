export default function IXIMachineObjectActions({
  onEmail,
  onText,
  onPdf,
  labels = ["EMAIL", "TEXT", "PDF"]
}) {
  return (
    <footer className="mof-actions">
      <button type="button" onClick={onEmail}>
        {labels[0]}
      </button>

      <button type="button" onClick={onText}>
        {labels[1]}
      </button>

      <button type="button" onClick={onPdf}>
        {labels[2]}
      </button>

     <style jsx>{`
  .mof-actions {
    width: 100%;

    display: grid;
    grid-template-columns:
      repeat(3, minmax(0, 1fr));

    gap: 8px;

    margin-top: auto;

    position: relative;
    top: 6px;
  }

  .mof-actions button {
    height: 20px;
    min-height: 20px;

    padding: 0 12px;

    border:
      1px solid
      rgba(255,255,255,.10);

    border-radius: 3px;

    background:
      linear-gradient(
        180deg,
        rgba(255,255,255,.035),
        rgba(255,255,255,.012)
      ),
      rgba(8,8,8,.90);

    color:
      rgba(255,255,255,.60);

    font-size: 6.7px;
    font-weight: 950;
    line-height: 1;
    letter-spacing: .55px;

    text-transform: uppercase;

    box-shadow:
      inset 0 1px 0
      rgba(255,255,255,.03);

    transition:
      border-color .12s ease,
      background .12s ease,
      color .12s ease,
      transform .08s ease;

    cursor: pointer;
  }

  .mof-actions button:hover {
    border-color:
      rgba(255,196,0,.42);

    background:
      linear-gradient(
        180deg,
        rgba(255,196,0,.08),
        rgba(255,196,0,.02)
      ),
      rgba(10,10,10,.95);

    color: #FFC400;
  }

  .mof-actions button:active {
    transform: translateY(1px);
  }

  .mof-actions button:disabled {
    opacity: .35;
    cursor: default;
  }
`}</style>
    </footer>
  );
}
