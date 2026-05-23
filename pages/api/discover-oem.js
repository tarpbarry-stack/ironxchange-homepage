const oemTargets = [
  {
    company: "HOLT CAT",
    website: "https://www.holtcat.com",
    category: "CAT Dealer",
    state: "TX"
  },
  {
    company: "Warren CAT",
    website: "https://www.warrencat.com",
    category: "CAT Dealer",
    state: "TX"
  },
  {
    company: "Mustang CAT",
    website: "https://www.mustangcat.com",
    category: "CAT Dealer",
    state: "TX"
  },
  {
    company: "Kirby-Smith Machinery",
    website: "https://www.kirby-smith.com",
    category: "Komatsu / Heavy Equipment Dealer",
    state: "OK"
  },
  {
    company: "RDO Equipment",
    website: "https://www.rdoequipment.com",
    category: "John Deere Dealer",
    state: "US"
  },
  {
    company: "Doggett Equipment Services",
    website: "https://www.doggettequipment.com",
    category: "John Deere / Heavy Equipment Dealer",
    state: "TX"
  },
  {
    company: "ASCO Equipment",
    website: "https://www.ascoeq.com",
    category: "CASE / Volvo / Heavy Equipment Dealer",
    state: "TX"
  },
  {
    company: "ROMCO Equipment",
    website: "https://www.romco.com",
    category: "Volvo / Heavy Equipment Dealer",
    state: "TX"
  },
  {
    company: "BD Holt",
    website: "https://www.bdholt.com",
    category: "Equipment Dealer",
    state: "TX"
  },
  {
    company: "Bobcat of Dallas",
    website: "https://www.bobcatofdallas.com",
    category: "Bobcat / Compact Equipment Dealer",
    state: "TX"
  },
  {
    company: "CLM Equipment",
    website: "https://www.clmequipment.com",
    category: "Heavy Equipment Dealer",
    state: "TX"
  },
  {
    company: "Cisco Equipment",
    website: "https://www.ciscoequipment.com",
    category: "Heavy Equipment / Rental Dealer",
    state: "TX"
  },
  {
    company: "Four Seasons Equipment",
    website: "https://www.fourseasonsequip.com",
    category: "Heavy Equipment Dealer",
    state: "TX"
  },
  {
    company: "Associated Supply Company",
    website: "https://www.ascoeq.com",
    category: "Heavy Equipment Dealer",
    state: "TX"
  },
  {
    company: "Yellowhouse Machinery",
    website: "https://www.yellowhouse.us",
    category: "John Deere Dealer",
    state: "TX"
  }
];

function normalizeTarget(target) {
  return {
    company: target.company,
    website: target.website,
    category: target.category,
    state: target.state || "US"
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      message: "Method not allowed"
    });
  }

  const targets = oemTargets.map(normalizeTarget);

  return res.status(200).json({
    success: true,
    message: `Prepared ${targets.length} OEM/dealer discovery targets.`,
    targets
  });
}
