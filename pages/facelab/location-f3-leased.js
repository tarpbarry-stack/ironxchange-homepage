import Head from "next/head";
import Link from "next/link";

import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import IXIAosLocationFace3LeasedV12 from "../../components/ixi-aos/cards/location/IXIAosLocationFace3LeasedV12";
import IXIFaceLabScaledCard from "../../components/ixi-face-studio/IXIFaceLabScaledCard";

const SAMPLE_OBJECT = Object.freeze({
  objectId: "facelab-location-f3-leased",
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
    ownershipStatus: "LEASED",
    ownershipType: "OPERATING LEASE",
    leaseStartDate: "MAR 12, 2023",
    leaseEndDate: "MAR 11, 2028",
    renewalOption: "1 – 5 YR OPTION",
    noticeRequired: "180 DAYS",
    securityDeposit: "$75,000",
    leaseUse: "INDUSTRIAL YARD",

    landlordName: "DFW INDUSTRIAL HOLDINGS LLC",
    landlordRole: "JOHN MILLER",
    landlordPhone: "214-555-0186",
    landlordEmail: "yard@ironxchange.com",

    leasingContactName: "SARAH JOHNSON",
    leasingContactRole: "LEASING MANAGER",
    leasingContactPhone: "214-555-0199",
    leasingContactEmail: "sarah.johnson@dfwind.com",

    leaseType: "NNN (TRIPLE NET)",
    notes: "Triple Net lease. Tenant responsible for utilities, insurance and property tax."
  },
  relationships: [
    { id: "lease-rel-1", displayLabel: "LEASE AGREEMENT", displayName: "LEASE-DFW-2400" },
    { id: "lease-rel-2", displayLabel: "INSURANCE POLICY", displayName: "POL-DFW-2400" },
    { id: "lease-rel-3", displayLabel: "UTILITY ACCOUNTS", displayName: "5 ACCOUNTS" },
    { id: "lease-rel-4", displayLabel: "LANDLORD CONTACT", displayName: "JOHN MILLER" },
    { id: "lease-rel-5", displayLabel: "RENEWAL REMINDER", displayName: "NOV 11, 2027" }
  ],
  media: [],
  metadata: {
    nomenclature: {
      singular: "LOCATION",
      plural: "LOCATIONS"
    }
  }
});

const SAMPLE_FINANCIAL = Object.freeze({
  baseRentMonthly: 18750,
  baseRentAnnual: 225000,
  rentEscalation: 3,
  escalationType: "ANNUAL",
  nextEscalation: "MAR 12, 2026",

  camOpexMonthly: 4250,
  propertyTaxPassThrough: 2980,
  insurancePassThrough: 1450,
  otherNnnMonthly: 1000,
  totalMonthlyOccupancyCost: 28430,

  totalRentYtd: 168750,
  totalPassThroughYtd: 90660,
  totalOccupancyCostYtd: 259410,

  electricCost: 4250,
  waterCost: 1150,
  sewerCost: 980,
  naturalGasCost: 2100,
  internetPhoneCost: 350,
  wasteTrashCost: 420,
  otherOperatingCost: 500,
  totalMonthlyOperatingCost: 9750
});

export default function LocationF3LeasedFaceLabPage() {
  return (
    <>
      <Head>
        <title>IXI Face Lab · Location F3 Leased</title>
      </Head>

      <Navbar />

      <main className="leased-face-lab">
        <div className="lab-toolbar">
          <div>
            <span>IXI FACE LAB</span>
            <strong>LOCATION F3 · LEASED / RENTAL</strong>
          </div>
          <Link href="/facelab">← BACK TO FACE LAB</Link>
        </div>

        <section className="preview-stage">
          <IXIFaceLabScaledCard surfaceLabel="Face Lab Location F3">
            <IXIAosLocationFace3LeasedV12
              object={SAMPLE_OBJECT}
              ixiState={{}}
              financialSnapshot={SAMPLE_FINANCIAL}
              runtimeData={SAMPLE_FINANCIAL}
              skinId="v12"
              onIxiStateChange={() => {}}
              onSaveObject={async () => {}}
              onAddObject={() => {}}
              onOpenTransact={() => {}}
              onRecall={() => {}}
              onBoard={() => {}}
              onReturn={() => {}}
            />
          </IXIFaceLabScaledCard>
        </section>
      </main>

      <Footer />

      <style jsx>{`
        .leased-face-lab {
          min-height: calc(100vh - 160px);
          padding: 18px;
          background:
            radial-gradient(circle at top, rgba(255,196,0,.05), transparent 42%),
            linear-gradient(180deg, rgba(255,255,255,.018), rgba(255,255,255,0)),
            #0b0b0b;
        }
        .lab-toolbar {
          min-height: 48px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          padding: 8px 14px;
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 10px;
          background: #121212;
        }
        .lab-toolbar div {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .lab-toolbar span {
          color: #ffc400;
          font-size: 8px;
          font-weight: 950;
          letter-spacing: .08em;
        }
        .lab-toolbar strong {
          color: rgba(255,255,255,.84);
          font-size: 11px;
          font-weight: 950;
        }
        .lab-toolbar :global(a) {
          flex: 0 0 auto;
          height: 26px;
          display: inline-flex;
          align-items: center;
          padding: 0 10px;
          border: 1px solid rgba(255,196,0,.24);
          border-radius: 5px;
          background: rgba(255,196,0,.06);
          color: #ffc400;
          font-size: 7px;
          font-weight: 950;
          text-decoration: none;
        }
        .preview-stage {
          min-height: 620px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding: 42px 20px 80px;
        }
      `}</style>
    </>
  );
}
