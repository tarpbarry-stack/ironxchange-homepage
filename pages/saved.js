import Head from "next/head";
import { useEffect, useMemo, useState } from "react";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ListingCard from "../components/ListingCard";

import {
  fetchCurrentUserWithSavedListings,
  getSavedListingIdsFromUser,
  filterSavedListings
} from "../lib/savedListings";

const STAGING = "https://staging.ironxchange.com";
const BRAND_YELLOW = "#FFC400";

const featureKeywords = [
  { match: ["push block", "pushblock"], label: "Push Block" },
  { match: ["rear ripper", "ripper"], label: "Rear Ripper" },
  { match: ["smartgrade", "smart grade"], label: "SmartGrade" },
  { match: ["topcon"], label: "Topcon" },
  { match: ["trimble"], label: "Trimble" },
  { match: ["gps"], label: "GPS" },
  { match: ["joystick"], label: "Joystick Controls" },
  { match: ["20.5", "20.5 tires", "20.5r25"], label: "20.5 Tires" },
  { match: ["23.5", "23.5 tires", "23.5r25"], label: "23.5 Tires" },
  { match: ["aux hydraulics", "auxiliary hydraulics"], label: "Aux Hydraulics" },
  { match: ["quick coupler", "hydraulic coupler"], label: "Quick Coupler" },
  { match: ["thumb", "hydraulic thumb"], label: "Hydraulic Thumb" },
  { match: ["high flow", "hi-flow"], label: "High Flow" },
  { match: ["ride control"], label: "Ride Control" },
  { match: ["scale", "payload scale"], label: "Scale" },
  { match: ["auto lube", "autolube"], label: "Auto Lube" },
  { match: ["cold ac", "cold a/c", "cold air"], label: "Cold A/C" },
  { match: ["no def", "def deleted", "de-tier", "detier"], label: "No DEF" }
];

function getFeatureLine(item) {
  const text = [
    item.title,
    item.description,
    item.publicData?.description,
    item.publicData?.details,
    item.type,
    item.make,
    item.model
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const matches = featureKeywords
    .filter((feature) =>
      feature.match.some((term) => text.includes(term))
    )
    .map((feature) => feature.label);

  return [...new Set(matches)].slice(0, 4).join(" • ");
}

function slugify(text = "") {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function SavedListings() {
  const [listings, setListings] = useState([]);
  const [savedIds, setSavedIds] = useState([]);
  
  useEffect(() => {
  async function loadSavedPage() {
    try {
      const SharetribeSdk = await import("sharetribe-flex-sdk");

      const sdk = SharetribeSdk.createInstance({
        clientId: process.env.NEXT_PUBLIC_SHARETRIBE_CLIENT_ID
      });

      const currentUser = await fetchCurrentUserWithSavedListings(sdk);

      setSavedIds(
        getSavedListingIdsFromUser(currentUser)
      );

      const res = await fetch("/api/listings");
      const data = await res.json();

      if (Array.isArray(data)) {
        setListings(data);
      }
    } catch (err) {
      console.error("Saved page load failed:", err);
      setSavedIds([]);
    }
  }

  loadSavedPage();
}, []);

const savedListings = useMemo(() => {
  const activeListings = listings.filter(item => {
    const listingStatus =
      item.listingStatus ||
      item.publicData?.listingStatus ||
      item.attributes?.publicData?.listingStatus;

    return listingStatus !== "archived";
  });

  return filterSavedListings(activeListings, savedIds);
}, [listings, savedIds]);

  
  return (
    <>
     <Head>
  <title>Saved Listings | IronXchange</title>

  <link
    href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"
    rel="stylesheet"
  />
</Head>

      <Navbar />
     
<main>
  <div className="saved-head">
  <div>
    <h1>Saved Listings</h1>

    <p>
      Machines you've starred and saved for later.
    </p>
  </div>

  <span>
    {savedListings.length} SAVED
  </span>
</div>

  <div className="cards">
  {savedListings.map(item => (
    <ListingCard
      key={item.id || item.uuid || item.title}
      listing={item}
      saved={true}
      showSave={false}
      from="saved"
    />
  ))}
</div>

        {savedListings.length === 0 && (
          <p className="empty">No saved listings yet.</p>
        )}
      </main>

        <Footer />
        
      <style jsx>{`
        :global(body) {
          margin: 0;
          font-family: Arial, sans-serif;
          background: #0b0b0b;
          color: #d6d6d6;
        }

        main {
          padding: 40px 5%;
        }

        h1 {
          color: #f2f2f2;
          margin-bottom: 24px;
        }

.saved-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 24px;
}

.saved-head h1 {
  margin: 0;
  color: #F2F2F2;
  font-size: 30px;
  letter-spacing: -0.4px;
}

.saved-head p {
  margin: 8px 0 0;
  color: #8A8A8A;
  font-size: 14px;
}

.saved-head span {
  color: #777;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: .5px;
}

        .cards {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 22px;
        }

.empty {
  color: #999;
}

        @media (max-width: 850px) {
          .cards {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}
