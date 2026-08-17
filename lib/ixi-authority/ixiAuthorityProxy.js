const clean = value => String(value ?? "").trim();

function parseCookies(cookieHeader = "") {
  return String(cookieHeader || "")
    .split(";")
    .map(part => part.trim())
    .filter(Boolean)
    .reduce((accumulator, part) => {
      const separator = part.indexOf("=");
      if (separator < 0) return accumulator;
      const key = decodeURIComponent(part.slice(0, separator).trim());
      const value = decodeURIComponent(part.slice(separator + 1).trim());
      accumulator[key] = value;
      return accumulator;
    }, {});
}

function getIXIAccessToken(req) {
  const cookies = parseCookies(req?.headers?.cookie || "");

  return clean(
    cookies.ixi_cognito_access_token ||
    cookies.ixi_access_token ||
    ""
  );
}

function getIXICoreBaseUrl() {
  return clean(
    process.env.IXI_CORE_INTERNAL_URL ||
    process.env.IXI_CORE_URL ||
    "http://127.0.0.1:4100"
  ).replace(/\/+$/, "");
}

async function proxyIXIAuthorityRequest({
  req,
  res,
  path,
  method = "GET",
  body
}) {
  const accessToken = getIXIAccessToken(req);

  if (!accessToken) {
    return res.status(401).json({
      ok: false,
      error: {
        code: "IXI_AUTHENTICATION_REQUIRED",
        message: "IXI authenticated session is required."
      }
    });
  }

  const upstream = await fetch(`${getIXICoreBaseUrl()}${path}`, {
    method,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...(body === undefined ? {} : { "Content-Type": "application/json" })
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) })
  });

  const text = await upstream.text();
  let payload = null;

  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = {
      ok: false,
      error: {
        code: "IXI_AUTHORITY_BAD_UPSTREAM_RESPONSE",
        message: "IXI Core returned a non-JSON response."
      }
    };
  }

  return res.status(upstream.status).json(payload);
}

module.exports = {
  parseCookies,
  getIXIAccessToken,
  getIXICoreBaseUrl,
  proxyIXIAuthorityRequest
};
