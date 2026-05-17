import Head from "next/head";
import { useMemo, useState } from "react";

import motorGradersTaxonomy from "../lib/motorGradersTaxonomy";
import wheelLoadersTaxonomy from "../lib/wheelLoadersTaxonomy";
import dozersTaxonomy from "../lib/dozersTaxonomy";
import excavatorsTaxonomy from "../lib/excavatorsTaxonomy";
import aerialTaxonomy from "../lib/aerialTaxonomy";
import aggregateTaxonomy from "../lib/aggregateTaxonomy";
import agricultureHarvestersTaxonomy from "../lib/agricultureHarvestersTaxonomy";
import agricultureTractorsTaxonomy from "../lib/agricultureTractorsTaxonomy";
import asphaltEquipmentTaxonomy from "../lib/asphaltEquipmentTaxonomy";
import backhoeLoadersTaxonomy from "../lib/backhoeLoadersTaxonomy";
import compactionRollersTaxonomy from "../lib/compactionRollersTaxonomy";
import cranesTaxonomy from "../lib/cranesTaxonomy";
import crawlerCarriersTaxonomy from "../lib/crawlerCarriersTaxonomy";
import drillsAndPilingTaxonomy from "../lib/drillsAndPilingTaxonomy";
import dumpTrucksTaxonomy from "../lib/dumpTrucksTaxonomy";
import forkliftsTaxonomy from "../lib/forkliftsTaxonomy";
import scraperTaxonomy from "../lib/scraperTaxonomy";
import skidSteerCtlTaxonomy from "../lib/skidSteerCtlTaxonomy";
import telehandlersTaxonomy from "../lib/telehandlersTaxonomy";
import trenchersTaxonomy from "../lib/trenchersTaxonomy";
import trailersTaxonomy from "../lib/trailersTaxonomy";
import trucksTaxonomy from "../lib/trucksTaxonomy";
import attachmentsPartsTaxonomy from "../lib/attachmentsPartsTaxonomy";
import supportEquipmentTaxonomy from "../lib/supportEquipmentTaxonomy";
import utilityCartsTaxonomy from "../lib/utilityCartsTaxonomy";

const BRAND_YELLOW = "#FFC400";

const taxonomyMap = {
  "AERIAL EQUIPMENT": aerialTaxonomy,
  "AGGREGATE": aggregateTaxonomy,
  "AGRICULTURE HARVESTERS": agricultureHarvestersTaxonomy,
  "AGRICULTURE TRACTORS": agricultureTractorsTaxonomy,
  "ASPHALT EQUIPMENT": asphaltEquipmentTaxonomy,
  "BACKHOE LOADERS": backhoeLoadersTaxonomy,
  "COMPACTION/ROLLERS": compactionRollersTaxonomy,
  "CRANES": cranesTaxonomy,
  "CRAWLER CARRIERS / LOADER": crawlerCarriersTaxonomy,
  "DOZERS": dozersTaxonomy,
  "DRILLS & PILING": drillsAndPilingTaxonomy,
  "DUMP TRUCKS - ARTIC/RIGID": dumpTrucksTaxonomy,
  "EXCAVATORS": excavatorsTaxonomy,
  "FORKLIFTS": forkliftsTaxonomy,
  "MOTOR GRADERS": motorGradersTaxonomy,
  "SCRAPER": scraperTaxonomy,
  "SKID STEER/CTL": skidSteerCtlTaxonomy,
  "TELEHANDLERS": telehandlersTaxonomy,
  "TRENCHERS/PLOWS": trenchersTaxonomy,
  "TRAILERS": trailersTaxonomy,
  "TRUCKS": trucksTaxonomy,
  "WHEEL LOADERS": wheelLoadersTaxonomy,
  "ATTACHMENTS / PARTS": attachmentsPartsTaxonomy,
  "SUPPORT EQUIPMENT": supportEquipmentTaxonomy,
  "UTILITY CARTS": utilityCartsTaxonomy
};

const categories = Object.keys(taxonomyMap);

function cleanNumber(value = "") {
  return String(value).replace(/[^0-9]/g, "");
}

export default function PostFreePage() {
  const [category, setCategory] = useState("EXCAVATORS");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [hours, setHours] = useState("");
  const [price, setPrice] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState([]);

  const taxonomy = taxonomyMap[category] || [];

  const availableMakes = useMemo(() => {
    return Array.from(
      new Set(taxonomy.map(x => x.make).filter(Boolean))
    );
  }, [taxonomy]);

  const availableModels = useMemo(() => {
    return Array.from(
      new Set(
        taxonomy
          .filter(x => x.make === make)
          .map(x => x.model)
          .filter(Boolean)
      )
    );
  }, [taxonomy, make]);

  const listingTitle = useMemo(() => {
    const parts = [year, make, model].filter(Boolean).join(" ");

    if (!parts) return "Year Make Model – Hours";

    return hours
      ? `${parts} – ${Number(cleanNumber(hours)).toLocaleString()} Hrs`
      : parts;
  }, [year, make, model, hours]);

  function handlePhotos(e) {
    const files = Array.from(e.target.files || []);

    const mapped = files.slice(0, 24).map(file => ({
      file,
      url: URL.createObjectURL(file)
    }));

    setPhotos(mapped);
  }

  return (
    <>
      <Head>
        <title>Post Free | IronXchange</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        <link
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"
          rel="stylesheet"
        />
      </Head>

      <main>
        <nav className="nav">
          <a href="/" className="logo-wrap">
            <img
              src="/images/ironxchange-logo.png"
              className="logo-img"
              alt="IronXchange"
            />
          </a>

          <div className="nav-links">
            <a href="/browse">SEARCH</a>
            <a href="/account">ACCOUNT</a>
          </div>
        </nav>

        <section className="page">
          <section className="form-panel">
            <div className="section-head">
              <div>
                <h1>Post Free Listing</h1>
                <p>Fast. Structured. Searchable.</p>
              </div>

              <div className="status-pill">
                <span></span>
                LIVE IN MINUTES
              </div>
            </div>

            <div className="form-grid">
              <label className="wide">
                <span>Category</span>
                <select
                  value={category}
                  onChange={e => {
                    setCategory(e.target.value);
                    setMake("");
                    setModel("");
                  }}
                >
                  {categories.map(cat => (
                    <option key={cat}>{cat}</option>
                  ))}
                </select>
              </label>

              <label>
                <span>Year</span>
                <input
                  value={year}
                  onChange={e => setYear(cleanNumber(e.target.value).slice(0,4))}
                  placeholder="2021"
                />
              </label>

              <label>
                <span>Make</span>
                <select
                  value={make}
                  onChange={e => {
                    setMake(e.target.value);
                    setModel("");
                  }}
                >
                  <option value="">Select Make</option>
                  {availableMakes.map(item => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>

              <label>
                <span>Model</span>
                <select
                  value={model}
                  onChange={e => setModel(e.target.value)}
                >
                  <option value="">Select Model</option>
                  {availableModels.map(item => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>

              <label>
                <span>Hours</span>
                <input
                  value={hours}
                  onChange={e => setHours(cleanNumber(e.target.value).slice(0,5))}
                  placeholder="4987"
                />
              </label>

              <label>
                <span>Price</span>
                <input
                  value={price}
                  onChange={e => setPrice(cleanNumber(e.target.value))}
                  placeholder="68900"
                />
              </label>

              <label className="wide">
                <span>Location</span>
                <input
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="Amarillo, TX"
                />
              </label>
            </div>

            <div className="photos-panel">
              <div className="photos-head">
                <h2>Photos</h2>
                <span>{photos.length} Uploaded</span>
              </div>

              <label className="upload-box">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotos}
                />

                <i className="fa-regular fa-images"></i>
                <strong>Select Photos</strong>
                <p>Front • Rear • Sides • Cab • Meter • Engine • UC</p>
              </label>

              {photos.length > 0 && (
                <div className="photo-grid">
                  {photos.map((photo, index) => (
                    <img
                      key={index}
                      src={photo.url}
                      alt={`Upload ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>

            <label>
              <span>Description</span>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Straight machine. Tight. No known codes. Ready to work."
              />
            </label>

            <button className="submit-btn" type="button">
              POST FREE
            </button>
          </section>

          <aside className="preview-panel">
            <div className="preview-card">
              <div className="preview-image">
                {photos[0] ? (
                  <img src={photos[0].url} alt="Preview" />
                ) : (
                  <span>PHOTO</span>
                )}
              </div>

              <div className="preview-body">
                <h3>{listingTitle}</h3>

                <strong>
                  {price
                    ? `$${Number(cleanNumber(price)).toLocaleString()}`
                    : "$0"}
                </strong>

                <p>
                  {hours
                    ? `${Number(cleanNumber(hours)).toLocaleString()} Hrs`
                    : "Hours"}
                  {location ? ` • ${location}` : ""}
                </p>
              </div>
            </div>
          </aside>
        </section>

        <style jsx>{`
          * {
            box-sizing: border-box;
          }

          :global(body) {
            margin: 0;
            font-family: Arial, sans-serif;
            background: #0B0B0B;
            color: #D6D6D6;
          }

          .nav {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 14px 5%;
            background: #050505;
            border-bottom: 1px solid rgba(255,255,255,.08);
          }

          .logo-img {
            height: 42px;
            width: auto;
            display: block;
          }

          .nav-links {
            display: flex;
            align-items: center;
            gap: 14px;
          }

          .nav-links a {
            color: white;
            text-decoration: none;
            font-weight: 900;
            text-transform: uppercase;
            font-size: 13px;
            letter-spacing: .6px;
          }

          .page {
            display: grid;
            grid-template-columns: minmax(0, 1fr) 340px;
            gap: 10px;
            max-width: 1600px;
            margin: 0 auto;
            padding: 12px 1.5%;
          }

          .form-panel,
          .preview-panel {
            background: #151515;
            border: 1px solid #282828;
            border-radius: 14px;
            padding: 12px;
          }

          .section-head {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 10px;
            margin-bottom: 14px;
          }

          h1 {
            margin: 0;
            color: #F2F2F2;
            font-size: 24px;
          }

          .section-head p {
            margin: 4px 0 0;
            color: #8A8A8A;
            font-size: 12px;
          }

          .status-pill {
            border: 1px solid #2f855a;
            color: #38A169;
            border-radius: 999px;
            padding: 7px 10px;
            font-size: 10px;
            font-weight: 900;
            display: flex;
            align-items: center;
            gap: 6px;
            white-space: nowrap;
          }

          .status-pill span {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: #38A169;
          }

          .form-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
            margin-bottom: 12px;
          }

          .wide {
            grid-column: 1 / -1;
          }

          label {
            display: grid;
            gap: 6px;
          }

          label span {
            color: #8F8F8F;
            font-size: 10px;
            font-weight: 900;
            letter-spacing: .45px;
            text-transform: uppercase;
          }

          input,
          select,
          textarea {
            width: 100%;
            border: 1px solid #2A2A2A;
            background: #101010;
            color: #F2F2F2;
            border-radius: 10px;
            padding: 12px;
            outline: none;
            font-size: 14px;
          }

          textarea {
            min-height: 130px;
            resize: vertical;
          }

          input:focus,
          select:focus,
          textarea:focus {
            border-color: ${BRAND_YELLOW};
          }

          .photos-panel {
            margin-bottom: 12px;
          }

          .photos-head {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
          }

          .photos-head h2 {
            margin: 0;
            color: #F2F2F2;
            font-size: 13px;
            text-transform: uppercase;
          }

          .photos-head span {
            color: #8A8A8A;
            font-size: 10px;
            font-weight: 900;
          }

          .upload-box {
            border: 1px dashed #3A3A3A;
            background: #101010;
            border-radius: 12px;
            padding: 26px 12px;
            text-align: center;
            cursor: pointer;
          }

          .upload-box input {
            display: none;
}

.upload-box i {
  font-size: 28px;
  color: ${BRAND_YELLOW};
  margin-bottom: 10px;
}

.upload-box strong {
  display: block;
  color: #F2F2F2;
  margin-bottom: 6px;
  font-size: 14px;
}

.upload-box p {
  margin: 0;
  color: #777;
  font-size: 11px;
}

.photo-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 6px;
  margin-top: 10px;
}

.photo-grid img {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid #2A2A2A;
}

.submit-btn {
  width: 100%;
  border: none;
  background: ${BRAND_YELLOW};
  color: #050505;
  font-weight: 900;
  letter-spacing: .45px;
  border-radius: 12px;
  padding: 15px;
  cursor: pointer;
  margin-top: 12px;
}

.preview-card {
  border: 1px solid #282828;
  border-radius: 12px;
  overflow: hidden;
  background: #101010;
}

.preview-image {
  height: 240px;
  background: #0B0B0B;
  display: grid;
  place-items: center;
  color: #666;
}

.preview-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preview-body {
  padding: 12px;
}

.preview-body h3 {
  margin: 0;
  color: #F2F2F2;
  font-size: 16px;
  line-height: 1.25;
}

.preview-body strong {
  display: block;
  margin-top: 8px;
  color: ${BRAND_YELLOW};
  font-size: 20px;
}

.preview-body p {
  margin: 6px 0 0;
  color: #8A8A8A;
  font-size: 12px;
}

@media (max-width: 900px) {
  .page {
    grid-template-columns: 1fr;
  }

  .preview-panel {
    order: -1;
  }
}

@media (max-width: 700px) {
  .form-grid {
    grid-template-columns: 1fr;
  }

  .photo-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .nav {
    padding: 12px 4%;
  }

  .logo-img {
    height: 34px;
  }
}
        `}</style>
      </main>
    </>
  );
}
