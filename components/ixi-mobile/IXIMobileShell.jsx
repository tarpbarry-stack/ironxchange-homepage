import { useRouter } from "next/router";

const MOBILE_DESTINATIONS = [
  {
    id: "marketplace",
    label: "MARKET",
    href: "/browse-v2",
    symbol: "M",
    matches: path =>
      path === "/browse-v2" || path.startsWith("/listing/")
  },
  {
    id: "private",
    label: "PRIVATE",
    href: "/account/my-listings-v2",
    symbol: "P",
    matches: path => path === "/account/my-listings-v2"
  },
  {
    id: "post",
    label: "POST",
    href: "/post-free",
    symbol: "+",
    primary: true,
    matches: path =>
      path === "/post-free" ||
      path === "/url-import" ||
      path === "/bulk-import" ||
      path === "/live"
  },
  {
    id: "auction",
    label: "AUCTION",
    href: "/auction-market",
    symbol: "A",
    matches: path => path.startsWith("/auction-")
  },
  {
    id: "aos",
    label: "AOS",
    href: "/aos/work",
    symbol: "IXI",
    matches: path => path === "/aos" || path.startsWith("/aos/")
  }
];

export default function IXIMobileShell() {
  const router = useRouter();
  const path = String(router.asPath || "").split(/[?#]/u)[0];

  return (
    <>
      <nav
        className="ixi-mobile-dock"
        aria-label="IXI mobile navigation"
        data-ixi-mobile-shell="foundation"
      >
        {MOBILE_DESTINATIONS.map(destination => {
          const active = destination.matches(path);

          return (
            <a
              key={destination.id}
              href={destination.href}
              className={[
                "ixi-mobile-destination",
                active ? "active" : "",
                destination.primary ? "primary" : ""
              ]
                .filter(Boolean)
                .join(" ")}
              aria-current={active ? "page" : undefined}
            >
              <span
                className="ixi-mobile-destination-symbol"
                aria-hidden="true"
              >
                {destination.symbol}
              </span>
              <span className="ixi-mobile-destination-label">
                {destination.label}
              </span>
            </a>
          );
        })}
      </nav>

      <style jsx>{`
        .ixi-mobile-dock {
          display: none;
        }

        @media (max-width: 850px) {
          .ixi-mobile-dock {
            box-sizing: border-box;
            position: fixed;
            z-index: 2147482000;
            left: 0;
            right: 0;
            bottom: 0;
            height: calc(64px + env(safe-area-inset-bottom));
            padding: 5px 5px env(safe-area-inset-bottom);
            display: grid;
            grid-template-columns: repeat(5, minmax(0, 1fr));
            gap: 3px;
            border-top: 1px solid rgba(255,255,255,.11);
            background:
              linear-gradient(180deg, rgba(255,255,255,.035), rgba(255,255,255,0)),
              rgba(5,5,5,.97);
            box-shadow:
              0 -12px 30px rgba(0,0,0,.48),
              inset 0 1px 0 rgba(255,255,255,.025);
            backdrop-filter: blur(18px);
          }

          .ixi-mobile-destination {
            min-width: 0;
            min-height: 54px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 4px;
            border: 1px solid transparent;
            border-radius: 8px;
            color: rgba(255,255,255,.48);
            text-decoration: none;
            -webkit-tap-highlight-color: transparent;
          }

          .ixi-mobile-destination-symbol {
            height: 22px;
            min-width: 22px;
            display: grid;
            place-items: center;
            border: 1px solid rgba(255,255,255,.15);
            border-radius: 6px;
            color: rgba(255,255,255,.72);
            font: 900 11px/1 'Inter Variable', Inter, sans-serif;
            letter-spacing: -.02em;
          }

          .ixi-mobile-destination-label {
            max-width: 100%;
            overflow: hidden;
            color: inherit;
            font: 850 9px/1 'Inter Variable', Inter, sans-serif;
            letter-spacing: .055em;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .ixi-mobile-destination.active {
            border-color: rgba(255,196,0,.18);
            background: rgba(255,196,0,.055);
            color: #ffc400;
          }

          .ixi-mobile-destination.active .ixi-mobile-destination-symbol {
            border-color: rgba(255,196,0,.72);
            color: #ffc400;
            box-shadow: 0 0 12px rgba(255,196,0,.14);
          }

          .ixi-mobile-destination.primary .ixi-mobile-destination-symbol {
            border-color: rgba(255,196,0,.62);
            background: #ffc400;
            color: #080808;
            font-size: 19px;
          }
        }
      `}</style>

      <style jsx global>{`
        @media (max-width: 850px) {
          html,
          body {
            width: 100%;
            max-width: 100%;
            overflow-x: hidden;
          }

          body {
            padding-bottom: calc(64px + env(safe-area-inset-bottom));
            background: #070707;
          }
        }
      `}</style>
    </>
  );
}
