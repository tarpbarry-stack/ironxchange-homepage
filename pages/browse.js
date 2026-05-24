import ListingCard from "../components/ListingCard";
import { getListingId } from "../lib/listingFormatters";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import Head from "next/head";
import { useMemo, useState, useEffect } from "react";
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
import featureKeywords from "../lib/featureKeywords";

const BRAND_YELLOW = "#FFC400";

const categories = [
  "ALL CATEGORIES",
  "AERIAL EQUIPMENT",
  "AGGREGATE",
  "AGRICULTURE HARVESTERS",
  "AGRICULTURE TRACTORS",
  "ASPHALT EQUIPMENT",
  "BACKHOE LOADERS",
  "COMPACTION/ROLLERS",
  "CRANES",
  "CRAWLER CARRIERS / LOADER",
  "DOZERS",
  "DRILLS & PILING",
  "DUMP TRUCKS - ARTIC/RIGID",
  "EXCAVATORS",
  "FORKLIFTS",
  "MOTOR GRADERS",
  "SCRAPER",
  "SKID STEER/CTL",
  "TELEHANDLERS",
  "TRENCHERS/PLOWS",
  "TRAILERS",
  "TRUCKS",
  "WHEEL LOADERS",
  "ATTACHMENTS / PARTS",
  "OTHER SPECIALTY",
  "SUPPORT EQUIPMENT",
  "UTILITY CARTS"
];

function formatKeywordLabel(keyword = "") {
  return String(keyword)
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, char => char.toUpperCase());
}

function getListingKeywords(item = {}) {
  const raw =
    item?.keywords ||
    item?.tags ||
    item?.publicData?.keywords ||
    item?.attributes?.publicData?.keywords ||
    [];

  if (Array.isArray(raw)) {
    return raw
      .filter(Boolean)
      .map(formatKeywordLabel);
  }

  if (typeof raw === "string") {
    return raw
      .split(",")
      .map(formatKeywordLabel)
      .filter(Boolean);
  }

  return [];
}

function inferFeatureLine(item = {}) {
  const text = [
    item.title,
    item.description,
    item.publicData?.description,
    item.publicData?.details
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return featureKeywords
    .filter(feature => feature.match.some(term => text.includes(term)))
    .map(feature => feature.label);
}

function getFeatureLine(item = {}) {
  const selectedKeywords = getListingKeywords(item);

  const features =
    selectedKeywords.length > 0
      ? selectedKeywords
      : inferFeatureLine(item);

  return [...new Set(features)].slice(0, 4).join(" • ");
}

function cleanMachineTitle(title = "") {
  return String(title)
    .replace(/\s*[-–]?\s*\d{1,5}(,\d{3})*\s*(HRS|Hrs|hrs|Hours|hours)\b/g, "")
    .replace(/\s*[-–]\s*$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function toNumber(value) {
  const raw = String(value || "").replace(/[^0-9]/g, "");
  return raw ? Number(raw) : null;
}

function formatHours(value) {
  const num = toNumber(value);

  return num
    ? `${num.toLocaleString()} hrs`
    : "";
}

function matchesRange(value, min, max) {
  const num = toNumber(value);
  const low = toNumber(min);
  const high = toNumber(max);

  if (low !== null && (num === null || num < low)) return false;
  if (high !== null && (num === null || num > high)) return false;

  return true;
}

function getListingYear(item = {}) {
  return toNumber(
    item.year ||
    item.quickFacts?.year ||
    item.facts?.year ||
    item.publicData?.year ||
    item.attributes?.publicData?.year
  );
}

function sortListings(listings, sortMode) {
  const sorted = [...listings];

  sorted.sort((a, b) => {
  if (sortMode === "price-low") return (toNumber(a.price) || 0) - (toNumber(b.price) || 0);
  if (sortMode === "price-high") return (toNumber(b.price) || 0) - (toNumber(a.price) || 0);
  if (sortMode === "hours-low") return (toNumber(a.hours) || 0) - (toNumber(b.hours) || 0);
  if (sortMode === "hours-high") return (toNumber(b.hours) || 0) - (toNumber(a.hours) || 0);

  if (sortMode === "newest") return (getListingYear(b) || 0) - (getListingYear(a) || 0);
  if (sortMode === "year-new") return (getListingYear(b) || 0) - (getListingYear(a) || 0);
  if (sortMode === "year-old") return (getListingYear(a) || 0) - (getListingYear(b) || 0);

  return 0;
});

  return sorted;
}

export default function Browse() {
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("ALL CATEGORIES");
  const [make, setMake] = useState("ALL MAKES");
  const [model, setModel] = useState("ALL MODELS");
  const [liveListings, setLiveListings] = useState([]);
  const [loggedIn, setLoggedIn] = useState(false);
  const [sdk, setSdk] = useState(null);
  const [savedIds, setSavedIds] = useState([]);
  const [sortMode, setSortMode] = useState("newest");

const [filters, setFilters] = useState({
  yearMin: "",
  yearMax: "",
  priceMin: "",
  priceMax: "",
  hoursMin: "",
  hoursMax: ""
});

  useEffect(() => {
    fetch("/api/listings")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setLiveListings(data);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
  async function checkAuth() {
    try {
      const SharetribeSdk = await import("sharetribe-flex-sdk");

      const sdkInstance = SharetribeSdk.createInstance({
  clientId: process.env.NEXT_PUBLIC_SHARETRIBE_CLIENT_ID
});

setSdk(sdkInstance);

const currentUser = await sdkInstance.currentUser.show();

const profile =
  currentUser?.data?.data?.attributes?.profile || {};

const saved =
  profile?.privateData?.savedListings || [];

setSavedIds(
  Array.isArray(saved)
    ? saved.map(String)
    : []
);

setLoggedIn(true);
    } catch {
      setLoggedIn(false);
    }
  }

  checkAuth();
}, []);
  
const availableMakes = useMemo(() => {
  const preferredMakes = {
    "MOTOR GRADERS": [
      "CATERPILLAR",
      "DEERE",
      "XCMG",
      "VOLVO",
      "CHAMPION",
      "KOMATSU",
      "UHI",
      "SANY",
      "LEEBOY",
      "SEM",
      "CASE",
      "NEW HOLLAND",
      "NORAM",
      "GALION"
    ],

    "WHEEL LOADERS": [
  "CATERPILLAR",
  "DEERE",
  "VOLVO",
  "KOMATSU",
  "CASE",
  "HYUNDAI",
  "JCB",
  "HITACHI",
  "XCMG",
  "LIEBHERR",
  "BOBCAT",
  "DEVELON",
  "DOOSAN",
  "GEHL",
  "GIANT",
  "KAWASAKI",
  "KUBOTA",
  "MANITOU",
  "NEW HOLLAND",
  "YANMAR",
  "LIUGONG",
  "SANY",
  "SEM"
]
    ,

"DOZERS": [
  "CATERPILLAR",
  "DEERE",
  "KOMATSU",
  "CASE",
  "SHANTUI",
  "LIEBHERR",
  "DEVELON",
  "DRESSTA",
  "HYUNDAI",
  "DOOSAN",
  "DRESSER",
  "FIATALLIS",
  "INTERNATIONAL",
  "MITSUBISHI",
  "NEW HOLLAND",
  "SEM",
  "XCMG",
  "ALLIS CHALMERS"
]
    ,

"EXCAVATORS": [
  "CATERPILLAR",
  "DEERE",
  "KOMATSU",
  "HITACHI",
  "KUBOTA",
  "HYUNDAI",
  "SANY",
  "VOLVO",
  "BOBCAT",
  "YANMAR",
  "TAKEUCHI",
  "XCMG",
  "NEW HOLLAND",
  "LINK-BELT",
  "LIEBHERR",
  "CASE",
  "DEVELON",
  "DOOSAN"
]
    ,

"AERIAL EQUIPMENT": [
  "GENIE",
  "JLG",
  "SKYJACK",
  "HAULOTTE",
  "SNORKEL",
  "NIFTYLIFT",
  "TEREX",
  "LGMG",

  "JCB",
  "MANITOU",
  "SKYTRAK",
  "MAGNI",
  "MERLO",
  "DIECI",

  "TOYOTA",
  "HYSTER",
  "YALE",
  "CLARK",
  "CROWN",
  "HELI",
  "HANGCHA",
  "DOOSAN",
  "HYUNDAI",
  "KOMATSU",
  "MITSUBISHI",
  "NISSAN",
  "UNI-CARRIERS",
  "VIPER",
  "RAYMOND",
  "HOIST",
  "TAYLOR",
  "CATERPILLAR",
  "MOFFETT",
  "SANY"
]
  ,

"AGGREGATE": [
  "POWERSCREEN",
  "MCCLOSKEY",
  "METSO",
  "KINGLINK",
  "KLEEMAN",
  "SANDVIK",
  "ASTEC",
  "SUPERIOR",
  "CEDAR RAPIDS",
  "TEREX FINLAY",
  "ANACONDA",
  "BARFORD",
  "CUSTOM BILT",
  "EAGLE CRUSHER",
  "EARTHWORM CONVEYORS",
  "EAGLE IRON WORKS",
  "EDGE",
  "EVOQUIP",
  "EXCEL",
  "EXTEC",
  "FAE",
  "FINLAY",
  "IROCK",
  "IRON CITY SUPPLY",
  "JCI",
  "JP CONVEYORS",
  "KAFKA",
  "KEESTRA",
  "KOMPLET",
  "KPI-JCI",
  "LIPPMAN",
  "MASABA",
  "MDS",
  "NORDBERG",
  "PIONEER",
  "ROCK SYSTEMS",
  "RUBBLE MASTER",
  "SCREEN MACHINE",
  "SCREENPOD",
  "SIMPLICITY",
  "TCI",
  "TEREX FINLAY"
]
  ,
    
    "AGRICULTURE HARVESTERS": [
  "JOHN DEERE",
  "CASE IH",
  "MAC DON",
  "NEW HOLLAND",
  "CLAAS",
  "GLEANER",
  "GERINGHOFF",
  "MASSEY FERGUESON",
  "SHELBOURNE REYNOLDS",
  "DRAGO",
  "AGCO",
  "ALLIS CHALMERS",
  "CAPELLO",
  "CHALLENGER",
  "DION",
  "FENDT",
  "GEHL",
  "HARVESTEC",
  "HESSTON",
  "HONEY BEE",
  "HORNING",
  "INTERNATIONAL",
  "JI CASE",
  "KEMPER",
  "KRONE",
  "LAVERDA",
  "LEXION",
  "LILLISTON",
  "MAYA AMERICA",
  "NARDI",
  "NEW IDEA",
  "OTHER"
]
    ,
    "AGRICULTURE TRACTORS 300HP +": [
  "JOHN DEERE",
  "CASI IH",
  "NEW HOLLAND",
  "FENDT",
  "VERSATILE",
  "CHALLENGER",
  "CLAAS",
  "MASSEY FERGUESON",
  "JCB",
  "VALTRA",
  "OTHER"
],

"AGRICULTURE TRACTORS 175 - 299 HP": [
  "JOHN DEERE",
  "CASE IH",
  "FENDT",
  "NEW HOLLAND",
  "MASSEY FERGUESON",
  "CLAAS",
  "JCB",
  "VALTRA",
  "VERSATILE",
  "DUETZ FAHR",
  "AGCO",
  "CATRELPILLAR",
  "CHALLENGER",
  "FORD",
  "INTERNATIONAL",
  "MCCORMICK",
  "STEIGER",
  "OTHER"
],

"AGRICULTURE TRACTORS 100 - 174 HP": [
  "JOHN DEERE",
  "CASE IH",
  "NEW HOLLAND",
  "MASSEY FERGUESON",
  "KUBOTA",
  "INTERNATIONAL",
  "FENDT",
  "DUETZ FAHR",
  "CLAAS",
  "MCCORMICK",
  "ALLIS CHALMERS",
  "CHALLENGER",
  "FORD",
  "J I CASE",
  "JCB",
  "KIOTI",
  "MAHINDRA",
  "VALTRA",
  "WHITE",
  "ZETOR",
  "OTHER"
],

"AGRICULTURE TRACTORS 40 - 99 HP": [
  "JOHN DEERE",
  "NEW HOLLAND",
  "KUBOTA",
  "MASSEY FERGUESON",
  "CASE IH",
  "FORD",
  "INTERNATIONAL",
  "KIOTI",
  "MAHINDRA",
  "TYM",
  "ALLIS CHALMERS",
  "BAD BOY",
  "BOBCAT",
  "BRANSON",
  "CLAAS",
  "DUETZ FAHR",
  "FENDT",
  "J I CASE",
  "LANDINI",
  "MCCORMICK",
  "OLIVER",
  "SOLIS",
  "UHI",
  "WHITE",
  "YANMAR",
  "ZETOR",
  "OTHER"
],

"AGRICULTURE TRACTORS LESS THAN 40 HP": [
  "JOHN DEERE",
  "KUBOTA",
  "MASSEY FERGUESON",
  "NEW HOLLAND",
  "KIOTI",
  "MAHINDRA",
  "BOBCAT",
  "INTERNATIONAL",
  "YANMAR",
  "LS",
  "ALLIS-CHALMERS",
  "BAD BOY",
  "CASE IH",
  "FORD",
  "JI CASE",
  "MCCORMICK",
  "OLIVER",
  "SOLIS",
  "STEINER",
  "TYM",
  "VENTRAC"
]
    ,
    
"ASPHALT EQUIPMENT": [
  "VOGELE",
  "WIRTGEN",
  "LEEBOY",
  "CATERPILLAR",
  "HUSQVARNA",
  "MULTIQUIP-WHITEMAN",
  "TORO",
  "BOMAG",
  "ROADTEC",
  "CHIKUSUIU CANYCOM",
  "ABG",
  "AESCO MADSEN",
  "ALLEN ENG",
  "AMAG",
  "AMMANN",
  "ASPHALT ZIPPER",
  "ASTEC",
  "BARBER GREENE",
  "BARTELL",
  "BERGKAMP",
  "BETONBLOCK",
  "BITELLI",
  "BLAWKNOX",
  "CARLSON",
  "CEDAR RAPIDS",
  "CIMLINE",
  "CMI",
  "CRAFCO",
  "DIAMOND",
  "DYNAPAC",
  "EDCO",
  "ETNYRE",
  "FALCON",
  "GOMACO",
  "IMER",
  "INDY",
  "KIMERA",
  "KM INTERNATIONAL",
  "MARATHON",
  "MAULDIN",
  "METALIKA",
  "MIDLAND",
  "MULTIQUIP-WHITEMAN",
  "NORMET",
  "POWER CURBERS",
  "PUTZMIESTER",
  "SAMI",
  "SCHWING",
  "STRUEMASTER",
  "VOLVO",
  "WACKER NUESON",
  "WEILER",
  "XCMG",
  "ZOOMLION"
]
    ,

    "BACKHOE LOADERS": [
  "DEERE",
  "CATERPILLAR",
  "CASE",
  "JCB",
  "KOMATSU",
  "NEW HOLLAND",
  "FORD",
  "TEREX",
  "DELCO",
  "BOBCAT",
  "XCMG"
],

    "COMPACTION/ROLLERS": [
  "CATERPILLAR",
  "HAMM",
  "BOMAG",
  "DYNAPAC",
  "WACKER NUESON",
  "VOLVO",
  "SAKAI",
  "AMMANN",
  "XCMG",
  "HUSQVARNA",
  "SANY"
],
"CRANES": [
  "ALTEC",
  "TEREX",
  "GROVE",
  "XCMG",
  "LIEBHERR",
  "TADANO",
  "LINK-BELT",
  "VERSALIFT",
  "MANITEX",
  "NATIONAL",
  "AMERICAN",
  "AUTO CRANE",
  "BIK",
  "BRODERSON",
  "CORMACH",
  "DALL'AGLIO NEWCRANES",
  "DEMAG",
  "DUR-A-LIFT",
  "ELLIOT",
  "ETI",
  "FASSI",
  "HIAB",
  "HITACHI",
  "HORYONG",
  "IMT",
  "JEKKO",
  "KATO",
  "KOBELCO",
  "MANITOWOC",
  "NORTHWEST",
  "PALFINGER",
  "PM",
  "POTAIN",
  "SANY",
  "STELLAR"
]
    ,
    "CRAWLER CARRIERS / LOADER": [
  "PRINOTH",
  "MOROOKA",
  "TERRAMAC",
  "YANMAR",
  "IHI",
  "ALMACRAWLER",
  "KATO",
  "BELL",
  "BERGMAN",
  "SUPERIOR",
  "ALLIS CHALMERS",
  "CASE",
  "CATERPILLAR",
  "DEERE",
  "DRESSER",
  "FIATALLIS",
  "INTERNATIONAL",
  "KOMATSU",
  "LIEBHERR",
  "LIUGONG",
  "MOVEX",
  "OLIVER"
]
    ,

    "DRILLS & PILING": [
  "VERMEER",
  "DITCH WITCH",
  "ATLAS COPCO",
  "SANDVIK",
  "INGERSOL RAND",
  "XCMG",
  "EPIROC",
  "SOILMEC",
  "TAMROCK",
  "FURUKAWA",
  "AMERICAN AUGERS",
  "BAUER",
  "BAY SHORE",
  "CASAGRANDE",
  "CATERPILLAR",
  "COMACCHIO",
  "DRILTECH",
  "HUTTE BOHRTECHNIK",
  "KLEMM",
  "LIEBHERR",
  "MAIT",
  "PATRIOT",
  "REEDRILL",
  "SCHRAMM",
  "TESCAR",
  "TEXOMA",
  "WATSON"
]
    ,
    
"DUMP TRUCKS - ARTIC/RIGID": [
  "CATERPILLAR",
  "VOLVO",
  "BELL",
  "KOMATSU",
  "DEERE",
  "TEREX",
  "HYDREMA",
  "ROKBAK",
  "HOLMES",
  "HYUNDAI",
  "DEVELON",
  "DOOSAN",
  "EUCLID",
  "HITACHI",
  "LIEBHERR",
  "MOXY",
  "PERLINI",
  "SANDVIK",
  "XCMG"
]
    ,
    
    "FORKLIFTS": [
  "TOYOTA",
  "HYSTER",
  "YALE",
  "CATERPILLAR",
  "RAYMOND",
  "LINDE",
  "CLARK",
  "DOOSAN",
  "HANGCHA",
  "MITSUBISHI",
  "AISLE MASTER",
  "AUSA",
  "BAOLI",
  "BENDI",
  "BIG JOE",
  "BTLIFTS",
  "BYD",
  "CASE",
  "CASTLE EQUIPMENT",
  "CHL",
  "COMBILIFT",
  "CROWN",
  "DAEWOO",
  "DREXEL",
  "EKKO",
  "EUROTRAC",
  "FLEXI",
  "GENIE",
  "HARLO",
  "HOIST",
  "JCB",
  "HYUNDAI",
  "JUNGERICH",
  "KALMAR",
  "KOMATSU",
  "LIFT HERO",
  "LIUGONG",
  "LOAD LIFTER",
  "MANITOU",
  "MITSUBISHI",
  "MOFFETT",
  "NAVIGATOR",
  "NEW HOLLAND",
  "NISSAN",
  "NOBLELIFT",
  "OCTANE",
  "PALFINGER",
  "PETTIBONE",
  "PRINCETON",
  "SELLICK",
  "STILL",
  "TAILIFT",
  "TAYLOR",
  "TCM",
  "UHI",
  "UNICARRIERS",
  "VERSA-LIFT",
  "VIPER",
  "XCMG"
]
    ,
    "SCRAPER": [
  "CATERPILLAR",
  "K-TEC",
  "ASHLAND",
  "DEERE",
  "REYNOLDS",
  "ROME",
  "ORTHMAN",
  "MOBILE TRACK SOLUTIONS",
  "ROWSE",
  "TOREQ",
  "BIG DOG",
  "DURABILT",
  "EVERSMAN",
  "GARFIELD",
  "HOLCOMB",
  "HUMDINGER",
  "ICON",
  "LANDOLL ICON",
  "NOBLE",
  "TEREX"
]
    , 
"SKID STEER/CTL": [
  "BOBCAT",
  "DEERE",
  "CATERPILLAR",
  "NEW HOLLAND",
  "KUBOTA",
  "CASE",
  "GEHL",
  "TAKEUCHI",
  "JCB",
  "TORO",
  "WACKER NEUSON",
  "ASV",
  "DITCH WITCH",
  "VERMEER",
  "YANMAR",
  "XCMG",
  "HYUNDAI",
  "KIOTI",
  "MANITOU",
  "UHI"
]
    ,
    "TELEHANDLER": [
  "JCB",
  "SKY TRAK",
  "JLG",
  "GENIE",
  "MANITOU",
  "GEHL",
  "CATERPILLAR",
  "SKYJACK",
  "MERLO",
  "MAGNI",
  "BOBCAT",
  "DIECI",
  "CLAAS",
  "KRAMER",
  "LOAD LIFTER",
  "LULL",
  "NEW HOLLAND",
  "PETTIBONE",
  "SANY"
]
    ,

    "TRENCHERS/PLOWS": [
  "DITCH WITCH",
  "VERMEER",
  "TORO",
  "TESMEC",
  "BARRETO",
  "KUNDEL",
  "CASE",
  "BRON",
  "CLEVELAND",
  "SHERMAN REILLY",
  "BARBER GREENE",
  "CAPITOL",
  "TRENCOR",
  "TRENCOR JETCO",
  "TSE",
  "WOLFE"
]
    ,

    "TRAILERS": [
  "ASPHALT TRAILERS",
  "BEVERAGE TRAILERS",
  "BLADE / TOWER TRAILERS",
  "BOTTOM DUMP TRAILERS",
  "CAR CARRIER TRAILERS",
  "CHEMICAL / ACID TANK TRAILERS",
  "CHIP TRAILERS",
  "CRUDE OIL TANK TRAILERS",
  "CURTAIN SIDE TRAILERS",
  "DOUBLE DROP TRAILERS",
  "DROP DECK TRAILERS",
  "END DUMP TRAILERS",
  "FLATBED TRAILERS",
  "FRAC TANK TRAILERS",
  "FUEL / LUBE TRAILERS",
  "FUEL TANK TRAILERS",
  "HOPPER TRAILERS",
  "HORSE TRAILERS",
  "INDUSTRIAL GAS TANK TRAILERS",
  "LIQUID FOOD GRADE TANK TRAILERS",
  "LIVE BOTTOM TRAILERS",
  "LIVESTOCK TRAILERS",
  "LOG TRAILERS",
  "LOWBOY TRAILERS",
  "NON CODE TANK TRAILERS",
  "PNUEMATIC BULK TANK TRAILERS",
  "POLE TRAILERS",
  "PUP TRAILERS",
  "REEL TRAILERS",
  "REFRIGERATED TRAILERS",
  "ROLL OFF TRAILERS",
  "SANITARY TANK TRAILERS",
  "SIDE DUMP TRAILERS",
  "TAG TRAILERS",
  "TANKER TRAILERS",
  "UTILITY TRAILERS",
    "VACUUM TANK TRAILERS",
"VACUUM EXCAVATOR TRAILERS",
  "VAN TRAILERS",
  "WASTE / SLUDGE TANK TRAILERS",
  "WATER TANK TRAILERS",
  "OTHER TRAILERS"
]
    ,
"TRUCKS": [
  "AMBULANCE",
  "ATTENUATOR TRUCKS",
  "BEVERAGE TRUCKS",
  "BOOM TRUCK CRANES",
  "BOX TRUCKS",
  "BUCKET TRUCKS",
  "CAB & CHASSIS TRUCKS",
  "CAR HAULER TRUCKS",
  "CHIPPER TRUCKS",
  "CURTAIN SIDE TRUCKS",
  "DAY CAB TRUCKS",
  "DIGGER DERRICKS",
  "DUMP - TRANSFER TRUCKS",
  "DUMP TRUCKS",
  "EXPEDITOR TRUCKS",
  "FARM TRUCKS / GRAIN TRUCKS",
  "FIRE TRUCKS",
  "FLATBED TRUCKS",
  "FLATBED-DUMP TRUCKS",
  "FORESTRY BUCKET TRUCKS",
  "FUEL & LUBE TRUCKS",
  "GARBAGE TRUCKS",
  "GRAPPLE TRUCKS",
  "HOOKLIFT TRUCKS",
  "HOT SHOT TRUCKS",
  "KNUCKLE BOOM CRANE TRUCKS",
  "LANDSCAPE TRUCKS",
  "LOGGING TRUCKS",
  "MISCELLANEOUS TRUCKS",
  "MIXER TRUCKS",
  "PASSENGER BUS",
  "PICKUP TRUCKS",
  "PLOW / SPREADER TRUCKS",
  "RECYCLING TRUCKS",
  "RV HAULER / TOTER TRUCKS",
  "SERVICE TRUCKS / UTILITY / MECHANIC",
  "SHUTTLE BUS",
  "SLEEPER TRUCKS",
  "STAKE TRUCKS",
  "STONE SLINGER TRUCKS",
  "TANK TRUCKS",
  "TOW TRUCKS",
  "TRUCK BODIES",
  "VANS",
  "WINCH / OILFIELD TRUCKS",
  "YARD SPOTTER TRUCKS"
]   
    ,
 "ATTACHMENTS / PARTS": [
  "EXCAVATOR - PARTS / ATTACHMENTS",
  "SKID STEER - PARTS / ATTACHMENTS",
  "WHEEL LOADER - PARTS / ATTACHMENTS",
  "DOZER ATTACHMENTS",
  "BACKHOE ATTACHMENTS",
  "ASPHALT ATTACHMENTS",
  "CRANE ATTACHMENTS",
  "DOZER ATTACHMENTS",
  "MOTOR GRADER ATTACHMENTS",
  "APRON",
  "ARCH",
  "ARM",
  "ASPHALT CUTTER",
  "ASPHALT/PAVING",
  "AUGER",
  "AXLE",
  "BACKHOE",
  "BED",
  "BEDING CONVEYOR",
  "BLADES",
  "BOOMS",
  "BOWL",
  "BUCKETS",
  "CABLE PLOWS",
  "CABS",
  "CARBODY",
  "C-FRAME",
  "CIRCLES",
  "CLAMPS",
  "COMPACTOR",
  "COMPACTOR WHEEL",
  "CONCRETE SAW",
  "COUNTERWEIGHT",
  "COUPLER",
  "CRANE",
  "CRUSHER",
  "DELIMBER",
  "DIFFERNTIAL",
  "DRAWBAR",
  "DRILL",
  "EJECTOR GATE",
  "ENGINE",
  "EQUALIZER BARS",
  "FAIRLEADS",
  "FELLER BUNCHER",
  "FINAL DRIVE",
  "FORESTRY TILLER",
  "FORKS",
  "GENERATOR END",
  "GRAPPLES",
  "HAMMER/BREAKER",
  "HITCH",
  "HOOK BLOCK",
  "HYDRAULIC CYLINDERS",
  "HYDRAULIC PUMP",
  "HYDRAULICS",
  "JIB",
  "MAGNET",
  "MAST",
  "MULCHER",
  "OTHER",
  "OUTRIGGER",
  "PILE DRIVER",
  "PLANETARY",
  "PLATFORM/BASKET",
  "POST HOLE DIGGER",
  "PROCESSOR/HARVERSTER",
  "PUSH BLOCK",
  "RADIATOR",
  "RAKES",
  "RIDE STRUT",
  "RIM",
  "RIPPER",
  "SCARIFIERS",
  "SEAT",
  "SHANKS",
  "SHEARS",
  "SHELL KIT",
  "SHREDDER/MOWER",
  "SIDEBOOM",
  "SLEW RING",
  "SNOW PLOW",
  "SNOW WING",
  "SNOWBLOWER",
  "STICK",
  "STUMP GRINDER",
  "STUMP SPLITTER",
  "SWEEPER",
  "SWEEPS",
  "SWING DRIVE",
  "SWING MOTOR",
  "TAILGATE",
  "TEETH",
  "THUMB",
  "TIRES",
  "TORQUE CONVERTER",
  "TRANSMISSIONS",
  "TRAVEL MOTOR",
  "TREE SAW",
  "TREE SPADE",
  "TRENCHER",
  "TRUCK BED",
  "UNDERCARRIAGE PARTS",
  "VALVE",
  "WATER TANKS",
  "WEIGHTS",
  "WHEELS",
  "WINCH"
]
    , 
"SUPPORT EQUIPMENT": [
  "DUMPERS",
  "AIR COMPRESSORS",
  "GENERATORS",
  "HEATERS",
  "LIGHT TOWERS",
  "PUMPS",
  "VACUUM EXCAVATORS",
  "OTHER"
]
    , 

    "UTILITY CARTS": [
  "JOHN DEERE",
  "KUBOTA",
  "POLARIS",
  "KAWASAKI",
  "BOBCAT",
  "CAN-AM",
  "CFMOTO",
  "TORO",
  "CLUB CAR",
  "HONDA",
  "AMERICAN LANDMASTER",
  "ARCTIC CAT",
  "ARGO",
  "BAD BOY",
  "BENNCHE",
  "BIG HORN",
  "CORVUS",
  "CUB CADET",
  "CUSHMAN",
  "E-Z-GO",
  "GRAVELY",
  "GREENWORKS",
  "HISUN",
  "HUNTVE",
  "INTIMADATOR",
  "IR",
  "KIOTI",
  "MAHINDRA",
  "NEW HOLLAND",
  "SDLANCH",
  "SCHERP",
  "SUBARU",
  "SUZUKI",
  "TAYLOR DUNN",
  "TUATARA",
  "VITACCI",
  "YAMAHA",
  "YANMAR",
  "ALL OTHERS"
]
    ,
    
  } ;

  let taxonomy = null;

  if (category === "MOTOR GRADERS") {
    taxonomy = motorGradersTaxonomy;
  }

  if (category === "WHEEL LOADERS") {
    taxonomy = wheelLoadersTaxonomy;
  }
  
if (category === "DOZERS") {
  taxonomy = dozersTaxonomy;
}
  if (category === "EXCAVATORS") {
  taxonomy = excavatorsTaxonomy;
}
  if (category === "AERIAL EQUIPMENT") {
  taxonomy = aerialTaxonomy;
}
  if (category === "AGGREGATE") {
  taxonomy = aggregateTaxonomy;
}
  if (category === "AGRICULTURE HARVESTERS") {
  taxonomy = agricultureHarvestersTaxonomy;
}
  if (category === "AGRICULTURE TRACTORS") {
  taxonomy = agricultureTractorsTaxonomy;
}
   if (category === "ASPHALT EQUIPMENT") {
  taxonomy = asphaltEquipmentTaxonomy;
}
if (category === "BACKHOE LOADERS") {
  taxonomy = backhoeLoadersTaxonomy;
}
  if (category === "COMPACTION/ROLLERS") {
  taxonomy = compactionRollersTaxonomy;
}
   if (category === "CRANES") {
  taxonomy = cranesTaxonomy;
}
  if (category === "CRAWLER CARRIERS / LOADER") {
  taxonomy = crawlerCarriersTaxonomy;
} 
  if (category === "DRILLS & PILING") {
  taxonomy = drillsAndPilingTaxonomy;
}
  if (category === "DUMP TRUCKS - ARTIC/RIGID") {
  taxonomy = dumpTrucksTaxonomy;
}
  if (category === "FORKLIFTS") {
  taxonomy = forkliftsTaxonomy;
}
  if (category === "SCRAPER") {
  taxonomy = scraperTaxonomy;
}
  if (category === "SKID STEER/CTL") {
  taxonomy = skidSteerCtlTaxonomy;
}
  if (category === "TELEHANDLERS") {
  taxonomy = telehandlersTaxonomy;
}
  if (category === "TRENCHERS/PLOWS") {
  taxonomy = trenchersTaxonomy;
}
  if (category === "TRAILERS") {
  taxonomy = trailersTaxonomy;
}
  if (category === "TRUCKS") {
  taxonomy = trucksTaxonomy;
}
  if (category === "ATTACHMENTS / PARTS") {
  taxonomy = attachmentsPartsTaxonomy;
}
  if (category === "SUPPORT EQUIPMENT") {
  taxonomy = supportEquipmentTaxonomy;
}
  if (category === "UTILITY CARTS") {
  taxonomy = utilityCartsTaxonomy;
}
  if (taxonomy) {
    const makes = taxonomy.map((x) => x.make).filter(Boolean);
    const preferred = preferredMakes[category] || [];
    const extraMakes = Array.from(new Set(makes)).filter(
      (m) => !preferred.includes(m)
    );

    return ["ALL MAKES", ...preferred, ...extraMakes];
  }

  const makes = liveListings
    .filter(
      (item) =>
        category === "ALL CATEGORIES" ||
        String(item.type || "").toUpperCase() === category
    )
    .map((item) => item.make)
    .filter(Boolean);

  return ["ALL MAKES", ...Array.from(new Set(makes)).sort()];
}, [liveListings, category]);
  
  const availableModels = useMemo(() => {
  let taxonomy = null;

  if (category === "MOTOR GRADERS") {
    taxonomy = motorGradersTaxonomy;
  }

  if (category === "WHEEL LOADERS") {
    taxonomy = wheelLoadersTaxonomy;
  }
    if (category === "DOZERS") {
  taxonomy = dozersTaxonomy;
}
    if (category === "EXCAVATORS") {
  taxonomy = excavatorsTaxonomy;
}
    if (category === "AERIAL EQUIPMENT") {
  taxonomy = aerialTaxonomy;
}
  if (category === "AGGREGATE") {
  taxonomy = aggregateTaxonomy;
}
    if (category === "AGRICULTURE HARVESTERS") {
  taxonomy = agricultureHarvestersTaxonomy;
}
    if (category === "AGRICULTURE TRACTORS") {
  taxonomy = agricultureTractorsTaxonomy;
}
     if (category === "ASPHALT EQUIPMENT") {
  taxonomy = asphaltEquipmentTaxonomy;
}
    if (category === "BACKHOE LOADERS") {
  taxonomy = backhoeLoadersTaxonomy;
}
    if (category === "COMPACTION/ROLLERS") {
  taxonomy = compactionRollersTaxonomy;
}
     if (category === "CRANES") {
  taxonomy = cranesTaxonomy;
}
    if (category === "CRAWLER CARRIERS / LOADER") {
  taxonomy = crawlerCarriersTaxonomy;
}
    if (category === "DRILLS & PILING") {
  taxonomy = drillsAndPilingTaxonomy;
}
    if (category === "DUMP TRUCKS - ARTIC/RIGID") {
  taxonomy = dumpTrucksTaxonomy;
}
    if (category === "FORKLIFTS") {
  taxonomy = forkliftsTaxonomy;
}
    if (category === "SCRAPER") {
  taxonomy = scraperTaxonomy;
}
    if (category === "SKID STEER/CTL") {
  taxonomy = skidSteerCtlTaxonomy;
}
    if (category === "TELEHANDLERS") {
  taxonomy = telehandlersTaxonomy;
}
    if (category === "TRENCHERS/PLOWS") {
  taxonomy = trenchersTaxonomy;
}
    if (category === "TRAILERS") {
  taxonomy = trailersTaxonomy;
}
    if (category === "TRUCKS") {
  taxonomy = trucksTaxonomy;
}
    if (category === "ATTACHMENTS / PARTS") {
  taxonomy = attachmentsPartsTaxonomy;
}
    if (category === "SUPPORT EQUIPMENT") {
  taxonomy = supportEquipmentTaxonomy;
}
    if (category === "UTILITY CARTS") {
  taxonomy = utilityCartsTaxonomy;
}
  if (taxonomy && make !== "ALL MAKES") {
    const models = taxonomy
      .filter((x) => x.make === make)
      .map((x) => x.model)
      .filter(Boolean);

    return ["ALL MODELS", ...Array.from(new Set(models))];
  }

  const models = liveListings
    .filter(
      (item) =>
        category === "ALL CATEGORIES" ||
        String(item.type || "").toUpperCase() === category
    )
    .filter(
      (item) =>
        make === "ALL MAKES" ||
        item.make === make
    )
    .map((item) => item.model)
    .filter(Boolean);

  return ["ALL MODELS", ...Array.from(new Set(models)).sort()];
}, [liveListings, category, make]);

  const filteredListings = useMemo(() => {
  const q = searchQuery.trim().toLowerCase();

  const filtered = liveListings.filter(item => {
    const listingStatus =
  item.listingStatus ||
  item.publicData?.listingStatus ||
  item.attributes?.publicData?.listingStatus;

const isArchived = listingStatus === "archived";
    
    const searchableText = [
      item.title,
      item.type,
      item.category,
      item.make,
      item.model,
      item.location,
      item.hours,
      item.price,
      item.year,
      ...(getListingKeywords(item) || [])
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const matchesSearch =
      !q || searchableText.includes(q);

    const matchesCategory =
      category === "ALL CATEGORIES" ||
      String(item.type || item.category || "")
        .toUpperCase() === category;

    const matchesMake =
      make === "ALL MAKES" ||
      String(item.make || "")
        .toUpperCase() === String(make).toUpperCase();

    const matchesModel =
      model === "ALL MODELS" ||
      String(item.model || "")
        .toUpperCase() === String(model).toUpperCase();

   return (
  !isArchived &&
  matchesSearch &&
  matchesCategory &&
  matchesMake &&
  matchesModel &&
      matchesRange(getListingYear(item), filters.yearMin, filters.yearMax) &&
      matchesRange(item.price, filters.priceMin, filters.priceMax) &&
      matchesRange(item.hours, filters.hoursMin, filters.hoursMax)
    );
  });

  return sortListings(filtered, sortMode);
}, [
  searchQuery,
  category,
  make,
  model,
  liveListings,
  filters,
  sortMode
]);
  
  async function toggleSave(listingId) {
  if (!sdk) {
    window.location.href = "/login";
    return;
  }

  try {
    const currentUser = await sdk.currentUser.show();

    const profile =
      currentUser?.data?.data?.attributes?.profile || {};

    const currentPrivateData =
      profile?.privateData || {};

    const currentSaved =
      Array.isArray(currentPrivateData.savedListings)
        ? currentPrivateData.savedListings.map(String)
        : [];

    const alreadySaved =
      currentSaved.includes(String(listingId));

    const nextSaved = alreadySaved
      ? currentSaved.filter(id => id !== String(listingId))
      : [...currentSaved, String(listingId)];

    await sdk.currentUser.updateProfile({
      privateData: {
        ...currentPrivateData,
        savedListings: nextSaved
      }
    });

    setSavedIds(nextSaved);
  } catch (err) {
    console.error("Save failed", err);
  }
}
  
  return (
    <>
  <Head>
  <title>Browse Equipment | IronXchange</title>

  <meta
    name="description"
    content="Browse heavy equipment for sale on IronXchange."
  />

  <link
    href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"
    rel="stylesheet"
  />
</Head>
      
    <Navbar />
      
   <section className="search-section">
  <h1>IronXchange Equipment Marketplace</h1>

  <p>
    Search heavy equipment for sale from owners,
    dealers, and fleet operators.
  </p>

  <div className="search-top-row">
    <input
      type="text"
      className="browse-search"
      placeholder="Search equipment..."
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
    />

    <select
      value={category}
      onChange={(e) => {
        setCategory(e.target.value);
        setMake("ALL MAKES");
        setModel("ALL MODELS");
      }}
    >
      {categories.map((c) => (
        <option key={c}>{c}</option>
      ))}
    </select>

    <select
      value={make}
      onChange={(e) => {
        setMake(e.target.value);
        setModel("ALL MODELS");
      }}
    >
      {availableMakes.map((m) => (
        <option key={m}>{m}</option>
      ))}
    </select>

    <select
      value={model}
      onChange={(e) => setModel(e.target.value)}
    >
      {availableModels.map((m) => (
        <option key={m}>{m}</option>
      ))}
    </select>

    <button
      type="button"
      className="search-btn"
    >
      SEARCH
    </button>
  </div>

  <div className="filter-strip">
    <div className="range-group">
      <input
        placeholder="Year Min"
        value={filters.yearMin}
        onChange={(e) =>
          setFilters({
            ...filters,
            yearMin: e.target.value
          })
        }
      />

      <span></span>

      <input
        placeholder="Year Max"
        value={filters.yearMax}
        onChange={(e) =>
          setFilters({
            ...filters,
            yearMax: e.target.value
          })
        }
      />
    </div>

    <div className="range-group">
      <input
        placeholder="Price Min"
        value={filters.priceMin}
        onChange={(e) =>
          setFilters({
            ...filters,
            priceMin: e.target.value
          })
        }
      />

      <span></span>

      <input
        placeholder="Price Max"
        value={filters.priceMax}
        onChange={(e) =>
          setFilters({
            ...filters,
            priceMax: e.target.value
          })
        }
      />
    </div>

    <div className="range-group">
      <input
        placeholder="Hours Min"
        value={filters.hoursMin}
        onChange={(e) =>
          setFilters({
            ...filters,
            hoursMin: e.target.value
          })
        }
      />

      <span></span>

      <input
        placeholder="Hours Max"
        value={filters.hoursMax}
        onChange={(e) =>
          setFilters({
            ...filters,
            hoursMax: e.target.value
          })
        }
      />
    </div>

    <select
      className="sort-select"
      value={sortMode}
      onChange={(e) => setSortMode(e.target.value)}
    >
      <option value="newest">Sort</option>
      <option value="price-low">Price Low → High</option>
      <option value="price-high">Price High → Low</option>
      <option value="hours-low">Hours Low → High</option>
      <option value="hours-high">Hours High → Low</option>
      <option value="year-new">Year Newest</option>
      <option value="year-old">Year Oldest</option>
    </select>

    <button
      type="button"
      className="clear-btn"
      onClick={() =>
        setFilters({
          yearMin: "",
          yearMax: "",
          priceMin: "",
          priceMax: "",
          hoursMin: "",
          hoursMax: ""
        })
      }
    >
      CLEAR
    </button>
  </div>
</section>

      <section className="featured">
        <div className="section-head">
          <h2>AVAILABLE EQUIPMENT</h2>

          <span>
            {filteredListings.length} LISTINGS
          </span>
        </div>

<div
  className={`browse-grid ${
    filteredListings.length === 1 ? "single-card" : ""
  }`}
>
  {filteredListings.map((item) => {
    const id = String(getListingId(item));

    return (
      <ListingCard
        key={id}
        listing={item}
        saved={savedIds.includes(id)}
        onToggleSaved={toggleSave}
      />
    );
  })}
</div>

        {filteredListings.length === 0 && (
          <div className="empty">
            <h3>No listings found.</h3>
            <p>Try another category or search term.</p>
          </div>
        )}
      </section>

        <Footer />

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

.search-section {
  padding: 30px 5% 26px;
  background:
    linear-gradient(180deg, rgba(255,255,255,.018), rgba(255,255,255,0)),
    #0b0b0b;
  text-align: center;
  border-bottom: 1px solid rgba(255,255,255,.045);
}

.search-section h1 {
  margin: 0 0 6px;
  color: rgba(255,255,255,.62);
  font-size: 13px;
  font-weight: 800;
  letter-spacing: .45px;
  text-transform: uppercase;
}

.search-section p {
  color: rgba(255,255,255,.38);
  margin: 7px 0 0;
  font-size: 13px;
}

.search-top-row {
  max-width: 760px;
  margin: 22px auto 10px;

  display: grid;
  grid-template-columns: 230px 145px 115px 115px 82px;

  background:
    linear-gradient(180deg, rgba(255,255,255,.035), rgba(255,255,255,0)),
    #111;

  border: 1px solid rgba(255,255,255,.065);
  outline: 1px solid rgba(255,255,255,.018);

  border-radius: 13px;
  overflow: hidden;

  box-shadow:
    0 1px 0 rgba(255,255,255,.035) inset,
    0 18px 44px rgba(0,0,0,.28);

  min-height: 38px;
}

.browse-search,
.search-top-row select {
  height: 38px;
  padding: 0 10px;
  font-size: 11.5px;
}

.browse-search::placeholder {
  color: rgba(255,255,255,.32);
  font-weight: 600;
}

.search-top-row select,
.sort-select {
  background-color: #121006;
  border-color: rgba(255,196,0,.16);
  color: rgba(255,255,255,.72);

  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;

  background-image:
    linear-gradient(45deg, transparent 50%, #FFC400 50%),
    linear-gradient(135deg, #FFC400 50%, transparent 50%);

  background-position:
    calc(100% - 16px) 50%,
    calc(100% - 11px) 50%;

  background-size: 5px 5px, 5px 5px;
  background-repeat: no-repeat;

  padding-right: 34px;
}

.browse-search::placeholder {
  color: #777;
}

.search-btn {
  height: 38px;
  font-size: 9.5px;

  background: #151515;
  color: #FFC400;

  border: none;
  border-left: 1px solid rgba(255,255,255,.07);

  font-size: 10px;
  font-weight: 950;
  cursor: pointer;
  letter-spacing: .55px;
  text-transform: uppercase;

  box-shadow: 0 1px 0 rgba(255,255,255,.035) inset;
}

.search-btn:hover {
  background: #1a1400;
  color: #FFC400;
}

.filter-strip {
  max-width: 760px;
  margin: 0 auto;
  width: 100%;

  display: flex;
  justify-content: center;
  align-items: stretch;
  gap: 0;
}

.range-group {
  display: grid;
  grid-template-columns: 1fr 1px 1fr;
  align-items: center;

  height: 30px;

  border: 1px solid rgba(255,255,255,.075);
  background: #101010;

  overflow: hidden;
  margin-right: -1px;
}

.range-group:first-child {
  border-radius: 8px 0 0 8px;
}

.range-group span {
  width: 1px;
  height: 58%;
  background: rgba(255,255,255,.08);
}

.range-group input {
  height: 100%;
  min-width: 0;

  border: none;
  padding: 0 10px;

  background: transparent;
  color: rgba(255,255,255,.70);

  font-size: 10px;
  font-weight: 850;
  text-align: center;

  outline: none;
}

.range-group input::placeholder {
  color: rgba(255,255,255,.30);
}

.sort-select {
  height: 30px;
  width: 118px;

  border: 1px solid rgba(255,255,255,.075);
  border-radius: 0;

  background-color: #101010;
  color: rgba(255,255,255,.70);

  padding: 0 30px 0 9px;

  font-size: 9.5px;
  font-weight: 900;

  outline: none;

  margin-right: -1px;
}

.clear-btn {
  height: 30px;
  width: 52px;

  border: 1px solid rgba(255,255,255,.075);
  border-left: none;

  border-radius: 0 8px 8px 0;

  background: #121006;
  border-color: rgba(255,196,0,.14);
  color: rgba(255,255,255,.42);

  font-size: 9px;
  font-weight: 900;

  cursor: pointer;

  display: flex;
  align-items: center;
  justify-content: center;
}

.search-top-row select:hover,
.sort-select:hover,
.clear-btn:hover {
  background-color: #151515;
}

.search-top-row select:focus,
.sort-select:focus,
.browse-search:focus,
.range-group input:focus {
  box-shadow: inset 0 0 0 1px rgba(255,196,0,.16);
}

.sort-select:hover,
.clear-btn:hover {
  background: #1a1400;
  border-color: rgba(255,196,0,.38);
}

.featured {
  padding: 46px 5% 60px;
  background: #0B0B0B;
  color: #D6D6D6;
}

.section-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 24px;
}

.section-head h2 {
  margin: 0;
  color: #F2F2F2;
  font-size: 22px;
  letter-spacing: -0.2px;
}

.section-head span {
  color: #888;
  font-size: 13px;
  font-weight: 700;
}

.browse-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 22px;
}

.browse-grid.single-card {
  grid-template-columns: minmax(250px, 300px);
  justify-content: center;
}

.empty {
  padding: 40px;
  text-align: center;
}

@media (max-width: 1100px) {
  .browse-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 850px) {
  .logo-img {
    height: 34px;
  }

  .nav-links {
    gap: 18px;
  }

  .yellow-link {
    font-size: 12px !important;
  }

  .login-icon {
    width: 28px;
    height: 28px;
  }

  .search-top-row {
    grid-template-columns: 1fr;
  }

  .browse-search,
  .search-top-row select {
    border-right: none;
    border-bottom: 1px solid #2A2A2A;
  }

  .filter-strip {
    justify-content: flex-start;
    overflow-x: auto;
    padding-bottom: 6px;
  }

  .range-group,
  .sort-select,
  .clear-btn {
    flex: 0 0 auto;
  }

    .browse-grid {
    grid-template-columns: 1fr;
  }
}
`}</style>
    </>
  );
}
