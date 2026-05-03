import Head from "next/head";
import { useState } from "react";

const STAGING = "https://staging.ironxchange.com";
const BRAND_YELLOW = "#FFC400";

const categories = [ /* your full list */ ];

export default function Home() {
  const [query, setQuery] = useState("");

  const handleSearch = () => {
    window.location.href = query 
      ? `${STAGING}/s?keywords=${encodeURIComponent(query)}` 
      : `${STAGING}/s`;
  };

  return (
    <>
      <Head>
        <title>IronXchange - Free Heavy Equipment Marketplace</title>
      </Head>

      <nav className="nav"> ... </nav>

      {/* Hero */}
      <section className="hero"> ... </section>

      {/* Search */}
      <section className="search-section"> ... </section>

      {/* Featured Equipment */}
      <section className="featured">
        <h2>FEATURED EQUIPMENT</h2>
        <div className="featured-grid">
          {/* Add your real featured listings here */}
        </div>
      </section>

      {/* List Your Equipment Section */}
      <section className="list-section">
        <h2>LIST YOUR EQUIPMENT IN MINUTES</h2>
        <div className="benefits-grid">
          <div>No Contracts</div>
          <div>No Reps</div>
          <div>No Fees</div>
          <div>Go Live Instantly</div>
        </div>
      </section>

      {/* Ready to Sell */}
      <section className="ready-section">
        <h2>READY TO SELL?</h2>
        <p>Join thousands of equipment owners already listing free.</p>
        <a href={`${STAGING}/l/new`} className="btn-primary">POST EQUIPMENT FREE →</a>
      </section>

      <footer> ... </footer>
    </>
  );
}
