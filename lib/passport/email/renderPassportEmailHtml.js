// /lib/passport/email/renderPassportEmailHtml.js

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function absoluteUrl(value = "", baseUrl = "") {
  const input = String(value || "").trim();

  if (!input) return "";

  if (
    input.startsWith("https://") ||
    input.startsWith("http://") ||
    input.startsWith("data:")
  ) {
    return input;
  }

  const cleanBase = String(baseUrl || "").replace(/\/+$/, "");
  const cleanPath = input.startsWith("/") ? input : `/${input}`;

  return `${cleanBase}${cleanPath}`;
}

function formatHours(value = "") {
  const numeric = Number(
    String(value || "")
      .replace(/,/g, "")
      .replace(/[^\d.]/g, "")
  );

  if (!Number.isFinite(numeric)) {
    return String(value || "—");
  }

  return `${Math.round(numeric).toLocaleString("en-US")} Hrs`;
}

function buildPhotoCell({
  src,
  href,
  alt,
  width,
  height,
  borderRadius = 10
}) {
  if (!src) {
    return `
      <td
        width="${width}"
        height="${height}"
        style="
          width:${width}px;
          height:${height}px;
          background:#151515;
          border:1px solid #242424;
          border-radius:${borderRadius}px;
        "
      ></td>
    `;
  }

  return `
    <td
      width="${width}"
      height="${height}"
      style="
        width:${width}px;
        height:${height}px;
        padding:0;
        margin:0;
        background:#101010;
        border-radius:${borderRadius}px;
        overflow:hidden;
      "
    >
      <a
        href="${escapeHtml(href)}"
        target="_blank"
        style="
          display:block;
          width:${width}px;
          height:${height}px;
          text-decoration:none;
        "
      >
        <img
          src="${escapeHtml(src)}"
          width="${width}"
          height="${height}"
          alt="${escapeHtml(alt)}"
          style="
            display:block;
            width:${width}px;
            height:${height}px;
            max-width:${width}px;
            object-fit:cover;
            border:0;
            border-radius:${borderRadius}px;
          "
        />
      </a>
    </td>
  `;

}

function buildMobilePhotoGrid({
  photos = [],
  href = "",
  title = ""
}) {
  const cells = [0, 1, 2, 3].map(index => {
    const src = photos[index] || "";

    if (!src) {
      return `
        <td
          width="50%"
          valign="top"
          style="
            width:50%;
            padding:${index % 2 === 0 ? "0 4px 8px 0" : "0 0 8px 4px"};
          "
        >
          <div
            style="
              width:100%;
              min-height:110px;
              background:#151515;
              border:1px solid #242424;
              border-radius:10px;
            "
          ></div>
        </td>
      `;
    }

    return `
      <td
        width="50%"
        valign="top"
        style="
          width:50%;
          padding:${index % 2 === 0 ? "0 4px 8px 0" : "0 0 8px 4px"};
        "
      >
        <a
          href="${escapeHtml(href)}"
          target="_blank"
          style="
            display:block;
            width:100%;
            text-decoration:none;
          "
        >
          <img
            src="${escapeHtml(src)}"
            alt="${escapeHtml(`${title} photo ${index + 2}`)}"
            style="
              display:block;
              width:100%;
              height:auto;
              border:0;
              border-radius:10px;
              background:#101010;
            "
          />
        </a>
      </td>
    `;
  });

  return `
    <table
      role="presentation"
      width="100%"
      cellspacing="0"
      cellpadding="0"
      border="0"
      style="width:100%;"
    >
      <tr>
        ${cells[0]}
        ${cells[1]}
      </tr>
      <tr>
        ${cells[2]}
        ${cells[3]}
      </tr>
    </table>
  `;
}

export default function renderPassportEmailHtml({
  presentation = {},
  baseUrl = "https://preview.ironxchange.com"
} = {}) {
  const {
    passportId = "",
    passportUrl = "",
    title = "",
    heroPhoto = "",
    gallery = [],
    supportingPhotos = [],
    price = "",
    hours = "",
    location = "",
    serialNumber = "",
    stockNumber = "",
    description = "",
    seller = {}
  } = presentation;

  const resolvedPassportUrl =
    absoluteUrl(passportUrl, baseUrl) ||
    `${String(baseUrl).replace(/\/+$/, "")}/p/${encodeURIComponent(passportId)}`;

  const resolvedHero = absoluteUrl(
    heroPhoto || gallery?.[0] || "",
    baseUrl
  );

  const photoCandidates = [
    ...supportingPhotos,
    ...gallery.slice(1)
  ]
    .filter(Boolean)
    .map(photo => absoluteUrl(photo, baseUrl));

  const supporting = Array.from(
    new Set(photoCandidates)
  ).slice(0, 4);

  const sellerLogo = absoluteUrl(
    seller.logo || seller.logoUrl || "",
    baseUrl
  );

  const sellerName =
    seller.name ||
    seller.company ||
    seller.companyName ||
    "IronXchange Seller";

  const sellerLocation =
    seller.location ||
    seller.city ||
    "";

  const sellerPhone =
    seller.phone ||
    seller.phoneNumber ||
    "";

  const sellerEmail =
    seller.email ||
    "";

  const safeTitle = escapeHtml(title || "Machine Passport");
  const safePrice = escapeHtml(price || "Call for Price");
  const safeHours = escapeHtml(formatHours(hours));
  const safeLocation = escapeHtml(location || "—");
  const safeSerial = escapeHtml(serialNumber || "—");
  const safeStock = escapeHtml(stockNumber || "—");
  const safeDescription = escapeHtml(description || "");
  const safePassportId = escapeHtml(passportId || "");
  const safeSellerName = escapeHtml(sellerName);
  const safeSellerLocation = escapeHtml(sellerLocation);
  const safeSellerPhone = escapeHtml(sellerPhone);
  const safeSellerEmail = escapeHtml(sellerEmail);

  const emailWidth = 760;
  const contentWidth = 728;
  const heroWidth = 566;
  const railWidth = 150;
  const heroHeight = 432;
  const thumbHeight = 102;

  const railRows = [0, 1, 2, 3]
    .map(index => {
      const photo = supporting[index] || "";

      return `
        <tr>
          ${buildPhotoCell({
            src: photo,
            href: resolvedPassportUrl,
            alt: `${title} photo ${index + 2}`,
            width: railWidth,
            height: thumbHeight,
            borderRadius: 10
          })}
        </tr>
        ${
          index < 3
            ? `<tr><td height="8" style="height:8px;font-size:0;line-height:0;">&nbsp;</td></tr>`
            : ""
        }
      `;
    })
    .join("");

  const mobilePhotoGrid = buildMobilePhotoGrid({
    photos: supporting,
    href: resolvedPassportUrl,
    title
  });

  const sellerLogoHtml = sellerLogo
    ? `
      <td
        width="170"
        valign="middle"
        style="
          width:170px;
          padding:0 20px 0 0;
        "
      >
        <img
          src="${escapeHtml(sellerLogo)}"
          width="150"
          alt="${safeSellerName}"
          style="
            display:block;
            width:150px;
            max-width:150px;
            max-height:72px;
            object-fit:contain;
            border:0;
          "
        />
      </td>
    `
    : "";

  const phoneHtml = sellerPhone
    ? `
      <div style="margin-top:5px;">
        <a
          href="tel:${escapeHtml(sellerPhone)}"
          style="
            color:#d8d8d8;
            text-decoration:none;
            font-size:13px;
            line-height:20px;
          "
        >
          ${safeSellerPhone}
        </a>
      </div>
    `
    : "";

  const emailHtml = sellerEmail
    ? `
      <div style="margin-top:2px;">
        <a
          href="mailto:${escapeHtml(sellerEmail)}"
          style="
            color:#d8d8d8;
            text-decoration:none;
            font-size:13px;
            line-height:20px;
          "
        >
          ${safeSellerEmail}
        </a>
      </div>
    `
    : "";

  const subject = title
    ? `${title} | IXI Machine Passport${passportId ? ` ${passportId}` : ""}`
    : `IXI Machine Passport${passportId ? ` ${passportId}` : ""}`;

  const html = `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1"
    />
    <meta
      name="x-apple-disable-message-reformatting"
    />
    <title>${safeTitle}</title>

    <style>
      .ixi-mobile-title,
      .ixi-mobile-photo-grid {
        display: none;
        max-height: 0;
        overflow: hidden;
        mso-hide: all;
      }

      @media only screen and (max-width: 700px) {
        .ixi-desktop-photo-table {
          width: 100% !important;
          max-width: 100% !important;
          table-layout: auto !important;
        }

        .ixi-desktop-hero-cell {
          display: block !important;
          width: 100% !important;
          max-width: 100% !important;
          padding: 0 !important;
        }

        .ixi-desktop-hero-link {
          display: block !important;
          width: 100% !important;
          height: auto !important;
        }

        .ixi-desktop-hero-image {
          display: block !important;
          width: 100% !important;
          max-width: 100% !important;
          height: auto !important;
        }

        .ixi-desktop-rail-cell {
          display: none !important;
          width: 0 !important;
          max-width: 0 !important;
          height: 0 !important;
          overflow: hidden !important;
          mso-hide: all !important;
        }

        .ixi-mobile-photo-grid {
          display: table !important;
          width: 100% !important;
          max-height: none !important;
          overflow: visible !important;
          mso-hide: none !important;
          margin-top: 8px !important;
        }
      }

      @media only screen and (max-width: 480px) {
        .ixi-desktop-title {
          display: none !important;
          max-height: 0 !important;
          overflow: hidden !important;
          mso-hide: all !important;
        }

        .ixi-mobile-title {
          display: table !important;
          width: 100% !important;
          max-height: none !important;
          overflow: visible !important;
          mso-hide: none !important;
        }

        .ixi-mobile-title-name {
          display: block !important;
          width: 100% !important;
          padding: 0 0 5px !important;
          color: #f2f2f2 !important;
          font-size: 25px !important;
          font-weight: 900 !important;
          line-height: 28px !important;
          letter-spacing: -0.7px !important;
          text-align: left !important;
          text-transform: uppercase !important;
        }

        .ixi-mobile-hours,
        .ixi-mobile-price {
          font-size: 16px !important;
          line-height: 20px !important;
          white-space: nowrap !important;
        }

        .ixi-mobile-hours {
          color: #8f8f8f !important;
          text-align: left !important;
        }

        .ixi-mobile-price {
          color: #f2f2f2 !important;
          font-weight: 900 !important;
          text-align: right !important;
        }
      }
    </style>
  </head>

  <body
    style="
      margin:0;
      padding:0;
      background:#090909;
      color:#d6d6d6;
      font-family:Arial, Helvetica, sans-serif;
      -webkit-text-size-adjust:100%;
      -ms-text-size-adjust:100%;
    "
  >
    <table
      role="presentation"
      width="100%"
      cellspacing="0"
      cellpadding="0"
      border="0"
      style="
        width:100%;
        margin:0;
        padding:0;
        background:#090909;
      "
    >
      <tr>
        <td
          align="center"
          style="
            padding:24px 10px;
          "
        >
          <table
            role="presentation"
            width="${emailWidth}"
            cellspacing="0"
            cellpadding="0"
            border="0"
            style="
              width:${emailWidth}px;
              max-width:100%;
              background:#101010;
              border:1px solid #222222;
              border-radius:18px;
              border-collapse:separate;
              overflow:hidden;
            "
          >
            <tr>
              <td
                style="
                  padding:18px 16px 0;
                "
              >
               <table
  class="ixi-desktop-title"
  role="presentation"
  width="100%"
  cellspacing="0"
  cellpadding="0"
  border="0"
>
  <tr>
    <td
      valign="bottom"
      style="
        padding:0 12px 12px 0;
        border-bottom:1px solid #252525;
      "
    >
      <a
        href="${escapeHtml(resolvedPassportUrl)}"
        target="_blank"
        style="
          color:#f2f2f2;
          text-decoration:none;
        "
      >
        <div
          style="
            margin:0;
            color:#f2f2f2;
            font-size:34px;
            font-weight:900;
            line-height:36px;
            letter-spacing:-1px;
            text-transform:uppercase;
            white-space:nowrap;
          "
        >
          ${safeTitle}
        </div>
      </a>
    </td>

    <td
      width="120"
      align="center"
      valign="bottom"
      style="
        width:120px;
        padding:0 10px 13px;
        border-bottom:1px solid #252525;
        color:#8f8f8f;
        font-size:16px;
        font-weight:700;
        line-height:20px;
        white-space:nowrap;
      "
    >
      ${safeHours}
    </td>

    <td
      width="190"
      align="right"
      valign="bottom"
      style="
        width:190px;
        padding:0 0 12px 12px;
        border-bottom:1px solid #252525;
        color:#f2f2f2;
        font-size:30px;
        font-weight:900;
        line-height:32px;
        letter-spacing:-0.8px;
        white-space:nowrap;
      "
    >
      ${safePrice}
    </td>
  </tr>
</table>

                <table
                  class="ixi-mobile-title"
                  role="presentation"
                  width="100%"
                  cellspacing="0"
                  cellpadding="0"
                  border="0"
                >
                  <tr>
                    <td
                      colspan="2"
                      style="
                        padding:0 0 5px;
                        border-bottom:0;
                      "
                    >
                      <a
                        href="${escapeHtml(resolvedPassportUrl)}"
                        target="_blank"
                        style="
                          color:#f2f2f2;
                          text-decoration:none;
                        "
                      >
                        <div class="ixi-mobile-title-name">
                          ${safeTitle}
                        </div>
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td
                      class="ixi-mobile-hours"
                      width="50%"
                      style="
                        width:50%;
                        padding:0 6px 10px 0;
                        border-bottom:1px solid #252525;
                      "
                    >
                      ${safeHours}
                    </td>

                    <td
                      class="ixi-mobile-price"
                      width="50%"
                      align="right"
                      style="
                        width:50%;
                        padding:0 0 10px 6px;
                        border-bottom:1px solid #252525;
                      "
                    >
                      ${safePrice}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td
                style="
                  padding:10px 16px 0;
                "
              >
                <table
                  class="ixi-desktop-photo-table"
                  role="presentation"
                  width="${contentWidth}"
                  cellspacing="0"
                  cellpadding="0"
                  border="0"
                  style="
                    width:${contentWidth}px;
                    max-width:100%;
                    table-layout:fixed;
                  "
                >
                  <tr>
                    <td
                      class="ixi-desktop-hero-cell"
                      width="${heroWidth}"
                      valign="top"
                      style="
                        width:${heroWidth}px;
                        padding:0 12px 0 0;
                      "
                    >
                      ${
                        resolvedHero
                          ? `
                            <a
                              class="ixi-desktop-hero-link"
                              href="${escapeHtml(resolvedPassportUrl)}"
                              target="_blank"
                              style="
                                display:block;
                                width:${heroWidth}px;
                                height:${heroHeight}px;
                                text-decoration:none;
                              "
                            >
                              <img
                                class="ixi-desktop-hero-image"
                                src="${escapeHtml(resolvedHero)}"
                                width="${heroWidth}"
                                height="${heroHeight}"
                                alt="${safeTitle}"
                                style="
                                  display:block;
                                  width:${heroWidth}px;
                                  height:${heroHeight}px;
                                  max-width:${heroWidth}px;
                                  object-fit:cover;
                                  border:0;
                                  border-radius:12px;
                                  background:#151515;
                                "
                              />
                            </a>
                          `
                          : `
                            <div
                              style="
                                width:${heroWidth}px;
                                height:${heroHeight}px;
                                background:#151515;
                                border:1px solid #242424;
                                border-radius:12px;
                              "
                            ></div>
                          `
                      }
                    </td>

                    <td
                      class="ixi-desktop-rail-cell"
                      width="${railWidth}"
                      valign="top"
                      style="
                        width:${railWidth}px;
                        padding:0;
                      "
                    >
                      <table
                        role="presentation"
                        width="${railWidth}"
                        cellspacing="0"
                        cellpadding="0"
                        border="0"
                        style="
                          width:${railWidth}px;
                        "
                      >
                        ${railRows}
                      </table>
                    </td>
                  </tr>
                </table>

                <table
                  class="ixi-mobile-photo-grid"
                  role="presentation"
                  width="100%"
                  cellspacing="0"
                  cellpadding="0"
                  border="0"
                >
                  <tr>
                    <td style="padding:0;">
                      ${mobilePhotoGrid}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td
                style="
                  padding:10px 16px 0;
                "
              >
                <table
                  role="presentation"
                  width="100%"
                  cellspacing="0"
                  cellpadding="0"
                  border="0"
                  style="
                    width:100%;
                    background:#141414;
                    border:1px solid #252525;
                    border-radius:12px;
                  "
                >
                  <tr>
                    <td
                      style="
                        padding:15px 18px 12px;
                      "
                    >
                      <table
                        role="presentation"
                        width="100%"
                        cellspacing="0"
                        cellpadding="0"
                        border="0"
                      >
                        <tr>
                          <td
                            width="25%"
                            style="
                              padding:0 8px 10px 0;
                              border-bottom:1px solid #242424;
                              color:#f0f0f0;
                              font-size:10px;
                              font-weight:900;
                              letter-spacing:0.7px;
                              text-transform:uppercase;
                            "
                          >
                            Description
                          </td>

                          <td
                            width="25%"
                            align="center"
                            style="
                              padding:0 8px 10px;
                              border-bottom:1px solid #242424;
                              color:#f0f0f0;
                              font-size:10px;
                              font-weight:900;
                              letter-spacing:0.7px;
                              text-transform:uppercase;
                            "
                          >
                            Serial:
                            <span style="color:#929292;">
                              ${safeSerial}
                            </span>
                          </td>

                          <td
                            width="25%"
                            align="center"
                            style="
                              padding:0 8px 10px;
                              border-bottom:1px solid #242424;
                              color:#f0f0f0;
                              font-size:10px;
                              font-weight:900;
                              letter-spacing:0.7px;
                              text-transform:uppercase;
                            "
                          >
                            Stock:
                            <span style="color:#929292;">
                              ${safeStock}
                            </span>
                          </td>

                          <td
                            width="25%"
                            align="right"
                            style="
                              padding:0 0 10px 8px;
                              border-bottom:1px solid #242424;
                              color:#f0f0f0;
                              font-size:10px;
                              font-weight:900;
                              letter-spacing:0.7px;
                              text-transform:uppercase;
                            "
                          >
                            Loc:
                            <span style="color:#929292;">
                              ${safeLocation}
                            </span>
                          </td>
                        </tr>
                      </table>

                      <div
                        style="
                          padding-top:12px;
                          color:#b8b8b8;
                          font-size:14px;
                          font-weight:500;
                          line-height:22px;
                        "
                      >
                        ${safeDescription || "&nbsp;"}
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td
                style="
                  padding:8px 16px 0;
                "
              >
                <table
                  role="presentation"
                  width="100%"
                  cellspacing="0"
                  cellpadding="0"
                  border="0"
                  style="
                    width:100%;
                    background:#141414;
                    border:1px solid #252525;
                    border-radius:12px;
                  "
                >
                  <tr>
                    <td
                      style="
                        padding:16px 18px;
                      "
                    >
                      <table
                        role="presentation"
                        width="100%"
                        cellspacing="0"
                        cellpadding="0"
                        border="0"
                      >
                        <tr>
                          ${sellerLogoHtml}

                          <td valign="middle">
                            <div
                              style="
                                margin-bottom:7px;
                                color:#ffc400;
                                font-size:9px;
                                font-weight:900;
                                letter-spacing:0.75px;
                                text-transform:uppercase;
                              "
                            >
                              Presented By
                            </div>

                            <div
                              style="
                                color:#f2f2f2;
                                font-size:18px;
                                font-weight:900;
                                line-height:22px;
                              "
                            >
                              ${safeSellerName}
                            </div>

                            ${
                              sellerLocation
                                ? `
                                  <div
                                    style="
                                      margin-top:4px;
                                      color:#8e8e8e;
                                      font-size:11px;
                                      font-weight:800;
                                      line-height:16px;
                                      letter-spacing:0.45px;
                                      text-transform:uppercase;
                                    "
                                  >
                                    ${safeSellerLocation}
                                  </div>
                                `
                                : ""
                            }

                            ${phoneHtml}
                            ${emailHtml}
                          </td>

                          <td
                            width="170"
                            align="right"
                            valign="middle"
                            style="
                              width:170px;
                              padding-left:18px;
                            "
                          >
                            <a
                              href="${escapeHtml(resolvedPassportUrl)}"
                              target="_blank"
                              style="
                                display:inline-block;
                                min-width:145px;
                                padding:13px 16px;
                                background:#171717;
                                border:1px solid #5d4b12;
                                border-radius:9px;
                                color:#ffc400;
                                font-size:10px;
                                font-weight:900;
                                line-height:12px;
                                letter-spacing:0.65px;
                                text-align:center;
                                text-decoration:none;
                                text-transform:uppercase;
                              "
                            >
                              View Passport
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td
                style="
                  padding:12px 18px 16px;
                "
              >
                <table
                  role="presentation"
                  width="100%"
                  cellspacing="0"
                  cellpadding="0"
                  border="0"
                  style="
                    width:100%;
                    border-top:1px solid #242424;
                  "
                >
                  <tr>
                    <td
                      style="
                        padding-top:10px;
                        color:#777777;
                        font-size:9px;
                        font-weight:900;
                        line-height:14px;
                        letter-spacing:0.65px;
                        text-transform:uppercase;
                      "
                    >
                      IXI Machine Passport
                      ${
                        safePassportId
                          ? `
                            <span
                              style="
                                margin-left:12px;
                                color:#8b8b8b;
                              "
                            >
                              Passport: ${safePassportId}
                            </span>
                          `
                          : ""
                      }
                    </td>

                    <td
                      align="right"
                      style="
                        padding-top:10px;
                        color:#666666;
                        font-size:8px;
                        font-weight:900;
                        line-height:14px;
                        letter-spacing:0.6px;
                        text-transform:uppercase;
                      "
                    >
                      Powered by IronXchange
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
  `.trim();

  const text = [
    title || "Machine Passport",
    price || "",
    formatHours(hours),
    location || "",
    "",
    description || "",
    "",
    `Presented by ${sellerName}`,
    sellerPhone || "",
    sellerEmail || "",
    "",
    `View Passport: ${resolvedPassportUrl}`,
    passportId ? `Passport: ${passportId}` : ""
  ]
    .filter(Boolean)
    .join("\n");

  return {
    subject,
    html,
    text
  };
}
