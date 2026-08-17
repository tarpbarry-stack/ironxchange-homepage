const clean = value => String(value ?? "").trim();

const COOKIE_NAMES = Object.freeze([
  "ixi_cognito_access_token",
  "ixi_access_token"
]);

function parseCookies(cookieHeader = "") {
  return String(cookieHeader || "")
    .split(";")
    .map(part => part.trim())
    .filter(Boolean)
    .reduce((cookies, part) => {
      const separator = part.indexOf("=");
      if (separator < 0) return cookies;
      const key = decodeURIComponent(part.slice(0, separator).trim());
      const value = decodeURIComponent(part.slice(separator + 1).trim());
      cookies[key] = value;
      return cookies;
    }, {});
}

function getIXIAccessToken(req) {
  const cookies = parseCookies(req?.headers?.cookie || "");
  for (const name of COOKIE_NAMES) {
    const token = clean(cookies[name]);
    if (token) return token;
  }
  return "";
}

function getIXICoreBaseUrl() {
  return clean(
    process.env.IXI_CORE_INTERNAL_URL ||
    process.env.IXI_CORE_URL ||
    "http://127.0.0.1:4100"
  ).replace(/\/+$/, "");
}

function requestOrigin(req) {
  return clean(req?.headers?.origin);
}

function expectedOrigin(req) {
  const forwardedProto = clean(req?.headers?.["x-forwarded-proto"]).split(",")[0] || "https";
  const forwardedHost = clean(req?.headers?.["x-forwarded-host"]).split(",")[0];
  const host = forwardedHost || clean(req?.headers?.host);
  return host ? `${forwardedProto}://${host}` : "";
}

function mutationOriginIsValid(req) {
  const method = clean(req?.method).toUpperCase();
  if (["GET", "HEAD", "OPTIONS"].includes(method)) return true;
  const origin = requestOrigin(req);
  if (!origin) return true;
  const expected = expectedOrigin(req);
  return Boolean(expected && origin === expected);
}

async function proxyIXIAuthorityRequest({ req, res, path, method = "GET", body }) {
  if (!mutationOriginIsValid(req)) {
    return res.status(403).json({
      ok: false,
      error: {
        code: "IXI_AUTHORITY_ORIGIN_DENIED",
        message: "Cross-origin Authority mutation denied."
      }
    });
  }

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

  try {
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
    let payload;
    try {
      payload = text ? JSON.parse(text) : null;
    } catch {
      payload = {
        ok: false,
        error: {
          code: "IXI_AUTHORITY_BAD_UPSTREAM_RESPONSE",
          message: "IX-Core returned a non-JSON Authority response."
        }
      };
    }

    return res.status(upstream.status).json(payload);
  } catch {
    return res.status(502).json({
      ok: false,
      error: {
        code: "IXI_AUTHORITY_UPSTREAM_UNAVAILABLE",
        message: "IXI Authority service is unavailable."
      }
    });
  }
}

module.exports = {
  parseCookies,
  getIXIAccessToken,
  getIXICoreBaseUrl,
  mutationOriginIsValid,
  proxyIXIAuthorityRequest
};
