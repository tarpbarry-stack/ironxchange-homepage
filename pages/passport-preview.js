// /pages/passport-preview.js

import buildPassportPresentation from "../lib/passport/buildPassportPresentation";

import PassportPresentationCard from "../components/passport/PassportPresentationCard";

const TEST_LISTING = {
  attributes: {
    title: "2020 JOHN DEERE 872GP",
    description:
      "Clean 872GP motor grader with Topcon components, good tires, cold air, and job-ready condition.",

    publicData: {
      passportId: "IXIA8D72FK",

      year: "2020",
      make: "JOHN DEERE",
      model: "872GP",

      hours: "3994",
      price: "169500",
      location: "Wichita Falls, TX",

      serialNumber: "819062",
      stockNumber: "BM1339",

      sellerName: "Commercial Credit Group",
      sellerLocation: "Charlotte, NC",
      sellerPhone: "704-555-0100",
      sellerEmail: "sales@example.com",

      photoUrls: [
        "https://placehold.co/1200x800?text=Hero+Photo",
        "https://placehold.co/600x400?text=Photo+2",
        "https://placehold.co/600x400?text=Photo+3",
        "https://placehold.co/600x400?text=Photo+4",
        "https://placehold.co/600x400?text=Photo+5"
      ]
    }
  }
};

export default function PassportPreviewPage() {
  const presentation = buildPassportPresentation({
    listing: TEST_LISTING
  });

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#080808",
        color: "#ffffff",
        padding: "40px",
        fontFamily: "Arial, sans-serif"
      }}
    >
     
<PassportPresentationCard
  presentation={presentation}
/>
    </main>
  );
}
