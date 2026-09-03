export default function IXIAosCardPreview({
  children
}) {
  return (
    <div className="ixi-aos-card-preview">
      {children}

      <style jsx>{`
        .ixi-aos-card-preview {
          box-sizing: border-box;

          position: relative;

          width: 300px;
          min-width: 300px;
          max-width: 300px;

          height: 475px;
          min-height: 475px;
          max-height: 475px;

          overflow: hidden;
        }

        .ixi-aos-card-preview > :global(*) {
          width: 100%;
          height: 100%;
          min-height: 100%;
          max-height: 100%;
        }
      `}</style>
    </div>
  );
}
