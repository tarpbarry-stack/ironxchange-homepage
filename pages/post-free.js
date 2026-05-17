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

const aggregateKeywords = [
  "jaw crusher",
  "cone crusher",
  "impact crusher",
  "horizontal shaft impact",
  "vertical shaft impact",
  "vsi crusher",
  "hsi crusher",
  "portable crusher",
  "tracked crusher",
  "track crusher",
  "wheel mounted crusher",
  "mobile crusher",
  "rock crusher",
  "screen plant",
  "scalping screen",
  "finishing screen",
  "triple deck screen",
  "double deck screen",
  "single deck screen",
  "rinser",
  "wash plant",
  "sand plant",
  "sand screw",
  "fine material washer",
  "log washer",
  "coarse material washer",
  "dewatering screen",
  "water clarification",
  "thickener",
  "cyclone",
  "hydrocyclone",
  "stacker",
  "tracked stacker",
  "radial stacker",
  "conveyor",
  "transfer conveyor",
  "feed conveyor",
  "hopper",
  "surge hopper",
  "crusher feed",
  "grizzly",
  "vibrating grizzly",
  "grizzly feeder",
  "apron feeder",
  "belt feeder",
  "vibrating feeder",
  "scalp screen",
  "rip rap",
  "riprap",
  "base rock",
  "road base",
  "crusher run",
  "minus",
  "washed rock",
  "washed sand",
  "mason sand",
  "pea gravel",
  "screened rock",
  "oversize",
  "undersize",
  "fines",
  "screenings",
  "asphalt millings",
  "recycled asphalt",
  "recycled concrete",
  "rap",
  "rca",
  "virgin material",
  "aggregate yard",
  "quarry",
  "rock quarry",
  "limestone quarry",
  "granite quarry",
  "sand pit",
  "gravel pit",
  "borrow pit",
  "portable plant",
  "closed circuit",
  "open circuit",
  "magnet",
  "cross belt magnet",
  "overband magnet",
  "metal separator",
  "belt scale",
  "scales",
  "loadout",
  "truck loadout",
  "rail loadout",
  "ship loadout",
  "barge loadout",
  "catwalk",
  "walkway",
  "service platform",
  "dust suppression",
  "dust collector",
  "water spray",
  "spray bars",
  "generator powered",
  "electric powered",
  "diesel powered",
  "hybrid power",
  "tier 3",
  "tier 4",
  "tier 4 final",
  "de-tier",
  "detier",
  "no def",
  "low hours",
  "one owner",
  "fleet maintained",
  "quarry maintained",
  "mine maintained",
  "contractor owned",
  "owner operator",
  "fresh service",
  "service records",
  "new bearings",
  "new belts",
  "new rollers",
  "new screens",
  "new liners",
  "new blow bars",
  "new jaw dies",
  "new cone liners",
  "new impact curtains",
  "new shafts",
  "new motors",
  "new pumps",
  "new hydraulic hoses",
  "new hydraulic pump",
  "new engine",
  "reman engine",
  "engine rebuilt",
  "new radiator",
  "new conveyor belt",
  "new skirting",
  "new idlers",
  "new drum",
  "new pulleys",
  "good bearings",
  "good belts",
  "good liners",
  "good dies",
  "good blow bars",
  "good screens",
  "excellent condition",
  "clean plant",
  "tight machine",
  "straight machine",
  "ready to work",
  "job ready",
  "production ready",
  "work ready",
  "field ready",
  "daily runner",
  "high production",
  "high capacity",
  "tons per hour",
  "tph",
  "200 tph",
  "300 tph",
  "400 tph",
  "500 tph",
  "600 tph",
  "700 tph",
  "800 tph",
  "1000 tph",
  "high throughput",
  "efficient screening",
  "efficient crushing",
  "fuel efficient",
  "low fuel burn",
  "eco mode",
  "high reduction ratio",
  "fine crushing",
  "primary crusher",
  "secondary crusher",
  "tertiary crusher",
  "quaternary crusher",
  "portable wash plant",
  "modular plant",
  "stationary plant",
  "electric plant",
  "plug in plant",
  "generator package",
  "genset",
  "cat engine",
  "caterpillar engine",
  "deutz engine",
  "volvo engine",
  "cummins engine",
  "scania engine",
  "john deere engine",
  "hydraulic folding conveyor",
  "folding conveyor",
  "remote control",
  "wireless remote",
  "radio remote",
  "camera system",
  "backup camera",
  "led lights",
  "work lights",
  "walk around remote",
  "track remote",
  "self contained",
  "crusher package",
  "screen package",
  "wash package",
  "recycle package",
  "aggregate package",
  "quarry package",
  "mining package",
  "recycling package",
  "demolition package",
  "asphalt recycling",
  "concrete recycling",
  "contract crushing",
  "portable crushing",
  "mobile screening",
  "mobile crushing",
  "onsite crushing",
  "onsite screening",
  "pit portable",
  "highway portable",
  "dot approved",
  "road legal",
  "towable",
  "fifth wheel",
  "king pin",
  "air brakes",
  "landing gear",
  "hydraulic leveling",
  "leveling jacks",
  "stabilizers",
  "feed hopper",
  "hopper extensions",
  "hopper wings",
  "belt feeder",
  "vibratory feeder",
  "pre screen",
  "pre-screen",
  "scalp section",
  "screen box",
  "screen media",
  "wire cloth",
  "poly media",
  "rubber media",
  "finger deck",
  "piano wire",
  "self cleaning screen",
  "crusher chamber",
  "closed side setting",
  "css",
  "open side setting",
  "oss",
  "hydraulic adjust",
  "hydraulic release",
  "overload protection",
  "tramp iron relief",
  "auto setting",
  "variable speed feeder",
  "variable speed conveyor",
  "reversible conveyor",
  "side conveyor",
  "return conveyor",
  "fines conveyor",
  "stockpile conveyor",
  "under crusher conveyor",
  "cross conveyor",
  "discharge conveyor",
  "catwalk package",
  "safety rails",
  "osha package",
  "lockout system",
  "grease system",
  "autolube",
  "auto lube",
  "central lube",
  "hydraulic tensioners",
  "belt scraper",
  "magnetic head pulley",
  "metal detector",
  "dust curtains",
  "crusher automation",
  "plant automation",
  "telematics",
  "remote diagnostics",
  "wireless monitoring",
  "touchscreen controls",
  "control panel",
  "mcc",
  "motor control center",
  "switchgear",
  "transformer",
  "soft start",
  "vfd",
  "variable frequency drive",
  "generator ready",
  "grid power",
  "solar powered",
  "hybrid package",
  "good tracks",
  "new tracks",
  "steel tracks",
  "track drive",
  "track motors",
  "hydraulic track drive",
  "track undercarriage",
  "crawler carrier",
  "track chassis",
  "low ground pressure",
  "lgp",
  "excellent undercarriage",
  "new rollers",
  "new idlers",
  "new sprockets",
  "new chains",
  "good undercarriage",
  "tight tracks",
  "excellent structure",
  "good frame",
  "straight frame",
  "clean iron",
  "hard to find",
  "immediate availability",
  "available now",
  "delivery available",
  "shipping available",
  "financing available",
  "operator ready",
  "excellent operating condition",
  "excellent maintenance",
  "excellent service history",
  "maintenance records",
  "dealer maintained",
  "field serviced",
  "fresh fluids",
  "new filters",
  "new oils",
  "major service complete",
  "recent pm",
  "pm current",
  "maintenance current",
  "worksite tested",
  "ready for immediate use",
  "excellent hydraulics",
  "strong hydraulics",
  "strong conveyor motors",
  "excellent feeder",
  "excellent crusher",
  "excellent screen box",
  "excellent vibration",
  "excellent bearings",
  "good shafts",
  "good housings",
  "tight machine",
  "excellent engine",
  "strong engine",
  "excellent cooling system",
  "new coolant hoses",
  "new turbo",
  "new injectors",
  "good pumps",
  "excellent electrical system",
  "good wiring",
  "new batteries",
  "new starter",
  "new alternator",
  "cold weather package",
  "arctic package",
  "desert package",
  "high ambient cooling",
  "mine spec",
  "quarry spec",
  "contractor spec",
  "high spec",
  "fully equipped",
  "loaded machine",
  "premium plant",
  "production machine",
  "high uptime",
  "low downtime",
  "excellent fuel economy",
  "excellent throughput",
  "excellent screening efficiency",
  "excellent crushing efficiency",
  "excellent product shape",
  "excellent gradation",
  "excellent fines control",
  "excellent wash recovery",
  "excellent stockpiling",
  "excellent material flow",
  "excellent feed system",
  "excellent discharge",
  "excellent transportability",
  "easy setup",
  "fast setup",
  "easy transport",
  "quick mobilization",
  "quick teardown",
  "excellent mobility",
  "excellent portability",
  "excellent reliability",
  "excellent wear life",
  "excellent production numbers",
  "excellent operator visibility",
  "excellent service access",
  "easy maintenance",
  "service friendly",
  "ground level service",
  "safe service access",
  "excellent catwalks",
  "excellent controls",
  "excellent automation",
  "excellent remote control",
  "excellent monitoring",
  "excellent diagnostics",
  "excellent loadout",
  "excellent conveyor package",
  "excellent hopper",
  "excellent feeder",
  "excellent screening media",
  "excellent crusher liners",
  "excellent blow bars",
  "excellent jaw dies",
  "excellent cone liners",
  "excellent impact curtains",
  "excellent shafts",
  "excellent drums",
  "excellent pulleys",
  "excellent idlers",
  "excellent belts",
  "excellent skirting",
  "excellent seals",
  "excellent hydraulics package",
  "excellent wash package",
  "excellent recycle package",
  "excellent aggregate package",
  "excellent demolition package",
  "excellent asphalt recycle plant",
  "excellent concrete recycle plant",
  "excellent crushing spread",
  "excellent screening spread",
  "excellent portable spread",
  "excellent contract crusher",
  "excellent quarry plant",
  "excellent wash plant",
  "excellent stacker",
  "excellent radial stacker",
  "excellent transfer conveyor",
  "excellent stockpile conveyor",
  "excellent crusher feed",
  "excellent feed hopper",
  "excellent pre-screen",
  "excellent magnetic separator",
  "excellent dust suppression",
  "excellent control panel",
  "excellent generator package",
  "excellent electric plant",
  "excellent diesel plant",
  "excellent hybrid plant",
  "excellent production capacity",
  "excellent operating cost",
  "excellent ownership cost",
  "excellent ROI",
  "excellent material quality",
  "excellent aggregate quality",
  "excellent recycled material quality",
  "excellent asphalt product",
  "excellent concrete product",
  "excellent road base product",
  "excellent washed product",
  "excellent quarry support",
  "excellent mine support",
  "excellent contractor support",
  "excellent recycling support",
  "excellent demolition support",
  "excellent material handling",
  "excellent production support",
  "excellent loading support",
  "excellent transport package",
  "excellent mobilization package",
  "excellent operator comfort",
  "excellent plant visibility",
  "excellent safety package",
  "excellent guarding",
  "excellent wear package",
  "excellent maintenance package",
  "excellent serviceability",
  "excellent uptime package",
  "excellent remote support",
  "excellent automation package",
  "excellent scale system",
  "excellent belt scale",
  "excellent load sensing",
  "excellent hydraulic response",
  "excellent feeder control",
  "excellent variable speed control",
  "excellent throughput control",
  "excellent blending",
  "excellent surge handling",
  "excellent stockpile management",
  "excellent transfer handling",
  "excellent quarry efficiency",
  "excellent crushing spread efficiency",
  "excellent screening spread efficiency",
  "excellent recycle spread efficiency",
  "excellent demolition efficiency",
  "excellent aggregate operation",
  "excellent mining operation",
  "excellent pit operation",
  "excellent contractor machine",
  "excellent fleet addition",
  "excellent owner operator plant",
  "excellent high production crusher",
  "excellent high production screen",
  "excellent aggregate spread",
  "excellent material handling spread",
  "excellent portable aggregate plant"
];

const agricultureHarvesterKeywords = [
  "axial flow",
  "single rotor",
  "dual rotor",
  "rotary combine",
  "walker combine",
  "hybrid threshing",
  "conventional threshing",
  "sts rotor",
  "separator rotor",
  "feed accelerator",
  "rock trap",
  "stone trap",
  "feeder house",
  "heavy duty feeder house",
  "feeder chain",
  "feeder drum",
  "feeder reverser",
  "hydraulic reverser",
  "electric reverser",
  "variable speed feeder",
  "high capacity feeder",
  "grain tank",
  "grain tank extension",
  "folding hopper",
  "power fold hopper",
  "hopper extension",
  "unloading auger",
  "folding auger",
  "swing away auger",
  "hydraulic spout",
  "spout control",
  "high unload rate",
  "bubble up auger",
  "clean grain elevator",
  "returns elevator",
  "tailings elevator",
  "tailings return",
  "returns monitor",
  "grain loss monitor",
  "yield monitor",
  "yield mapping",
  "moisture sensor",
  "moisture monitor",
  "mapping",
  "field mapping",
  "gps",
  "autosteer",
  "auto steer",
  "guidance ready",
  "rtk ready",
  "machine sync",
  "section control",
  "variable rate",
  "combine advisor",
  "active yield",
  "automation",
  "harvest automation",
  "header guidance",
  "row guidance",
  "terrain tracker",
  "header height control",
  "contour master",
  "active terrain adjustment",
  "self leveling sieves",
  "self leveling shoe",
  "sidehill",
  "hillside",
  "hillco",
  "tracks",
  "track combine",
  "half tracks",
  "track system",
  "rubber tracks",
  "lsw tires",
  "duals",
  "singles",
  "floater tires",
  "mud hog",
  "mudhog",
  "rear wheel assist",
  "4wd",
  "all wheel drive",
  "power cast tailboard",
  "straw chopper",
  "fine cut chopper",
  "chaff spreader",
  "residue spreader",
  "windrow",
  "swath",
  "straw hood",
  "chaff blower",
  "rotor",
  "separator",
  "concaves",
  "round bar concaves",
  "small wire concaves",
  "large wire concaves",
  "cover plates",
  "separator grates",
  "rotor covers",
  "threshing bars",
  "rasp bars",
  "beater",
  "accelerator rolls",
  "cleaning shoe",
  "shoe sieve",
  "upper sieve",
  "lower sieve",
  "pre sieve",
  "air foil sieve",
  "fan drive",
  "variable speed fan",
  "cleaning fan",
  "returns processor",
  "cross auger",
  "grain pan",
  "tailings processor",
  "tailings beater",
  "grain quality camera",
  "cab camera",
  "rear camera",
  "360 camera",
  "camera system",
  "led lights",
  "work lights",
  "beacon",
  "strobe",
  "cold ac",
  "cold a/c",
  "heat",
  "heated mirrors",
  "air ride seat",
  "buddy seat",
  "cab suspension",
  "touchscreen display",
  "lcd display",
  "armrest controls",
  "multi function handle",
  "hydro handle",
  "hydrostatic drive",
  "2 speed hydro",
  "3 speed hydro",
  "transport speed",
  "road speed",
  "tier 3",
  "tier 4",
  "tier 4 final",
  "de-tier",
  "detier",
  "no def",
  "egr delete",
  "auto idle",
  "idle shutdown",
  "hydraulic folding hopper",
  "bin extension",
  "grain saver",
  "high unload",
  "bushels per second",
  "400 bushel",
  "450 bushel",
  "500 bushel",
  "550 bushel",
  "600 bushel",
  "650 bushel",
  "700 bushel",
  "draper header",
  "rigid header",
  "flex header",
  "grain platform",
  "pickup header",
  "corn head",
  "row crop head",
  "12 row",
  "8 row",
  "16 row",
  "24 row",
  "30 inch rows",
  "20 inch rows",
  "folding corn head",
  "chopping head",
  "non chopping head",
  "stalkmaster",
  "stripper header",
  "pickup reel",
  "air reel",
  "hydraflex",
  "flex draper",
  "rigid draper",
  "dual knife drive",
  "single knife drive",
  "center feed",
  "side feed",
  "header trailer",
  "header cart",
  "poly snouts",
  "deck plates",
  "gathering chains",
  "stalk rolls",
  "knife rolls",
  "calmer rolls",
  "knife drive",
  "header clutch",
  "row sense",
  "crop dividers",
  "header sensors",
  "header tilt",
  "lateral tilt",
  "air cart",
  "yield monitor calibrated",
  "moisture calibrated",
  "auto header height",
  "fore aft reel",
  "hydraulic fore aft",
  "reel speed",
  "variable speed reel",
  "finger pickup",
  "pickup reel",
  "knife sections",
  "double sickle",
  "single sickle",
  "header drive",
  "hydraulic reel drive",
  "reel tine",
  "floating cutterbar",
  "rigid cutterbar",
  "floating feeder house",
  "feed beater",
  "feeder slip clutch",
  "clean grain auger",
  "tailings auger",
  "returns auger",
  "grain bubble up",
  "rotor cage",
  "rotor vanes",
  "threshing cage",
  "grain pan auger",
  "shoe auger",
  "cross conveyor",
  "clean grain tank",
  "hydraulic deck plates",
  "electric deck plates",
  "auto deck plates",
  "row guidance sensors",
  "header height sensors",
  "header float",
  "active float",
  "hydraulic float",
  "auto contour",
  "lateral contour",
  "contour feeder house",
  "air suspension cab",
  "suspension axle",
  "suspension tracks",
  "suspension seat",
  "deluxe cab",
  "premium cab",
  "command arm",
  "hydraulic joystick",
  "electro hydraulic controls",
  "touchpad controls",
  "integrated display",
  "machine diagnostics",
  "wireless diagnostics",
  "remote diagnostics",
  "telematics",
  "wireless monitoring",
  "gps receiver",
  "receiver ready",
  "autosteer valve",
  "guidance display",
  "yield logging",
  "moisture logging",
  "header automation",
  "combine automation",
  "active guidance",
  "machine sync ready",
  "grain cart sync",
  "unload on the go",
  "auto unload",
  "cart guidance",
  "cart camera",
  "cart scale",
  "header lock",
  "transport lock",
  "header reverser",
  "hydraulic knife drive",
  "sickle drive",
  "knife gearbox",
  "hydraulic reel fore aft",
  "reel lift cylinders",
  "reel tines",
  "air suspension seat",
  "seat heater",
  "cab filtration",
  "cab pressurization",
  "premium radio",
  "bluetooth radio",
  "usb ports",
  "12v outlet",
  "220v outlet",
  "cooler compartment",
  "instructional display",
  "camera monitor",
  "hydraulic spreader",
  "mechanical spreader",
  "active spread",
  "residue manager",
  "hydraulic chopper adjustment",
  "power fold extension",
  "swing spout",
  "electric spout",
  "grain tank camera",
  "grain quality sensor",
  "auto crop settings",
  "preset crops",
  "header memory",
  "operator profiles",
  "hydraulic track tension",
  "track suspension",
  "oscillating tracks",
  "drive lugs",
  "mud scraper",
  "track scrapers",
  "rice tires",
  "rice tracks",
  "mud shields",
  "abrasion package",
  "dust package",
  "heavy duty reverser",
  "high torque drive",
  "planetary final drives",
  "heavy duty finals",
  "final drives",
  "hydraulic variable speed",
  "electronic rotor speed",
  "electronic fan speed",
  "rotor speed monitor",
  "shoe load sensor",
  "loss sensor",
  "tailings sensor",
  "grain sensor",
  "electronic sieve adjustment",
  "cab controlled sieves",
  "cab controlled concaves",
  "hydraulic concaves",
  "rotor covers",
  "concave inserts",
  "cover plate inserts",
  "specialty rotor",
  "small grain package",
  "corn package",
  "bean package",
  "canola package",
  "sunflower package",
  "rice package",
  "forage package",
  "silage package",
  "hydraulic folding extensions",
  "grain tank liners",
  "stainless liners",
  "header angle control",
  "hydraulic reel speed",
  "electronic reel speed",
  "header lock pins",
  "feeder clutch",
  "separator clutch",
  "rotor clutch",
  "hydraulic rotor drive",
  "belt drive rotor",
  "gear drive rotor",
  "auger finger retract",
  "hydraulic auger covers",
  "electric sieve control",
  "active sieve",
  "high wear package",
  "abrasion resistant liners",
  "stainless grain tank",
  "electric mirrors",
  "heated mirrors",
  "power mirrors",
  "folding mirrors",
  "air compressor",
  "air tank",
  "cab suspension cylinders",
  "cab leveling",
  "hydraulic leveling",
  "auto leveling",
  "machine balancing",
  "header balancing",
  "rotor balancing",
  "high capacity elevator",
  "heavy duty clean grain elevator",
  "heavy duty returns elevator",
  "high capacity unload",
  "large unload auger",
  "folding spout",
  "hydraulic spout control",
  "high unload extension",
  "grain tank extension",
  "split concaves",
  "modular concaves",
  "quick change concaves",
  "quick change sieves",
  "quick change knives",
  "hydraulic knife adjust",
  "electronic knife monitor",
  "header speed sensor",
  "crop flow sensor",
  "feed rate sensor",
  "rotor pressure sensor",
  "shoe pressure sensor",
  "header pressure sensor",
  "yield calibration",
  "moisture calibration",
  "mapping calibration",
  "autosteer calibration",
  "header calibration",
  "remote support",
  "wireless updates",
  "software updates",
  "operator display",
  "multi function display",
  "integrated controls",
  "machine monitoring",
  "diagnostic port",
  "canbus system",
  "electronic control module",
  "ecm",
  "hydraulic cooling",
  "high ambient cooling",
  "cold weather package",
  "arctic package",
  "dust suppression",
  "intake screen",
  "reversing fan",
  "hydraulic fan",
  "electric fan",
  "battery disconnect",
  "main disconnect",
  "fire suppression",
  "warning beacon",
  "safety package",
  "lighting package",
  "cab package",
  "camera package",
  "guidance package",
  "mapping package",
  "yield package",
  "residue package",
  "track package",
  "header package",
  "hydraulic package",
  "electrical package",
  "operator package"
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
