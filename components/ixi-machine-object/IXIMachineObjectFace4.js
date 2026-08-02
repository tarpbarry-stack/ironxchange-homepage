import IXIMachineObjectActions from "./IXIMachineObjectActions";

export default function IXIMachineObjectFace4({
  dragHandleProps
}) {
  return (
    <section
  className="mof4"
  {...(dragHandleProps || {})}
>
      <div className="mof4-logo">IRONXCHANGE</div>

      <div className="mof4-kicker">HELP BUILD THE IRON NETWORK</div>

      <h2>WE NEED YOUR IRON</h2>

      <p>
        List your machines free. Use the tools. Reach real buyers.
      </p>

      <div className="mof4-points">
        <span>NO LISTING FEES</span>
        <span>NO CREDIT CARDS</span>
        <span>NO NONSENSE</span>
      </div>

      <p className="mof4-copy">
        Built for equipment people who actually buy and sell iron.
        Add your machines and help us build the marketplace this industry
        should already have.
      </p>

      <div className="mof4-cta">
        CREATE ACCOUNT · POST FREE · SELL MORE IRON
      </div>

      <IXIMachineObjectActions labels={["JOIN", "POST", "MORE"]} />

      <style jsx>{`
        .mof4 {
          box-sizing: border-box;
          width: 100%;
          max-width: 100%;
          height: 378px;
          min-height: 378px;
          max-height: 378px;

          position: relative;

          padding: 18px 14px 43px;

          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;

         background:
  radial-gradient(
    circle at top,
    rgba(255,196,0,.05),
    transparent 42%
  ),
  linear-gradient(
    180deg,
    rgba(255,255,255,.028),
    rgba(255,255,255,0)
  ),
  #141414;

color: #f2f2f2;
          color: #f2f2f2;
        }

        .mof4-logo {
          margin-top: 4px;
          color: #FFC400;
          font-size: 18px;
          font-weight: 950;
          letter-spacing: 1.2px;
        }

        .mof4-kicker {
          margin-top: 12px;
          color: rgba(255,255,255,.48);
          font-size: 8px;
          font-weight: 950;
          letter-spacing: .7px;
        }

        h2 {
          margin: 12px 0 0;
          color: #f2f2f2;
          font-size: 22px;
          font-weight: 950;
          letter-spacing: -.5px;
        }

        p {
          max-width: 92%;
          margin: 12px 0 0;
          color: rgba(255,255,255,.72);
          font-size: 12px;
          font-weight: 800;
          line-height: 1.35;
        }

        .mof4-points {
          width: 100%;
          margin-top: 16px;

          display: grid;
          grid-template-columns: 1fr;
          gap: 7px;
        }

        .mof4-points span {
          padding: 7px 8px;

          border: 1px solid rgba(255,196,0,.18);
          border-radius: 7px;

          background:
            linear-gradient(180deg, rgba(255,196,0,.055), rgba(255,196,0,0)),
            rgba(0,0,0,.34);

          color: #FFC400;
          font-size: 8px;
          font-weight: 950;
          letter-spacing: .5px;
        }

        .mof4-copy {
          margin-top: 14px;
          color: rgba(255,255,255,.62);
          font-size: 10px;
          font-weight: 750;
          line-height: 1.42;
        }

        .mof4-cta {
          margin-top: auto;
          margin-bottom: 8px;

          color: rgba(255,255,255,.5);
          font-size: 8px;
          font-weight: 950;
          letter-spacing: .45px;
        }
      `}</style>
    </section>
  );
}
