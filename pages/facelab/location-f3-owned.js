import Head from "next/head";
import Link from "next/link";

import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import IXIAosLocationFace3OwnedV12 from "../../components/ixi-aos/cards/location/IXIAosLocationFace3OwnedV12";
import IXIFaceLabScaledCard from "../../components/ixi-face-studio/IXIFaceLabScaledCard";

const SAMPLE_OBJECT = Object.freeze({
  objectId: "facelab-location-f3-owned",
  entityId: "aos-card-preview-entity",
  objectType: "customer-defined-container",
  singularLabel: "LOCATION",
  pluralLabel: "LOCATIONS",
  displayName: "DFW AIRPORT YARD",
  status: "active",
  currency: "USD",
  capabilities: {
    canContain: true,
    canCreate: true,
    canTransact: true,
    editable: true,
    hasConsole: true,
    hasRail: true,
    hasRelationships: true
  },
  fields: {
    ownershipStatus: "OWNED",
    ownershipType: "FEE SIMPLE",
    acquiredDate: "MAR 12, 2018",
    propertyOwnerName: "IRONXCHANGE HOLDINGS LLC",
    propertyOwnerRole: "JOHN CARTER",
    propertyOwnerPhone: "432-555-0186",
    propertyOwnerEmail: "john.carter@ironxchange.com",
    propertyManagerName: "JOHN CARTER",
    propertyManagerRole: "YARD MANAGER",
    propertyManagerPhone: "432-555-0186",
    propertyManagerEmail: "yard@ironxchange.com",
    propertyType: "INDUSTRIAL",
    parcelAssetId: "IXI-2400-DFW",
    propertyAddress: "2400 AVIATION DRIVE · DFW AIRPORT, TX 75261",
    landArea: "8.42 ACRES",
    buildingArea: "42,600 SQ FT",
    yearBuilt: "2005",
    zoning: "INDUSTRIAL",
    taxId: "22-3456789",
    taxAuthority: "DALLAS COUNTY",
    taxYear: "2025",
    assessedValue: "$8,750,000",
    taxRate: "2.135%",
    notes: "Primary yard for DFW region."
  },
  relationships: [
    { id: "owned-rel-1", displayLabel: "BUDGET", displayName: "FY2026" },
    { id: "owned-rel-2", displayLabel: "INSURANCE", displayName: "POLICY" },
    { id: "owned-rel-3", displayLabel: "TAX RECORD", displayName: "2025" },
    { id: "owned-rel-4", displayLabel: "UTILITY ACCOUNTS", displayName: "5 ACCOUNTS" },
    { id: "owned-rel-5", displayLabel: "MAINTENANCE PLAN", displayName: "DFW-YARD-MP" }
  ],
  media: []
});

const SAMPLE_FINANCIAL = Object.freeze({
  landValue: 2750000,
  improvementValue: 6000000,
  totalAppraisedValue: 8750000,
  currentValue: 8750000,
  lastAppraised: "AUG 12, 2024",
  electricCost: 4250,
  waterCost: 1150,
  sewerCost: 980,
  naturalGasCost: 2100,
  internetPhoneCost: 350,
  wasteTrashCost: 420,
  propertyTaxCost: 2980,
  insuranceCost: 1450,
  otherOperatingCost: 450,
  totalMonthlyOperatingCost: 13680,
  totalRevenueYtd: 2130450,
  totalExpensesYtd: 1073200,
  netIncomeYtd: 1057250,
  capRate: 7.85,
  roiYtd: 12.42,
  occupancy: 78,
  grossMargin: 49.6,
  annualBudget: 2450000,
  ytdBudget: 1225000,
  ytdActual: 1073200,
  budgetVariance: -151800
});

export default function LocationF3OwnedFaceLabPage() {
  return (
    <>
      <Head><title>IXI Face Lab · Location F3 Owned</title></Head>
      <Navbar />
      <main className="f3-lab">
        <div className="toolbar">
          <div><span>IXI FACE LAB</span><strong>LOCATION F3 · OWNED</strong></div>
          <nav><Link href="/facelab/location-f3-leased">OPEN LEASED</Link><Link href="/facelab">BACK TO FACE LAB</Link></nav>
        </div>
        <section className="stage">
          <IXIFaceLabScaledCard surfaceLabel="Face Lab Location F3">
            <IXIAosLocationFace3OwnedV12 object={SAMPLE_OBJECT} ixiState={{}} financialSnapshot={SAMPLE_FINANCIAL} runtimeData={SAMPLE_FINANCIAL} skinId="v12" onIxiStateChange={() => {}} onSaveObject={async () => {}} onAddObject={() => {}} onOpenTransact={() => {}} onRecall={() => {}} onBoard={() => {}} onReturn={() => {}} />
          </IXIFaceLabScaledCard>
        </section>
      </main>
      <Footer />
      <style jsx>{`
        .f3-lab{min-height:calc(100vh - 160px);padding:18px;background:#0b0b0b}
        .toolbar{min-height:52px;display:flex;align-items:center;justify-content:space-between;gap:18px;padding:8px 14px;border:1px solid rgba(255,255,255,.08);border-radius:10px;background:#121212}
        .toolbar div{display:flex;flex-direction:column;gap:4px}.toolbar span{color:#ffc400;font-size:8px;font-weight:950;letter-spacing:.08em}.toolbar strong{color:#eee;font-size:11px;font-weight:950}
        .toolbar nav{display:flex;gap:8px}.toolbar :global(a){height:28px;display:inline-flex;align-items:center;padding:0 11px;border:1px solid rgba(255,196,0,.28);border-radius:5px;background:rgba(255,196,0,.07);color:#ffc400;font-size:7px;font-weight:950;text-decoration:none}
        .stage{min-height:650px;display:flex;flex-direction:column;align-items:center;gap:12px;padding:42px 20px 80px}
      `}</style>
    </>
  );
}
