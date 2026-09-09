export const ATLAS_REVISION = "2026.09.09";

export const atlasModules = [
  {
    id: "TA-001",
    name: "Machine Card",
    state: "ACTIVE",
    detail: "Customer object / machine interface",
  },
  {
    id: "TA-002",
    name: "Chassis",
    state: "ACTIVE",
    detail: "Board, bays, slots and spatial rules",
  },
  {
    id: "TA-003",
    name: "Console",
    state: "QUEUED",
    detail: "Object operations and working surfaces",
  },
  {
    id: "TA-004",
    name: "Search Surface",
    state: "QUEUED",
    detail: "Discovery, filtering and control grammar",
  },
  {
    id: "TA-005",
    name: "Pockets",
    state: "QUEUED",
    detail: "Persistent utility and workflow modules",
  },
  {
    id: "TA-006",
    name: "System Map",
    state: "QUEUED",
    detail: "Routes, events and object movement",
  },
];

export const machineCardParts = [
  {
    id: "object",
    index: "01",
    code: "IXI-MC-CORE",
    name: "Machine Object",
    short: "Canonical machine/customer surface",
    layer: "STRUCTURE",
    status: "PRODUCTION",
    version: "1.0",
    introduced: "2026-09-06",
    purpose:
      "Keep one machine recognizable while it moves between Marketplace, private work, auction context and AOS.",
    benefit:
      "A customer learns one object once. The surrounding environment changes; the machine does not become a new record.",
    specs: [
      "Family-aware renderer",
      "Context-aware presentation",
      "SSR-safe marketplace family",
      "Deferred private and auction bundles",
    ],
    inputs: ["listing", "cardContext", "sellerMode", "relationship state"],
    outputs: [
      "Marketplace Card",
      "Private Card",
      "Auction Card",
      "Owned Private Runtime",
    ],
    sources: [
      "components/ixi-machine-card/IXIMachineCard.js",
      "components/ixi-machine-card/resolveMachineCardPresentation.js",
    ],
    use: "Use wherever a machine must remain the primary object while permissions, intent or workspace context changes.",
  },
  {
    id: "identity",
    index: "02",
    code: "IXI-ID-PASS",
    name: "IXI Passport",
    short: "Durable machine identity",
    layer: "DATA",
    status: "PRODUCTION",
    version: "1.0",
    introduced: "2026-09-06",
    purpose:
      "Provide a durable identity seam for a machine and its public passport route.",
    benefit:
      "The machine can be referenced and revisited without reducing it to a disposable listing tile.",
    specs: [
      "Passport-addressable route",
      "Listing ID fallback",
      "Identity survives presentation changes",
    ],
    inputs: ["passportId", "listing.id", "machine facts"],
    outputs: [
      "/p/[passportId]",
      "card identity label",
      "shareable object reference",
    ],
    sources: [
      "pages/p/[passportId].js",
      "lib/machine-object/createMachineObjectModel.js",
    ],
    use: "Use as the identity spine for links, handoffs and machine history.",
  },
  {
    id: "family",
    index: "03",
    code: "IXI-MC-FAM",
    name: "Card Family Router",
    short: "Marketplace · Private · Auction",
    layer: "DATA",
    status: "PRODUCTION",
    version: "1.0",
    introduced: "2026-09-06",
    purpose:
      "Resolve the correct card family from machine channel and access policy, then resolve its buyer, seller, auction or comparison presentation.",
    benefit:
      "One system supports different commercial situations without duplicating the customer’s machine data.",
    specs: [
      "Auction channel → Auction",
      "Private access → Private",
      "Default → Marketplace",
      "Context overrides family presentation",
    ],
    inputs: ["machine channel", "machine access", "cardContext", "sellerMode"],
    outputs: ["buyer", "seller", "auction", "comparison"],
    sources: [
      "components/ixi-machine-card/getMachineCardFamily.js",
      "components/ixi-machine-card/resolveMachineCardPresentation.js",
    ],
    use: "Use at the boundary between the machine record and the surface presenting it.",
  },
  {
    id: "face",
    index: "04",
    code: "IXI-MC-F01",
    name: "Primary Face",
    short: "Machine recognition at a glance",
    layer: "STRUCTURE",
    status: "PRODUCTION",
    version: "1.0",
    introduced: "2026-09-06",
    purpose:
      "Lead with the machine: photography, year, make, model, hours, location and commercial state.",
    benefit:
      "A buyer or operator can identify the asset and its status in seconds.",
    specs: [
      "300 × 400 marketplace geometry",
      "300 × 475 workspace geometry",
      "Image-led hierarchy",
      "Responsive internal type",
    ],
    inputs: [
      "photos",
      "machine title",
      "hours",
      "location",
      "price / workflow",
    ],
    outputs: ["recognition", "selection", "face navigation"],
    sources: [
      "components/ixi-machine-card/marketplace/MarketplaceListingCard.js",
      "components/ixi-machine-card/private/PrivateListingCard.js",
    ],
    use: "Use as Face 1 and the default visual entry to the machine.",
  },
  {
    id: "toolbar",
    index: "05",
    code: "IXI-OBJ-TB",
    name: "Object Toolbar",
    short: "Actions that belong to this machine",
    layer: "COMMANDS",
    status: "PRODUCTION",
    version: "1.0",
    introduced: "2026-09-06",
    purpose:
      "Keep machine-specific actions attached to the object rather than scattered through page chrome.",
    benefit:
      "The operator acts on the correct asset with less context switching and lower error risk.",
    specs: [
      "Add / attach control",
      "Edit control",
      "Commercial action",
      "Overflow actions",
    ],
    inputs: ["ownership", "permissions", "workflow state", "selected machine"],
    outputs: ["edit", "commercial workflow", "extended actions"],
    sources: [
      "components/ixi-machine-card/private/IXIOwnedPrivateListingRuntime.js",
      "components/ixi-machine-card/private/PrivateListingCard.js",
    ],
    use: "Expose only the actions valid for the machine, viewer and current environment.",
  },
  {
    id: "faces",
    index: "06",
    code: "IXI-OBJ-FACES",
    name: "Machine Faces",
    short: "Multiple working views, one object",
    layer: "STRUCTURE",
    status: "PRODUCTION",
    version: "1.0",
    introduced: "2026-09-06",
    purpose:
      "Let one machine carry several views without opening disconnected pages.",
    benefit:
      "Details, relationships and workflows stay spatially anchored to the same machine.",
    specs: [
      "Face state",
      "Rail-driven flip",
      "Marketplace four-face production set",
      "Object console compatibility",
    ],
    inputs: ["machineFace", "card family", "presentation"],
    outputs: [
      "photo face",
      "buyer decision face",
      "deal sheet face",
      "network entry face",
    ],
    sources: [
      "components/ixi-machine-card/marketplace/MarketplaceListingCard.js",
      "components/ixi-private-object/IXIPrivateObjectConsole.jsx",
    ],
    use: "Use when the operator needs depth without losing object identity or board position.",
  },
  {
    id: "rail",
    index: "07",
    code: "IXI-MC-RAIL",
    name: "IXI Machine Rail",
    short: "Seven-zone card control strip",
    layer: "COMMANDS",
    status: "PRODUCTION",
    version: "1.0",
    introduced: "2026-09-06",
    purpose:
      "Control card depth, relationship styling, face state and object movement directly from the machine.",
    benefit:
      "Dense controls stay available without consuming the face or becoming a floating toolbar.",
    specs: [
      "01 Forward",
      "02 Relationship color",
      "03 Relationship strength",
      "04 Flip card",
      "05 Send machine",
      "06 Sync to armed destination",
      "07 Backward",
    ],
    inputs: [
      "selected card",
      "relationship style",
      "armedDestination",
      "railMode",
    ],
    outputs: ["z-order", "color", "strength", "face", "send", "sync"],
    sources: [
      "components/IXIMachineRail.js",
      "components/ixi-object-system/IXIObjectRail.jsx",
    ],
    use: "Use for spatial and movement commands that belong to the machine itself.",
  },
  {
    id: "console",
    index: "08",
    code: "IXI-OBJ-CON",
    name: "Console Coupling",
    short: "Machine opens its working system",
    layer: "COMMANDS",
    status: "PRODUCTION",
    version: "1.0",
    introduced: "2026-09-06",
    purpose:
      "Connect the selected machine to marketplace, private or AOS console operations.",
    benefit:
      "The machine becomes actionable—inspect, route, relate and operate—without abandoning the board.",
    specs: [
      "Context router",
      "Marketplace console",
      "Private console",
      "AOS runtime",
      "Adjacent working surface",
    ],
    inputs: [
      "selected machine",
      "board context",
      "permissions",
      "console slot",
    ],
    outputs: [
      "Object Console",
      "working faces",
      "relationship tools",
      "workflow actions",
    ],
    sources: [
      "components/ixi-marketplace/IXIBrowseObjectConsoleRouter.jsx",
      "components/ixi-machine-object/IXIMarketplaceObjectConsole.jsx",
      "components/ixi-aos/console-runtime/",
    ],
    use: "Use when selection must become a focused operating session.",
  },
  {
    id: "gearbox",
    index: "09",
    code: "IXI-OBJ-GEAR",
    name: "Card Gearbox",
    short: "Seven object speeds, one size control",
    layer: "COMMANDS",
    status: "PRODUCTION",
    version: "1.0",
    introduced: "2026-09-09",
    purpose:
      "Scale the complete machine object from a large inspection view to a compact multi-object operating view.",
    benefit:
      "The operator controls information density without changing the machine, its face or its working state.",
    specs: [
      "Gear 1 is largest",
      "Gear 7 is smallest",
      "Plus shifts larger",
      "Minus shifts smaller",
      "Console depth can trigger a safe automatic downshift",
    ],
    inputs: ["gear 1–7", "console depth", "object family", "native geometry"],
    outputs: ["scaled shell width", "scaled shell height", "preserved object state"],
    sources: [
      "components/ixi-machine-object/IXIScaledCardShell.js",
      "lib/ixiObjectGeometry.js",
      "components/ixi-chassis/IXIScaleEngine.js",
    ],
    use: "Use to match object size to the current inspection or operating workload.",
  },
];

export function getAtlasPart(id) {
  return machineCardParts.find((part) => part.id === id) || machineCardParts[0];
}
