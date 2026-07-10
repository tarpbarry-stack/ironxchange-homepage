// /pages/passport-preview.js

import buildPassportPresentation from "../lib/passport/buildPassportPresentation";

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
      <div
        style={{
          maxWidth: "1000px",
          margin: "0 auto"
        }}
      >
        <div
          style={{
            color: "#ffc400",
            fontSize: "12px",
            fontWeight: "800",
            letterSpacing: "0.14em",
            marginBottom: "10px"
          }}
        >
          PASSPORT PRESENTATION ENGINE TEST
        </div>

        <h1
          style={{
            margin: "0 0 24px",
            fontSize: "36px"
          }}
        >
          {presentation.title}
        </h1>

        <pre
          style={{
            whiteSpace: "pre-wrap",
            overflowWrap: "anywhere",
            background: "#111111",
            border: "1px solid #333333",
            borderRadius: "10px",
            padding: "24px",
            fontSize: "14px",
            lineHeight: "1.6"
          }}
        >
          {JSON.stringify(presentation, null, 2)}
        </pre>
      </div>
    </main>
  );
}
