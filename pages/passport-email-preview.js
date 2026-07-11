// /pages/passport-email-preview.js

import buildPassportPresentation from "../lib/passport/buildPassportPresentation";
import renderPassportEmailHtml from "../lib/passport/email/renderPassportEmailHtml";

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

export default function PassportEmailPreviewPage() {
  const presentation = buildPassportPresentation({
    listing: TEST_LISTING
  });

  const email = renderPassportEmailHtml({
    presentation,
    baseUrl: "https://preview.ironxchange.com"
  });

  return (
    <main
      style={{
        minHeight: "100vh",
        margin: 0,
        padding: "28px",
        background: "#080808",
        color: "#ffffff",
        fontFamily: "Arial, sans-serif"
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto"
        }}
      >
        <div
          style={{
            marginBottom: "16px",
            color: "#FFC400",
            fontSize: "11px",
            fontWeight: 900,
            letterSpacing: "0.16em"
          }}
        >
          PASSPORT EMAIL HTML PREVIEW
        </div>

        <div
          style={{
            marginBottom: "12px",
            color: "#999999",
            fontSize: "13px"
          }}
        >
          Subject: {email.subject}
        </div>

        <iframe
          title="Passport Email Preview"
          srcDoc={email.html}
          style={{
            display: "block",
            width: "100%",
            minHeight: "1200px",
            border: "1px solid #2a2a2a",
            borderRadius: "12px",
            background: "#090909"
          }}
        />
      </div>
    </main>
  );
}
