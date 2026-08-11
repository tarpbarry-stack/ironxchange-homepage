export default function IXIObjectStudioHeader({
  studio
}) {

  const objectName =
    studio
      ?.objectDraft
      ?.displayName ||
    "UNTITLED OBJECT";


  const status =
    studio?.dirty
      ? "DRAFT"
      : "READY";


  function handleLaunch() {

    const result =
      studio
        ?.buildLaunchPayload?.();


    if (
      !result?.ok
    ) {
      console.error(
        "OBJECT STUDIO VALIDATION",
        result?.errors
      );

      return;
    }


    console.log(
      "IXI OBJECT LAUNCH PAYLOAD",
      result.payload
    );


    /*
     * TEMPORARY.
     *
     * AWS adapter will eventually own
     * the actual commit.
     */
    studio
      ?.markCommitted?.();
  }


  return (
    <header className="studio-header">

      <div className="header-left">

        <span className="eyebrow">
          IXI OBJECT STUDIO
        </span>

        <strong>
          {objectName}
        </strong>

      </div>


      <div className="header-status">

        <span
          className={
            studio?.dirty
              ? "dirty"
              : "ready"
          }
        />

        {status}

      </div>


      <div className="header-actions">

        <button
          type="button"
        >
          SAVE DESIGN
        </button>


        <button
          type="button"

          className="launch"

          disabled={
            !studio?.valid
          }

          onClick={
            handleLaunch
          }
        >
          OBJECT LAUNCH
        </button>

      </div>


      <style jsx>{`

        .studio-header {
          min-height: 58px;

          display: grid;

          grid-template-columns:
            1fr
            auto
            auto;

          gap: 18px;

          align-items: center;

          padding:
            10px 14px;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              .05
            );

          border-radius: 9px;

          background:
            rgba(
              255,
              255,
              255,
              .012
            );
        }


        .header-left {
          min-width: 0;

          display: flex;
          flex-direction: column;

          gap: 4px;
        }


        .eyebrow {
          color: #ffc400;

          font-size: 7px;
          font-weight: 950;

          letter-spacing:
            .10em;
        }


        strong {
          color:
            rgba(
              255,
              255,
              255,
              .82
            );

          font-size: 17px;
          font-weight: 950;

          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }


        .header-status {
          display: flex;

          align-items: center;

          gap: 6px;

          color:
            rgba(
              255,
              255,
              255,
              .34
            );

          font-size: 7px;
          font-weight: 950;
        }


        .header-status span {
          width: 7px;
          height: 7px;

          border-radius: 999px;
        }


        .header-status .dirty {
          background:
            #ffc400;
        }


        .header-status .ready {
          background:
            #24c55e;
        }


        .header-actions {
          display: flex;

          gap: 6px;
        }


        button {
          height: 31px;

          padding:
            0 12px;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              .07
            );

          border-radius: 5px;

          background:
            rgba(
              255,
              255,
              255,
              .02
            );

          color:
            rgba(
              255,
              255,
              255,
              .46
            );

          font-size: 7px;
          font-weight: 950;

          cursor: pointer;
        }


        button:hover {
          color: white;
        }


        .launch {
          border-color:
            rgba(
              255,
              196,
              0,
              .34
            );

          background:
            rgba(
              255,
              196,
              0,
              .92
            );

          color: #050505;
        }


        .launch:disabled {
          opacity: .35;

          cursor: default;
        }

      `}</style>

    </header>
  );
}
