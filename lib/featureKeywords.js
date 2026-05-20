const featureKeywords = [
  // GRADE / GPS / CONTROLS
  { match: ["smartgrade", "smart grade"], label: "SMARTGRADE" },
  { match: ["topcon"], label: "TOPCON" },
  { match: ["trimble"], label: "TRIMBLE" },
  { match: ["gps"], label: "GPS" },
  { match: ["grade control", "3d grade", "2d grade"], label: "GRADE CONTROL" },
  { match: ["machine control"], label: "MACHINE CONTROL" },
  { match: ["laser", "laser ready"], label: "LASER READY" },
  { match: ["joystick", "joystick controls"], label: "JOYSTICK CONTROLS" },
  { match: ["pilot controls"], label: "PILOT CONTROLS" },
  { match: ["electro hydraulic", "eh controls"], label: "ELECTRO-HYDRAULIC CONTROLS" },

  // HYDRAULICS / ATTACHMENTS
  { match: ["aux hydraulics", "auxiliary hydraulics"], label: "AUX HYDRAULICS" },
  { match: ["high flow", "hi-flow"], label: "HIGH FLOW" },
  { match: ["quick coupler", "hydraulic coupler", "quick attach"], label: "QUICK COUPLER" },
  { match: ["thumb", "hydraulic thumb"], label: "HYDRAULIC THUMB" },
  { match: ["hammer ready", "breaker ready"], label: "HAMMER READY" },
  { match: ["third function", "3rd function"], label: "3RD FUNCTION" },
  { match: ["forks", "pallet forks"], label: "FORKS" },
  { match: ["bucket"], label: "BUCKET" },
  { match: ["4 in 1", "4-in-1"], label: "4-IN-1 BUCKET" },
  { match: ["grapple"], label: "GRAPPLE" },

  // DOZERS / GRADERS / SCRAPERS
  { match: ["push block", "pushblock"], label: "PUSH BLOCK" },
  { match: ["rear ripper", "ripper"], label: "REAR RIPPER" },
  { match: ["scarifier"], label: "SCARIFIER" },
  { match: ["winch"], label: "WINCH" },
  { match: ["pat blade", "power angle tilt"], label: "PAT BLADE" },
  { match: ["6 way blade", "6-way blade"], label: "6-WAY BLADE" },
  { match: ["snow wing"], label: "SNOW WING" },
  { match: ["moldboard"], label: "MOLDBOARD" },
  { match: ["circle drive"], label: "CIRCLE DRIVE" },
  { match: ["ejector"], label: "EJECTOR" },

  // LOADER / AGGREGATE FEATURES
  { match: ["ride control"], label: "RIDE CONTROL" },
  { match: ["scale", "payload scale", "payload scales", "weigh system"], label: "PAYLOAD SCALE" },
  { match: ["auto lube", "autolube", "central lube"], label: "AUTO LUBE" },
  { match: ["aggregate configuration", "aggregate package"], label: "AGGREGATE PACKAGE" },
  { match: ["high lift"], label: "HIGH LIFT" },
  { match: ["quick hitch"], label: "QUICK HITCH" },
  { match: ["return to dig"], label: "RETURN TO DIG" },
  { match: ["self leveling", "self-leveling"], label: "SELF LEVELING" },
  { match: ["z bar", "z-bar"], label: "Z-BAR LINKAGE" },
  { match: ["tool carrier"], label: "TOOL CARRIER" },

  // CAB / COMFORT / SAFETY
  { match: ["cold ac", "cold a/c", "cold air"], label: "COLD A/C" },
  { match: ["heat"], label: "HEAT" },
  { match: ["enclosed cab", "cab"], label: "ENCLOSED CAB" },
  { match: ["rops"], label: "ROPS" },
  { match: ["fops"], label: "FOPS" },
  { match: ["backup camera", "rear camera"], label: "BACKUP CAMERA" },
  { match: ["360 camera"], label: "360 CAMERA" },
  { match: ["led lights", "work lights"], label: "LED LIGHTS" },
  { match: ["beacon", "strobe"], label: "BEACON / STROBE" },
  { match: ["air ride seat"], label: "AIR RIDE SEAT" },

  // TIRES / UNDERCARRIAGE
  { match: ["20.5", "20.5 tires", "20.5r25"], label: "20.5 TIRES" },
  { match: ["23.5", "23.5 tires", "23.5r25"], label: "23.5 TIRES" },
  { match: ["26.5", "26.5 tires", "26.5r25"], label: "26.5 TIRES" },
  { match: ["29.5", "29.5 tires", "29.5r25"], label: "29.5 TIRES" },
  { match: ["radial tires"], label: "RADIAL TIRES" },
  { match: ["foam filled", "foam-filled"], label: "FOAM FILLED TIRES" },
  { match: ["solid tires"], label: "SOLID TIRES" },
  { match: ["good undercarriage"], label: "GOOD UNDERCARRIAGE" },
  { match: ["new undercarriage"], label: "NEW UNDERCARRIAGE" },
  { match: ["rubber tracks"], label: "RUBBER TRACKS" },
  { match: ["steel tracks"], label: "STEEL TRACKS" },
  { match: ["lgp", "low ground pressure"], label: "LGP" },

  // ENGINE / EMISSIONS / SERVICE
  { match: ["no def", "def deleted", "de-tier", "detier"], label: "NO DEF" },
  { match: ["tier 3"], label: "TIER 3" },
  { match: ["tier 4"], label: "TIER 4" },
  { match: ["fresh service", "recent service"], label: "FRESH SERVICE" },
  { match: ["service records"], label: "SERVICE RECORDS" },
  { match: ["fleet maintained"], label: "FLEET MAINTAINED" },
  { match: ["dealer maintained"], label: "DEALER MAINTAINED" },
  { match: ["one owner"], label: "ONE OWNER" },
  { match: ["municipal owned"], label: "MUNICIPAL OWNED" },
  { match: ["low hours"], label: "LOW HOURS" },

  // TRUCKS / TRAILERS / SUPPORT
  { match: ["air brakes"], label: "AIR BRAKES" },
  { match: ["wet kit"], label: "WET KIT" },
  { match: ["pto"], label: "PTO" },
  { match: ["air ride"], label: "AIR RIDE" },
  { match: ["lift axle", "drop axle"], label: "LIFT AXLE" },
  { match: ["hydraulic ramps"], label: "HYDRAULIC RAMPS" },
  { match: ["detach", "detachable"], label: "DETACHABLE NECK" },
  { match: ["generator"], label: "GENERATOR" },
  { match: ["air compressor"], label: "AIR COMPRESSOR" },
  { match: ["light tower"], label: "LIGHT TOWER" }
];

export default featureKeywords;
