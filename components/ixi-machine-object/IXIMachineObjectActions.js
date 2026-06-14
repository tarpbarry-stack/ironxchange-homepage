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
          grid-template-columns: repeat(3, 1fr);
          gap: 7px;
          margin-top: auto;
          padding-bottom: 2px;
        }

        .mof-actions button {
          height: 27px;
          border: 1px solid rgba(255,196,0,.22);
          border-radius: 7px;
          background:
            linear-gradient(180deg, rgba(255,196,0,.055), rgba(255,196,0,0)),
            #101010;
          color: #FFC400;
          font-size: 9px;
          font-weight: 950;
          letter-spacing: .5px;
          cursor: pointer;
        }
      `}</style>
    </footer>
  );
}
