export default function IXIChassis({ children }) {
  return (
    <section className="ixi-command-chassis">
      {children}

      <style jsx>{`
        .ixi-command-chassis {
          --station-w: 150px;
          --station-h: 102px;
          --control-half: 320px;
          --station-gap: clamp(24px, 2.1vw, 40px);

          width: 100%;
          margin: -14 auto 20px;

          position: relative;

          display: block;
        }

        @media (max-width: 1250px) and (min-width: 851px) {
          .ixi-command-chassis {
            --control-half: 210px;
            --station-gap: 20px;
          }
        }

        @media (max-width: 850px) {
          .ixi-command-chassis {
            display: none;
          }
        }
      `}</style>
    </section>
  );
}
