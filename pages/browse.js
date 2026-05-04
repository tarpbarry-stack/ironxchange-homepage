import Head from "next/head";
import { useState, useEffect } from "react";

const STAGING = "https://staging.ironxchange.com";
const BRAND_YELLOW = "#FFC400";

const categories = [
  "ALL CATEGORIES",
  "EXCAVATORS",
  "DOZERS",
  "WHEEL LOADERS",
  "MOTOR GRADERS",
  "TRUCKS",
  "SKID STEER/CTL"
];

const listings = [
  {
    title: "2023 KOMATSU WA475-10",
    type: "Wheel Loader",
    hours: "5,790 Hrs",
    location: "Post, TX",
    price: "$175,500",
    image: "/images/2023-komatsu-wa475-10.jpg",
    link: "https://staging.ironxchange.com/l/2023-komatsu-wa475-4-989-hrs/69f80a91-ef02-446d-bfa8-61f00353e32e"
  },
  {
    title: "2020 DEERE 772GP",
    type: "Motor Grader",
    hours: "3,907 Hrs",
    location: "Colorado City, TX",
    price: "$179,000",
    image: "/images/2020-Deere-772GP.jpg",
    link: "https://staging.ironxchange.com/l/2020-deere-772gp-4-790-hrs/69f7ffd8-f07e-4587-a4dd-4a1fa7626d91"
  },
  {
    title: "2019 MCCLOSKEY I54",
    type: "Crusher",
    hours: "4,016 Hrs",
    location: "Jal, NM",
    price: "$315,000",
    image: "/images/2019-mccloskey-i54.jpg",
    link: "https://staging.ironxchange.com/l/2019-mccloskey-i54-4-118-hrs/69f8117f-38b5-4218-893f-bbdab94b929d"
  }
];

export default function Browse() {
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("ALL CATEGORIES");
  const [liveListings, setLiveListings] = useState([]);

  useEffect(() => {
    fetch(`${STAGING}/api/listings`)
      .then(res => res.json())
      .then(data => setLiveListings(data))
      .catch(() => {});
  }, []);

  const displayListings = liveListings.length ? liveListings : listings;

  const handleSearch = () => {
    const terms = [
      searchQuery.trim(),
      category !== "ALL CATEGORIES" ? category : ""
    ].filter(Boolean).join(" ");

    window.location.href = terms
      ? `${STAGING}/s?keywords=${encodeURIComponent(terms)}`
      : `${STAGING}/s`;
  };

  return (
    <>
      <Head>
        <title>Browse Equipment | IronXchange</title>
      </Head>

      <nav className="nav">
        <a href="/">
          <img src="/images/ironxchange-logo.png" className="logo-img" />
        </a>

        <div className="nav-links">
          <a href="/browse">Browse Equipment</a>
          <a href={`${STAGING}/l/new`} className="yellow-link">
            Post Equipment Free
          </a>
        </div>
      </nav>

      <section className="search-section">
        <h2>Browse Equipment</h2>

        <div className="search-container">
          <input
            placeholder="Search equipment..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />

          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>

          <button onClick={handleSearch}>Search</button>
        </div>
      </section>

      <section className="featured">
        <div className="cards">
          {displayListings.map((item) => (
            <div className="card" key={item.title}>
              <a
                href={item.link}
                className="card-photo"
                style={{ backgroundImage: `url(${item.image})` }}
              />

              <div className="card-body">
                <h3>{item.title}</h3>
                <p>{item.type}</p>

                <div className="meta">
                  <span>{item.hours}</span>
                  <span>{item.location}</span>
                </div>

                <div className="price-row">
                  <strong>{item.price}</strong>
                  <a href={item.link}>VIEW DETAILS</a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <style jsx>{`
        body { margin: 0; font-family: Inter; }

        .nav {
          background: #050505;
          color: white;
          padding: 15px 5%;
          display: flex;
          justify-content: space-between;
        }

        .logo-img { height: 60px; }

        .nav-links a {
          margin-left: 20px;
          color: white;
          text-decoration: none;
        }

        .yellow-link { color: ${BRAND_YELLOW}; }

        .search-section {
          padding: 40px;
          text-align: center;
        }

        .search-container {
          display: grid;
          grid-template-columns: 1fr 200px 120px;
          gap: 10px;
          max-width: 800px;
          margin: auto;
        }

        input, select { padding: 12px; }

        button {
          background: ${BRAND_YELLOW};
          border: none;
        }

        .cards {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          padding: 40px;
        }

        .card {
          border: 1px solid #ddd;
          border-radius: 10px;
          overflow: hidden;
        }

        .card-photo {
          height: 180px;
          background-size: cover;
          background-position: center;
          display: block;
        }

        .card-body { padding: 15px; }

        .price-row {
          display: flex;
          justify-content: space-between;
        }
      `}</style>
    </>
  );
}
