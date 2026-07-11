// /pages/api/passport/test-send.js

import {
  SESv2Client,
  SendEmailCommand
} from "@aws-sdk/client-sesv2";

import {
  buildPassportPresentation
} from "../../../lib/passport/buildPassportPresentation";

import renderPassportEmailHtml from "../../../lib/passport/email/renderPassportEmailHtml";

const TEST_LISTING = {
  attributes: {
    title: "2020 DEERE 872GP",

    description:
      "Clean 872GP motor grader with Topcon components, good tires, cold air, and job-ready condition.",

    publicData: {
      passportId: "IXIWQMZWAE",

      passportUrl:
        "https://preview.ironxchange.com/p/IXIWQMZWAE",

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
        "https://sharetribe.imgix.net/6992ef66-9ac6-4a5a-b4a1-59b1652b1c4f/6a395a42-3040-45af-a441-50aa1e74d14a?auto=format&fit=clip&h=750&w=750&s=f285ae22a5324766575122a7b48c6b42",

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

function createSesClient() {
  return new SESv2Client({
    region: process.env.AWS_REGION || "us-east-2",

    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
      secretAccessKey:
        process.env.AWS_SECRET_ACCESS_KEY || ""
    }
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      error: "Method not allowed. Use POST."
    });
  }

  const to = String(req.body?.to || "").trim();

  if (!to || !to.includes("@")) {
    return res.status(400).json({
      ok: false,
      error: "A valid recipient email address is required."
    });
  }

  const fromEmail = String(
    process.env.SES_FROM_EMAIL || ""
  ).trim();

  if (!fromEmail) {
    return res.status(500).json({
      ok: false,
      error: "SES_FROM_EMAIL is not configured in Vercel."
    });
  }

  if (
    !process.env.AWS_ACCESS_KEY_ID ||
    !process.env.AWS_SECRET_ACCESS_KEY
  ) {
    return res.status(500).json({
      ok: false,
      error: "AWS SES credentials are not configured in Vercel."
    });
  }

  try {
    const presentation = buildPassportPresentation({
      listing: TEST_LISTING,
      baseUrl: "https://preview.ironxchange.com"
    });

    const email = renderPassportEmailHtml({
      presentation,
      baseUrl: "https://preview.ironxchange.com"
    });

    const ses = createSesClient();

    const command = new SendEmailCommand({
      FromEmailAddress:
        `IXI Machine Passport <${fromEmail}>`,

      Destination: {
        ToAddresses: [to]
      },

      ReplyToAddresses: [fromEmail],

      Content: {
        Simple: {
          Subject: {
            Data: email.subject,
            Charset: "UTF-8"
          },

          Body: {
            Html: {
              Data: email.html,
              Charset: "UTF-8"
            },

            Text: {
              Data: email.text,
              Charset: "UTF-8"
            }
          }
        }
      }
    });

    const result = await ses.send(command);

    return res.status(200).json({
      ok: true,
      messageId: result.MessageId || "",
      to,
      subject: email.subject
    });
  } catch (error) {
    console.error("PASSPORT TEST SEND FAILED:", error);

    return res.status(500).json({
      ok: false,
      error:
        error?.message ||
        "IXI Machine Passport email failed to send.",
      name: error?.name || ""
    });
  }
}
