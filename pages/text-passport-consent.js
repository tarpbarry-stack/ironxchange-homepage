import Head from "next/head";

import PassportEmailDialog from "../components/passport/PassportEmailDialog";

export default function TextPassportConsentPage() {
  return (
    <>
      <Head>
        <title>Text Passport Consent | IronXchange</title>
        <meta name="robots" content="noindex,nofollow" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main aria-label="IronXchange Text Passport consent demonstration">
        <PassportEmailDialog
          open
          onClose={() => {}}
          listingId="text-passport-consent"
          passportId="IXI3VNDCGV"
          title="2019 CATERPILLAR 420F2"
          initialChannel="text"
          textDeliveryEnabled={false}
        />
      </main>
      <style jsx>{`
        main {
          min-height: 100vh;
          background: #080908;
        }
      `}</style>
    </>
  );
}
