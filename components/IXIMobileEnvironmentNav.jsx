import { useRouter } from "next/router";

const destinations = [
  ["IXI MKT", "/browse-v2"],
  ["IXI WRK", "/saved"],
  ["IXI SLLRS", "/yard"],
  ["DASHBOARD", "/account"],
  ["IXI SOLD", "/sold"],
  ["IXI INV", "/account/my-listings-v2"],
  ["POST", "/post-free"],
  ["AOS", "/aos/work"],
  ["TRAN$ACT", "/transact"],
  ["SALES DESK", "/sales-desk"]
];

export default function IXIMobileEnvironmentNav() {
  const { asPath } = useRouter();
  const current = asPath.split("?")[0];
  return <nav className="ixi-mobile-environments" aria-label="IXI mobile environments">
    {destinations.map(([label, href]) => <a key={href} href={href}
      aria-current={current === href || (href === "/transact" && current.startsWith("/transact/")) ? "page" : undefined}>{label}</a>)}
    <style jsx>{`
      .ixi-mobile-environments { display: none; }
      @media (max-width: 850px) {
        .ixi-mobile-environments { display: flex; align-items: center; gap: 6px; width: 100%; max-width: 100vw; height: 48px; padding: 0 10px; overflow-x: auto; overflow-y: hidden; overscroll-behavior-inline: contain; scrollbar-width: none; background: #0b0d0b; border-bottom: 1px solid #30362b; }
        .ixi-mobile-environments::-webkit-scrollbar { display: none; }
        .ixi-mobile-environments a { display: inline-flex; align-items: center; justify-content: center; flex: 0 0 auto; min-height: 44px; padding: 0 10px; color: #c5cbc0; font-size: 11px; font-weight: 750; letter-spacing: .03em; text-decoration: none; white-space: nowrap; }
        .ixi-mobile-environments a[aria-current="page"] { color: #ffc400; border-bottom: 2px solid #ffc400; }
        .ixi-mobile-environments a:focus-visible { outline: 2px solid #ffc400; outline-offset: -2px; }
      }
    `}</style>
  </nav>;
}
