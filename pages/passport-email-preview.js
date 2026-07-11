// /pages/passport-email-preview.js

import buildPassportPresentation from "../lib/passport/buildPassportPresentation";
import renderPassportEmailHtml from "../lib/passport/email/renderPassportEmailHtml";

const TEST_LISTING = {
  attributes: {
    title: "2020 JOHN DEERE 872GP",
    description:
      "Clean 872GP motor grader with Topcon components, good tires, cold air, and job-ready condition.",

   publicData: {
  passportId: "IXIWQMZWAE",
  passportUrl: "https://preview.ironxchange.com/p/IXIWQMZWAE",

  year: "2020",
  make: "DEERE",
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

sellerLogo:
  "PASTE_THE_REAL_COMMERCIAL_CREDIT_GROUP_LOGO_URL_HERE",
  
    photoUrls: [
  "https://sharetribe.imgix.net/6992ef66-9ac6-4a5a-b4a1-59b1652b1c4f/6a507b9c-353a-45d2-bb91-4096af1efe67?auto=format&fit=clip&h=750&w=750&s=15b56c74de2886f2aebd240de2b8cec8",

  "https://sharetribe.imgix.net/6992ef66-9ac6-4a5a-b4a1-59b1652b1c4f/6a507b9d-b6b2-4fdd-986b-dda7162e5135?auto=format&fit=clip&h=750&w=750&s=272961cccb1e65610384eddc41ed8d5e",

  "https://sharetribe.imgix.net/6992ef66-9ac6-4a5a-b4a1-59b1652b1c4f/6a507b9a-5b7e-42e5-94ca-9a74a9a7fe7d?auto=format&fit=clip&h=750&w=750&s=02029b5d1acc5e832c67289737cc15fa",

  "https://sharetribe.imgix.net/6992ef66-9ac6-4a5a-b4a1-59b1652b1c4f/6a507b98-acf6-47bf-9bea-b2cf577fee12?auto=format&fit=clip&h=750&w=750&s=c1e46ca4155123256de61e650584d220",

  "https://sharetribe.imgix.net/6992ef66-9ac6-4a5a-b4a1-59b1652b1c4f/6a507b9d-bb2d-4a5d-b549-f106851b051f?auto=format&fit=clip&h=750&w=750&s=47757339cfe305a5bac147d5193e91df"     
]
      
    }
  }
};

export default function PassportEmailPreviewPage() {
  const presentation = buildPassportPresentation({
    listing: TEST_LISTING
  });
console.log(presentation);
  
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
