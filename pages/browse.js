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

const STAGING = "https://staging.ironxchange.com";
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

export default function Browse() {
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("ALL CATEGORIES");
  const [make, setMake] = useState("ALL MAKES");
  const [model, setModel] = useState("ALL MODELS");
  const [liveListings, setLiveListings] = useState([]);

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

    return liveListings.filter((item) => {
      const matchesCategory =
        category === "ALL CATEGORIES" ||
        String(item.type || "").toUpperCase() === category;

      const matchesMake =
        make === "ALL MAKES" ||
        item.make === make;

      const matchesModel =
        model === "ALL MODELS" ||
        item.model === model;

      const matchesSearch =
        !q ||
        (item.title || "").toLowerCase().includes(q) ||
        (item.type || "").toLowerCase().includes(q) ||
        (item.make || "").toLowerCase().includes(q) ||
        (item.model || "").toLowerCase().includes(q) ||
        (item.location || "").toLowerCase().includes(q) ||
        (item.hours || "").toLowerCase().includes(q) ||
        (item.price || "").toLowerCase().includes(q);

      return (
        matchesCategory &&
        matchesMake &&
        matchesModel &&
        matchesSearch
      );
    });
  }, [searchQuery, category, make, model, liveListings]);

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
      
     <nav className="nav">
  <a href="/" className="logo-wrap">
    <img
      src="/images/ironxchange-logo.png"
      className="logo-img"
      alt="IronXchange"
    />
  </a>

  <div className="nav-links">
    <a href={`${STAGING}/l/new`} className="yellow-link">
      POST FREE
    </a>

    <a href={`${STAGING}/login`} className="login-icon" aria-label="Login">
      <i className="fa-regular fa-user"></i>
    </a>
  </div>
</nav>

      <section className="search-section">
        <h1>Browse Equipment</h1>

        <p>
          Search heavy equipment for sale from owners,
          dealers, and fleet operators.
        </p>

        <div className="search-container">
          <input
            type="text"
            placeholder="Search equipment — Deere 772GP, WA475, crusher..."
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
      </section>

      <section className="featured">
        <div className="section-head">
          <h2>AVAILABLE EQUIPMENT</h2>

          <span>
            {filteredListings.length} LISTINGS
          </span>
        </div>

        <div className="cards">
          {filteredListings.map((item) => (
        <a
  href={`/listing/${encodeURIComponent(
    (item.title || "listing")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
  )}`}
  className="card"
  key={item.id || item.link || item.title}
>
              <div
                className="card-photo"
                style={{
                  backgroundImage: `url(${
                    item.imageUrl ||
                    item.image ||
                    "/images/hero-equipment-yard.jpg"
                  })`
                }}
              />

              <div className="card-body">
                <h3>{item.title}</h3>

                <p>
                  {item.type}
                  {item.make ? ` • ${item.make}` : ""}
                  {item.model ? ` • ${item.model}` : ""}
                </p>

                <div className="meta">
                  <span>◷ {item.hours}</span>
                  <span>⌖ {item.location}</span>
                </div>

                <div className="price-row">
                  <strong>{item.price}</strong>

                  <span>VIEW DETAILS</span>
                </div>
              </div>
            </a>
          ))}
        </div>

        {filteredListings.length === 0 && (
          <div className="empty">
            <h3>No listings found.</h3>
            <p>Try another category or search term.</p>
          </div>
        )}
      </section>

      <style jsx>{`
        * {
          box-sizing: border-box;
        }

       :global(body) {
  margin: 0;
  font-family: Arial, sans-serif;
  background: #0B0B0B;
  color: #F5F5F5;
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
  height: 78px;
  width: auto;
  display: block;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 28px;
}

.nav-links a {
  color: white;
  text-decoration: none;
  font-weight: 900;
  text-transform: uppercase;
  font-size: 13px;
  letter-spacing: .6px;
}

.yellow-link {
  color: ${BRAND_YELLOW} !important;
}

.login-icon {
  border: 2px solid white;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  font-size: 15px !important;
}

@media (max-width: 850px) {
  .logo-img {
    height: 56px;
  }

  .nav-links {
    display: flex;
    gap: 18px;
  }

  .yellow-link {
    font-size: 12px !important;
  }

  .login-icon {
    width: 28px;
    height: 28px;
  }
}

        .search-section {
  padding: 38px 5%;
  background: #0B0B0B;
  text-align: center;
  color: #F5F5F5;
}

        .search-container {
  max-width: 1250px;
  margin: 24px auto 0;
  display: grid;
  grid-template-columns: 1fr 210px 175px 175px 120px;
  background: #151515;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid #242424;
}
        input,
select {
  border: none;
  border-right: 1px solid #2A2A2A;
  padding: 18px;
  font-size: 14px;
  background: #151515;
  color: #F5F5F5;
}

        .search-btn {
          border: none;
          background: ${BRAND_YELLOW};
          font-weight: 800;
          cursor: pointer;
        }

        .featured {
  padding: 50px 5%;
  background: #0B0B0B;
  color: #F5F5F5;
}

        .section-head {
          display: flex;
          justify-content: space-between;
          margin-bottom: 24px;
        }

        .cards {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
        }

       .card {
  text-decoration: none;
  color: inherit;
  border: 1px solid #242424;
  border-radius: 12px;
  overflow: hidden;
  background: #151515;
}

        .card-photo {
          height: 190px;
          background-size: cover;
          background-position: center;
        }

        .card-body {
          padding: 18px;
        }

        .meta {
  display: flex;
  gap: 12px;
  font-size: 13px;
  color: #AAA;
}

        .price-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 16px;
        }

        .empty {
          padding: 40px;
          text-align: center;
        }

        @media (max-width: 1100px) {
          .cards {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        @media (max-width: 850px) {
          .cards,
          .search-container {
            grid-template-columns: 1fr;
          }

          input,
          select {
            border-right: none;
            border-bottom: 1px solid #2A2A2A;
          }
        }
      `}</style>
    </>
  );
}
