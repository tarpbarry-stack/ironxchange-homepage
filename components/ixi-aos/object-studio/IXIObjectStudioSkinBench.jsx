import {
  listIXIAosSkins
} from "../skin-runtime/IXIAosSkinLibrary";


export default function IXIObjectStudioSkinBench({
  selectedSkinId = "",
  onSelectSkin
}) {
  const skins =
    listIXIAosSkins();


  return (
    <section className="ixi-object-studio-skin-bench">

      <div className="skin-bench-head">
        <strong>
          SKIN BENCH
        </strong>

        <span>
          APPEARANCE ONLY
        </span>
      </div>


      <div className="skin-bench-copy">
        Select a reusable AOS skin.
        Face function and geometry remain unchanged.
      </div>


      <div className="skin-grid">
        {skins.map(
          skin => {

            const active =
              skin.skinId ===
              selectedSkinId;


            return (
              <button
                key={
                  skin.skinId
                }

                type="button"

                className={[
                  "skin-option",
                  active
                    ? "active"
                    : ""
                ]
                  .filter(Boolean)
                  .join(" ")}

                onPointerDown={
                  event => {
                    event.preventDefault();
                    event.stopPropagation();
                  }
                }

                onClick={
                  event => {
                    event.preventDefault();
                    event.stopPropagation();

                    onSelectSkin?.(
                      skin.skinId
                    );
                  }
                }
              >

                <div
                  className="skin-swatch"

                  style={{
                    background:
                      skin
                        ?.tokens
                        ?.shellBackground ||
                      "#141414",

                    borderColor:
                      skin
                        ?.tokens
                        ?.borderStrong ||
                      "rgba(255,255,255,.12)"
                  }}
                >
                  <div
                    className="skin-swatch-panel"

                    style={{
                      background:
                        skin
                          ?.tokens
                          ?.surfaceRaised ||
                        "rgba(14,14,14,.72)",

                      borderColor:
                        skin
                          ?.tokens
                          ?.border ||
                        "rgba(255,255,255,.07)"
                    }}
                  >
                    <span
                      style={{
                        background:
                          skin
                            ?.tokens
                            ?.accent ||
                          "#ffc400"
                      }}
                    />

                    <span
                      style={{
                        background:
                          skin
                            ?.tokens
                            ?.textMuted ||
                          "rgba(255,255,255,.46)"
                      }}
                    />

                    <span
                      style={{
                        background:
                          skin
                            ?.tokens
                            ?.textStrong ||
                          "#f2f2f2"
                      }}
                    />
                  </div>
                </div>


                <div className="skin-option-copy">
                  <strong>
                    {skin.label}
                  </strong>

                  <span>
                    {skin.description}
                  </span>
                </div>


                {active ? (
                  <div className="skin-active-mark">
                    ACTIVE
                  </div>
                ) : null}

              </button>
            );
          }
        )}
      </div>


      <style jsx>{`
        .ixi-object-studio-skin-bench,
        .ixi-object-studio-skin-bench * {
          box-sizing:
            border-box;
        }


        .ixi-object-studio-skin-bench {
          width:
            100%;

          min-width:
            0;

          display:
            flex;

          flex-direction:
            column;

          gap:
            10px;
        }


        .skin-bench-head {
          min-height:
            28px;

          display:
            flex;

          align-items:
            center;

          justify-content:
            space-between;

          gap:
            10px;

          padding:
            0 2px 8px;

          border-bottom:
            1px solid
            rgba(
              255,
              255,
              255,
              .06
            );
        }


        .skin-bench-head strong {
          color:
            #ffc400;

          font-size:
            9px;

          font-weight:
            950;

          line-height:
            1;

          letter-spacing:
            .62px;

          text-transform:
            uppercase;
        }


        .skin-bench-head span {
          color:
            rgba(
              255,
              255,
              255,
              .28
            );

          font-size:
            6.5px;

          font-weight:
            950;

          line-height:
            1;

          letter-spacing:
            .46px;

          text-transform:
            uppercase;
        }


        .skin-bench-copy {
          color:
            rgba(
              255,
              255,
              255,
              .38
            );

          font-size:
            7px;

          font-weight:
            750;

          line-height:
            1.4;
        }


        .skin-grid {
          width:
            100%;

          min-width:
            0;

          display:
            grid;

          grid-template-columns:
            1fr;

          gap:
            7px;
        }


        .skin-option {
          position:
            relative;

          width:
            100%;

          min-width:
            0;

          min-height:
            76px;

          display:
            grid;

          grid-template-columns:
            58px
            minmax(
              0,
              1fr
            );

          align-items:
            center;

          gap:
            10px;

          margin:
            0;

          padding:
            8px;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              .065
            );

          border-radius:
            7px;

          background:
            linear-gradient(
              180deg,
              rgba(
                255,
                255,
                255,
                .024
              ),
              rgba(
                255,
                255,
                255,
                0
              )
            ),
            rgba(
              8,
              8,
              8,
              .42
            );

          color:
            inherit;

          text-align:
            left;

          cursor:
            pointer;

          overflow:
            hidden;

          transition:
            border-color
            .14s ease,
            background
            .14s ease,
            box-shadow
            .14s ease;
        }


        .skin-option:hover {
          border-color:
            rgba(
              255,
              196,
              0,
              .22
            );

          background:
            linear-gradient(
              180deg,
              rgba(
                255,
                196,
                0,
                .035
              ),
              rgba(
                255,
                255,
                255,
                0
              )
            ),
            rgba(
              8,
              8,
              8,
              .48
            );
        }


        .skin-option.active {
          border-color:
            rgba(
              255,
              196,
              0,
              .42
            );

          background:
            linear-gradient(
              180deg,
              rgba(
                255,
                196,
                0,
                .07
              ),
              rgba(
                255,
                196,
                0,
                .012
              )
            ),
            rgba(
              8,
              8,
              8,
              .52
            );

          box-shadow:
            inset 0 0 0 1px
            rgba(
              255,
              196,
              0,
              .055
            );
        }


        .skin-swatch {
          width:
            58px;

          height:
            58px;

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          border:
            1px solid;

          border-radius:
            6px;

          overflow:
            hidden;

          box-shadow:
            inset 0 1px 0
            rgba(
              255,
              255,
              255,
              .12
            );
        }


        .skin-swatch-panel {
          width:
            40px;

          height:
            38px;

          display:
            flex;

          flex-direction:
            column;

          justify-content:
            center;

          gap:
            5px;

          padding:
            6px;

          border:
            1px solid;

          border-radius:
            4px;
        }


        .skin-swatch-panel span {
          display:
            block;

          height:
            3px;

          border-radius:
            99px;
        }


        .skin-swatch-panel span:first-child {
          width:
            72%;
        }


        .skin-swatch-panel span:nth-child(2) {
          width:
            90%;
        }


        .skin-swatch-panel span:nth-child(3) {
          width:
            58%;
        }


        .skin-option-copy {
          min-width:
            0;

          display:
            flex;

          flex-direction:
            column;

          gap:
            5px;

          padding-right:
            38px;
        }


        .skin-option-copy strong {
          color:
            rgba(
              255,
              255,
              255,
              .82
            );

          font-size:
            8px;

          font-weight:
            950;

          line-height:
            1;

          letter-spacing:
            .5px;

          text-transform:
            uppercase;
        }


        .skin-option.active
          .skin-option-copy strong {
          color:
            #ffc400;
        }


        .skin-option-copy span {
          color:
            rgba(
              255,
              255,
              255,
              .34
            );

          font-size:
            6.6px;

          font-weight:
            700;

          line-height:
            1.35;
        }


        .skin-active-mark {
          position:
            absolute;

          top:
            7px;

          right:
            7px;

          color:
            rgba(
              255,
              196,
              0,
              .64
            );

          font-size:
            5.8px;

          font-weight:
            950;

          letter-spacing:
            .38px;

          text-transform:
            uppercase;
        }
      `}</style>

    </section>
  );
}
