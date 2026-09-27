import Head from "next/head";
import { useState } from "react";

const surfaces = [
  ["Marketplace", "/browse-v2"],
  ["Inventory", "/account/my-listings-v2"],
  ["SOLD", "/sold"],
  ["AOS", "/aos/work"],
  ["Auction Market", "/auction-market"],
  ["Auction Work", "/auction-work"],
];

// A viewport for the real pages, using their real authentication and state.
// No fixtures, duplicate engines, or alternate business commands.
export default function MobileCardReview() {
  const [width, setWidth] = useState(390);
  const [route, setRoute] = useState(surfaces[0][1]);
  return <>
    <Head><title>Mobile card review | IXI FaceLab</title></Head>
    <main>
      <h1>Mobile card review</h1>
      <p>Resize the actual page. Sign in inside the frame for company workspaces.</p>
      <label>Page <select value={route} onChange={event => setRoute(event.target.value)}>{surfaces.map(([label, path]) => <option key={path} value={path}>{label}</option>)}</select></label>
      <label>Viewport <select value={width} onChange={event => setWidth(Number(event.target.value))}>{[320, 375, 390, 430, 768, 850, 1024].map(value => <option key={value} value={value}>{value}px</option>)}</select></label>
      <a href={route} target="_blank" rel="noreferrer">Open page directly</a>
      <iframe title="Mobile page" src={route} style={{ width }} />
    </main>
    <style jsx>{`
      main { padding: 20px; background: #101210; color: #eee; min-height: 100vh; font: 14px system-ui; }
      label, a { display: inline-flex; align-items: center; gap: 8px; margin: 0 16px 16px 0; color: #ffc400; }
      select { padding: 10px; background: #191c19; color: #fff; }
      iframe { display: block; height: 850px; border: 1px solid #535a54; background: #101210; }
    `}</style>
  </>;
}

MobileCardReview.hideGlobalTicketLauncher = true;

export function getServerSideProps() {
  return process.env.NODE_ENV === "production" && process.env.VERCEL_ENV !== "preview"
    ? { notFound: true }
    : { props: {} };
}
