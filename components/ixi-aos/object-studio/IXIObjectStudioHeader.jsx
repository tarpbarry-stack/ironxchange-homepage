import {
  useState
} from "react";

import {
  loadIXIMosEnvironment
} from "../../../lib/mos/loadIXIMosEnvironment";

import {
  buildCommittedStudioDraft,
  commitAosStudioLaunch
} from "../../../lib/mos/ixiAosObjectCommit";


export default function IXIObjectStudioHeader({
  studio
}) {

  const [launching, setLaunching] =
    useState(false);

  const [launchError, setLaunchError] =
    useState("");

  const [launchIdentity, setLaunchIdentity] =
    useState(null);


  const objectName =
    studio?.objectDraft?.displayName ||
    "UNTITLED OBJECT";

  const untouchedProofFixture =
    studio?.objectDraft?.objectId ===
      "studio:proof-object" &&
    String(objectName).trim().toUpperCase() ===
      "2020 FORD F350";

  const customerNameReady =
    Boolean(String(objectName).trim()) &&
    ![
      "UNTITLED OBJECT",
      "NEW OBJECT"
    ].includes(
      String(objectName).trim().toUpperCase()
    ) &&
    !untouchedProofFixture;


  const status =
    launchIdentity && !studio?.dirty
      ? "COMMITTED"
      : studio?.dirty
        ? "DRAFT"
        : "READY";


  async function handleLaunch() {
    if (launching) {
      return;
    }

    if (!customerNameReady) {
      setLaunchError(
        "Name the Object before permanent creation."
      );
      return;
    }

    setLaunching(true);
    setLaunchError("");

    try {
      const result =
        studio?.buildLaunchPayload?.();

      if (!result?.ok) {
        const error = new Error(
          result?.errors?.[0] ||
          "Object Studio validation failed."
        );
        error.code =
          "AOS_STUDIO_VALIDATION_FAILED";
        throw error;
      }

      const environment =
        await loadIXIMosEnvironment({
          includeObjects: false
        });

      if (!environment?.isAuthenticated) {
        const error = new Error(
          "Sign in before permanently creating an AOS Object."
        );
        error.code =
          "AOS_STUDIO_AUTH_REQUIRED";
        throw error;
      }

      const entityId =
        environment?.entity?.entityId;

      if (!entityId) {
        const error = new Error(
          "Object Studio could not resolve the active AOS Entity."
        );
        error.code =
          "AOS_STUDIO_ENTITY_REQUIRED";
        throw error;
      }

      const committed =
        await commitAosStudioLaunch({
          launchPayload:
            result.payload,
          entityId,
          actorId:
            environment?.userId || null
        });

      if (
        !committed?.identity?.objectId ||
        !committed?.identity?.passportId ||
        committed?.transact?.eligible !== true
      ) {
        const error = new Error(
          "Object Studio could not verify the permanent Object + Passport + TRAN$ACT identity."
        );
        error.code =
          "AOS_STUDIO_COMMIT_UNVERIFIED";
        throw error;
      }

      const snapshot =
        studio?.getSnapshot?.();

      studio?.replaceDraft?.(
        buildCommittedStudioDraft({
          snapshot,
          object:
            committed.object
        })
      );

      setLaunchIdentity({
        objectId:
          committed.identity.objectId,
        passportId:
          committed.identity.passportId
      });

    } catch (error) {
      setLaunchError(
        error?.message ||
        "Object Studio launch failed."
      );
    } finally {
      setLaunching(false);
    }
  }


  return (
    <header className="studio-header">

      <div className="header-left">
        <span className="eyebrow">
          IXI OBJECT STUDIO
        </span>

        <strong>{objectName}</strong>

        {launchIdentity ? (
          <span className="identity-line">
            {launchIdentity.objectId} · {launchIdentity.passportId}
          </span>
        ) : launchError ? (
          <span className="error-line">
            {launchError}
          </span>
        ) : null}
      </div>


      <div className="header-status">
        <span
          className={
            launchIdentity && !studio?.dirty
              ? "committed"
              : studio?.dirty
                ? "dirty"
                : "ready"
          }
        />
        {status}
      </div>


      <div className="header-actions">
        <button type="button">
          SAVE DESIGN
        </button>

        <button
          type="button"
          className="launch"
          disabled={
            !studio?.valid ||
            !customerNameReady ||
            launching
          }
          onClick={handleLaunch}
        >
          {launching
            ? "COMMITTING…"
            : studio?.draft?.mode === "edit"
              ? "SAVE OBJECT"
              : "OBJECT LAUNCH"}
        </button>
      </div>


      <style jsx>{`
        .studio-header {
          min-height: 58px;
          display: grid;
          grid-template-columns: 1fr auto auto;
          gap: 18px;
          align-items: center;
          padding: 10px 14px;
          border: 1px solid rgba(255,255,255,.05);
          border-radius: 9px;
          background: rgba(255,255,255,.012);
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
          letter-spacing: .10em;
        }

        strong {
          color: rgba(255,255,255,.82);
          font-size: 17px;
          font-weight: 950;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .identity-line,
        .error-line {
          max-width: 760px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 7px;
          font-weight: 850;
          letter-spacing: .03em;
        }

        .identity-line {
          color: rgba(112,255,166,.72);
        }

        .error-line {
          color: rgba(255,125,125,.9);
        }

        .header-status {
          display: flex;
          align-items: center;
          gap: 6px;
          color: rgba(255,255,255,.34);
          font-size: 7px;
          font-weight: 950;
        }

        .header-status span {
          width: 7px;
          height: 7px;
          border-radius: 999px;
        }

        .header-status .dirty {
          background: #ffc400;
        }

        .header-status .ready {
          background: #24c55e;
        }

        .header-status .committed {
          background: #70ffa6;
          box-shadow: 0 0 8px rgba(112,255,166,.32);
        }

        .header-actions {
          display: flex;
          gap: 6px;
        }

        button {
          height: 31px;
          padding: 0 12px;
          border: 1px solid rgba(255,255,255,.07);
          border-radius: 5px;
          background: rgba(255,255,255,.02);
          color: rgba(255,255,255,.46);
          font-size: 7px;
          font-weight: 950;
          cursor: pointer;
        }

        button:hover {
          color: white;
        }

        .launch {
          border-color: rgba(255,196,0,.34);
          background: rgba(255,196,0,.92);
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
