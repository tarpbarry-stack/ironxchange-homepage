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

const globalKeywords = [
  "4wd",
  "2wd",
  "6x6",
  "8x8",
  "awd",
  "all wheel drive",
  "differential lock",
  "diff lock",
  "traction control",
  "electronic traction control",
  "hill assist",
  "slope assist",
  "hydrostatic drive",
  "powershift transmission",
  "automatic transmission",
  "manual transmission",
  "planetary final drives",
  "final drives",
  "wet disc brakes",
  "hydraulic brakes",
  "parking brake",
  "service brakes",
  "retarder",
  "engine retarder",
  "hydraulic retarder",
  "air brakes",
  "air ride suspension",
  "spring suspension",
  "torsion suspension",
  "walking beam suspension",
  "oscillating axle",
  "suspension seat",
  "air ride seat",
  "heated seat",
  "cold ac",
  "cold a/c",
  "heat",
  "heated mirrors",
  "power mirrors",
  "backup camera",
  "camera system",
  "360 camera",
  "rear camera",
  "led lights",
  "work lights",
  "beacon",
  "strobe",
  "touchscreen display",
  "lcd display",
  "digital display",
  "joystick controls",
  "pilot controls",
  "electro hydraulic controls",
  "hydraulic controls",
  "electronic controls",
  "load sensing hydraulics",
  "closed center hydraulics",
  "open center hydraulics",
  "high flow hydraulics",
  "aux hydraulics",
  "hydraulic remotes",
  "hydraulic manifold",
  "valve bank",
  "pressure compensation",
  "hydraulic accumulators",
  "pressure test ports",
  "hydraulic test ports",
  "hydraulic quick couplers",
  "flat face couplers",
  "case drain",
  "hydraulic reservoir",
  "hydraulic cooler",
  "hydraulic fan",
  "reversing fan",
  "high ambient cooling",
  "cold weather package",
  "arctic package",
  "dust package",
  "eco mode",
  "auto idle",
  "idle shutdown",
  "tier 3",
  "tier 4",
  "tier 4 final",
  "de-tier",
  "detier",
  "no def",
  "egr delete",
  "telematics",
  "gps",
  "machine tracking",
  "geo fence",
  "remote diagnostics",
  "wireless monitoring",
  "wireless updates",
  "software updates",
  "remote support",
  "machine diagnostics",
  "diagnostic port",
  "canbus system",
  "ecm",
  "electronic control module",
  "operator display",
  "machine display",
  "digital gauges",
  "fuel monitor",
  "hydraulic temp monitor",
  "coolant monitor",
  "battery monitor",
  "service monitor",
  "fault monitor",
  "hydraulic pressure monitor",
  "payload system",
  "payload scales",
  "weigh system",
  "load cells",
  "payload monitor",
  "operator profiles",
  "worksite presets",
  "hydraulic presets",
  "travel presets",
  "attachment presets",
  "machine sync",
  "fleet sync",
  "cloud sync",
  "wireless transfer",
  "data logging",
  "travel logging",
  "idle logging",
  "payload logging",
  "fuel logging",
  "camera package",
  "lighting package",
  "hydraulic package",
  "electronic package",
  "safety package",
  "operator comfort package",
  "transport package",
  "utility package",
  "construction package",
  "municipal package",
  "pipeline package",
  "oilfield package",
  "aggregate package",
  "forestry package",
  "demolition package",
  "cold weather package",
  "high ambient package",
  "high visibility package",
  "night work package",
  "service access",
  "ground level service",
  "service platform",
  "catwalk",
  "walkway",
  "safety rails",
  "fall protection",
  "anchor points",
  "toolbox",
  "storage compartments",
  "lifting eyes",
  "tie down points",
  "recovery points",
  "tow hooks",
  "battery disconnect",
  "main disconnect",
  "emergency stop",
  "e-stop",
  "fire suppression",
  "operator presence system",
  "seat switch",
  "backup alarm",
  "travel alarm",
  "motion alarm",
  "horn",
  "air horn",
  "rubber tracks",
  "steel tracks",
  "track rollers",
  "carrier rollers",
  "track chains",
  "track pads",
  "track tension",
  "idler wheels",
  "sprockets",
  "crawler undercarriage",
  "low ground pressure",
  "lgp",
  "radial tires",
  "bias ply tires",
  "foam filled tires",
  "traction tires",
  "solid tires",
  "non marking tires",
  "planetary hubs",
  "drive axles",
  "hydraulic steering",
  "electronic steering",
  "travel speed",
  "transport mode",
  "work mode",
  "precision mode",
  "power mode",
  "economy mode",
  "creep mode",
  "automatic braking",
  "hydraulic shutoff",
  "travel shutoff",
  "attachment shutoff",
  "hydraulic damping",
  "ride dampening",
  "vibration isolation",
  "shock mounts",
  "rubber isolation mounts",
  "high pressure fuel system",
  "fuel water separator",
  "electric priming pump",
  "dual batteries",
  "high output alternator",
  "starter disconnect",
  "block heater",
  "fuel heater",
  "heated hydraulic tank",
  "air intake precleaner",
  "cyclonic precleaner",
  "dust ejector",
  "high torque drive",
  "travel reduction",
  "electronic throttle",
  "hand throttle",
  "automatic traction management",
  "electronic stability control",
  "dynamic stability",
  "traction assist",
  "suspension package",
  "cooling package",
  "high capacity cooling",
  "dual radiators",
  "electric fan",
  "boom lock",
  "transport lock",
  "hydraulic lockout",
  "electronic flow control",
  "flow priority",
  "hydraulic priority",
  "automatic calibration",
  "hydraulic calibration",
  "electronic sequencing",
  "hydraulic sequencing",
  "electronic load control",
  "automatic load balancing",
  "travel mode",
  "lift mode",
  "haul mode",
  "dump mode",
  "grading mode",
  "breaker mode",
  "attachment mode",
  "precision controls",
  "fingertip controls",
  "multi function joystick",
  "high flow package",
  "guidance package",
  "operator safety package",
  "electronic monitoring",
  "service timer",
  "hour meter",
  "operating weight",
  "transport width",
  "transport height",
  "transport length",
  "machine width",
  "machine height",
  "machine length",
  "lift capacity",
  "bucket capacity",
  "hydraulic horsepower",
  "auxiliary flow",
  "auxiliary pressure",
  "pressure sensors",
  "tilt sensors",
  "inclination sensors",
  "flow sensors",
  "temperature sensors",
  "load sensors",
  "boom sensors",
  "travel sensors",
  "smartgrade",
"smart grade",
"topcon",
"trimble",
"grade control",
"2d grade control",
"3d grade control",
"machine control",
"machine guidance",
"gps guidance",
"laser control",
"laser receiver",
"laser mast",
"rtk ready",
"receiver ready",
"slope control",
"cross slope",
"automatic grade control",
"automatic blade control",
"automatic steering",
"autosteer",
"auto steer",
"payload system",
"payload scales",
"weigh system",
"load cells",
"machine monitoring",
"remote diagnostics",
"wireless monitoring",
"telematics",
"gps",
"mapping",
"coverage mapping",
"cut fill mapping",
"data logging",
"machine sync",
"fleet sync",
"cloud sync",
"wireless transfer",
"operator presets",
"worksite presets",
"hydraulic presets",
"travel presets",
"attachment presets"
];

const aerialEquipmentKeywords = [
  "boom lift",
  "straight boom",
  "telescopic boom",
  "articulating boom",
  "knuckle boom",
  "man lift",
  "scissor lift",
  "vertical mast lift",
  "personnel lift",
  "mast boom",
  "tracked boom",
  "crawler boom",
  "towable boom",
  "trailer mounted boom",
  "truck mounted boom",
  "bucket truck",
  "insulated boom",
  "material lift",
  "telehandler",
  "warehouse forklift",
  "rough terrain forklift",
  "industrial forklift",
  "electric forklift",
  "diesel forklift",
  "lp forklift",
  "pneumatic tires",
  "cushion tires",
  "solid tires",
  "foam filled tires",
  "rough terrain",
  "rt",
  "4wd",
  "all wheel drive",
  "oscillating axle",
  "electric drive",
  "battery powered",
  "diesel powered",
  "dual fuel",
  "lp gas",
  "propane",
  "lpg",
  "tier 3",
  "tier 4",
  "tier 4 final",
  "de-tier",
  "detier",
  "no def",
  "jib",
  "swing jib",
  "rotating jib",
  "platform rotate",
  "basket rotate",
  "self leveling platform",
  "self leveling",
  "hydraulic outriggers",
  "outriggers",
  "frame leveling",
  "tilt alarm",
  "tilt sensor",
  "load sense",
  "overload alarm",
  "motion alarm",
  "drive alarm",
  "backup alarm",
  "backup camera",
  "camera system",
  "360 camera",
  "led lights",
  "work lights",
  "beacon",
  "strobe",
  "non marking tires",
  "traction tires",
  "mud tires",
  "rubber tracks",
  "steel tracks",
  "track drive",
  "crawler undercarriage",
  "tracked chassis",
  "narrow chassis",
  "compact chassis",
  "zero tail swing",
  "tight turning radius",
  "indoor rated",
  "outdoor rated",
  "warehouse ready",
  "construction ready",
  "operator ready",
  "jobsite ready",
  "cold ac",
  "cold a/c",
  "heat",
  "heated cab",
  "air ride seat",
  "suspension seat",
  "enclosed cab",
  "open cab",
  "rops",
  "fops",
  "platform extension",
  "slide out deck",
  "dual entry gate",
  "swing gate",
  "folding rails",
  "tool tray",
  "welder ready",
  "generator ready",
  "110v outlet",
  "220v outlet",
  "aux power",
  "hydraulic generator",
  "air line to platform",
  "welding leads",
  "platform controls",
  "ground controls",
  "remote controls",
  "wireless remote",
  "self propelled",
  "towable",
  "trailer mounted",
  "van mounted",
  "material handler",
  "winch package",
  "hook package",
  "glass handling",
  "vacuum lift",
  "panel handling",
  "pipe handling",
  "fork positioner",
  "side shift",
  "sideshift",
  "fork tilt",
  "mast tilt",
  "triple mast",
  "quad mast",
  "container mast",
  "high reach",
  "extended reach",
  "high capacity",
  "5000 lb",
  "6000 lb",
  "8000 lb",
  "10000 lb",
  "12000 lb",
  "15000 lb",
  "20000 lb",
  "30000 lb",
  "500 lb basket",
  "750 lb basket",
  "1000 lb basket",
  "dual capacity",
  "platform height",
  "working height",
  "40ft platform",
  "60ft platform",
  "80ft platform",
  "100ft platform",
  "120ft platform",
  "135ft platform",
  "150ft platform",
  "170ft platform",
  "185ft platform",
  "battery charger",
  "smart charger",
  "maintenance free batteries",
  "agm batteries",
  "lithium batteries",
  "hydraulic cooling",
  "high ambient cooling",
  "cold weather package",
  "arctic package",
  "desert package",
  "all weather package",
  "telematics",
  "remote diagnostics",
  "wireless monitoring",
  "gps tracking",
  "machine tracking",
  "geo fence",
  "anti theft",
  "keyless start",
  "operator login",
  "fleet ready",
  "rental fleet",
  "warehouse use",
  "industrial use",
  "commercial use",
  "construction use",
  "steel erection",
  "glazing",
  "mechanical contractor",
  "electrical contractor",
  "hvac contractor",
  "painting contractor",
  "bridge work",
  "stadium work",
  "airport work",
  "refinery work",
  "shutdown work",
  "facility maintenance",
  "plant maintenance",
  "distribution center",
  "shipyard",
  "rail yard",
  "cold storage",
  "food grade facility",
  "service records",
  "maintenance records",
  "fleet maintained",
  "dealer maintained",
  "municipal owned",
  "government owned",
  "contractor owned",
  "one owner",
  "owner operator",
  "fresh service",
  "maintenance current",
  "pm current",
  "field serviced",
  "new batteries",
  "new charger",
  "new tires",
  "new hoses",
  "new hydraulic pump",
  "new drive motors",
  "new controller",
  "new joystick",
  "new platform controls",
  "new ground controls",
  "new seat",
  "new decals",
  "new paint",
  "good glass",
  "hydraulic brakes",
  "parking brake",
  "wet disc brakes",
  "touchscreen display",
  "lcd display",
  "digital diagnostics",
  "auto idle",
  "eco mode",
  "idle shutdown",
  "foam tires",
  "solid rubber tires",
  "platform capacity",
  "lift capacity",
  "outreach",
  "up and over height",
  "platform outreach",
  "side reach",
  "up and over reach",
  "swing turntable",
  "continuous rotation",
  "non continuous rotation",
  "platform swing",
  "platform tilt",
  "hydraulic rotation",
  "swing out engine tray",
  "ground level service",
  "service access",
  "hydraulic manifold",
  "hydraulic valve bank",
  "traction drive",
  "dual drive",
  "hydraulic drive",
  "electric steering",
  "proportional controls",
  "dual joystick",
  "single joystick",
  "canbus controls",
  "load sensing hydraulics",
  "traction control",
  "active oscillation",
  "foam filled",
  "rail wheels",
  "rail gear",
  "track mounted",
  "compact footprint",
  "narrow width",
  "low profile",
  "transport locks",
  "tie down points",
  "lifting eyes",
  "safety rails",
  "fall protection",
  "anchor points",
  "harness points",
  "osha compliant",
  "ansi compliant",
  "catwalk",
  "walk through platform",
  "swing gate",
  "mesh floor",
  "steel deck",
  "aluminum deck",
  "operator presence system",
  "descent alarm",
  "tilt cutout",
  "boom interlock",
  "platform overload",
  "hydraulic leveling",
  "automatic leveling",
  "ground leveling",
  "stabilizer leveling",
  "independent outriggers",
  "axle lock",
  "traction lock",
  "differential lock",
  "travel alarm",
  "platform horn",
  "motion cutout",
  "drive cutout",
  "transport mode",
  "elevation mode",
  "boom mode",
  "service mode",
  "diagnostic mode",
  "transport width",
  "stowed height",
  "stowed length",
  "transport length",
  "machine width",
  "machine height",
  "machine weight",
  "operating weight",
  "ground pressure",
  "slope rating",
  "gradeability",
  "travel speed",
  "lift speed",
  "lower speed",
  "extension speed",
  "retraction speed",
  "rotation speed",
  "battery indicator",
  "hour meter",
  "platform meter",
  "machine diagnostics",
  "hydraulic reservoir",
  "hydraulic cooler",
  "swing bearing",
  "slew ring",
  "wear pads",
  "boom wear pads",
  "mast rollers",
  "chain drive",
  "roller mast",
  "mast bearings",
  "load wheels",
  "drive wheels",
  "caster wheels",
  "poly tires",
  "traction battery",
  "deep cycle battery",
  "industrial battery",
  "charger cable",
  "battery disconnect",
  "main disconnect",
  "emergency stop",
  "e-stop",
  "operator manual",
  "parts manual",
  "service manual"
];

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

  <a href="/saved" className="login-icon" aria-label="Saved Listings">
    <i className="fa-regular fa-star"></i>
  </a>

  <a
    href="/account"
    className="login-icon logged-in"
    aria-label="Account"
  >
    <i className="fa-regular fa-user"></i>
  </a>
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
