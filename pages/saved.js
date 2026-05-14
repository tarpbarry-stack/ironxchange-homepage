import Head from "next/head";
import { useEffect, useMemo, useState } from "react";

function slugify(text = "") {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function SavedListings() {
  const [listings, setListings] = useState([]);
  const [savedSlugs, setSavedSlugs] = useState([]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("ironxchangeSaved") || "[]");
    setSavedSlugs(saved);

    fetch("/api/listings")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setListings(data);
      })
      .catch(() => {});
  }, []);

  const savedListings = useMemo(() => {
    return listings.filter((item) => savedSlugs.includes(slugify(item.title)));
  }, [listings, savedSlugs]);

  return (
    <>
      <Head>
        <title>Saved Listings | IronXchange</title>
      </Head>

      <main>
        <h1>Saved Listings</h1>

        <div className="cards">
          {savedListings.map((item) => (
            <a
              href={`/listing/${slugify(item.title)}?from=browser`}
              className="card"
              key={item.id || item.title}
            >
              <div
                className="photo"
                style={{
                  backgroundImage: `url(${item.imageUrl || item.image || "/images/hero-equipment-yard.jpg"})`
                }}
              />

              <div className="body">
                <h3>{item.title}</h3>
                <p>{item.hours} · {item.location}</p>
                <strong>{item.price}</strong>
              </div>
            </a>
          ))}
        </div>

        {savedListings.length === 0 && (
          <p className="empty">No saved listings yet.</p>
        )}
      </main>

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

        .cards {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 22px;
        }

        .card {
          text-decoration: none;
          color: inherit;
          background: #151515;
          border: 1px solid #242424;
          border-radius: 16px;
          overflow: hidden;
        }

        .photo {
          height: 190px;
          background-size: cover;
          background-position: center;
        }

        .body {
          padding: 16px;
        }

        h3 {
          margin: 0 0 8px;
          color: #f2f2f2;
        }

        p {
          color: #999;
          font-size: 13px;
        }

        strong {
          color: #f2f2f2;
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
