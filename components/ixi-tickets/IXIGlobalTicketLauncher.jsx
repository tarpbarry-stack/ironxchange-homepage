import { useEffect, useState } from "react";

import IXITicketLauncher from "./IXITicketLauncher";

export default function IXIGlobalTicketLauncher() {
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    let active = true;

    async function checkAuth() {
      try {
        const clientId = process.env.NEXT_PUBLIC_SHARETRIBE_CLIENT_ID;
        if (!clientId) return;

        const SharetribeSdk = await import("sharetribe-flex-sdk");
        const sdk = SharetribeSdk.createInstance({ clientId });
        await sdk.currentUser.show();
        if (active) setAuthorized(true);
      } catch {
        if (active) setAuthorized(false);
      }
    }

    checkAuth();
    return () => {
      active = false;
    };
  }, []);

  if (!authorized) return null;

  return (
    <aside className="ixi-global-ticket-launcher" aria-label="IXI Ticket controls">
      <IXITicketLauncher compact />

      <style jsx>{`
        .ixi-global-ticket-launcher {
          position: fixed;
          right: 18px;
          bottom: 18px;
          z-index: 2147483000;
          padding: 6px;
          border: 1px solid rgba(255, 196, 0, .16);
          border-radius: 6px;
          background: rgba(5, 5, 5, .94);
          box-shadow: 0 14px 34px rgba(0, 0, 0, .52);
          backdrop-filter: blur(10px);
        }

        @media (max-width: 850px) {
          .ixi-global-ticket-launcher {
            right: 10px;
            bottom: calc(10px + env(safe-area-inset-bottom));
          }
        }
      `}</style>
    </aside>
  );
}
