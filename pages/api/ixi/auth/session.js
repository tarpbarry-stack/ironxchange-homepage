const REGION = process.env.IXI_COGNITO_REGION || "us-east-2";
const CLIENT_ID = process.env.IXI_COGNITO_CLIENT_ID || "2aetbus1ine9jk8hc3qr9a7i0e";
const COOKIE_NAME = "ixi_cognito_access_token";

function clean(value) {
  return String(value ?? "").trim();
}

function cookie(value, maxAge) {
  return [
    `${COOKIE_NAME}=${encodeURIComponent(value || "")}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    process.env.NODE_ENV === "production" ? "Secure" : "",
    `Max-Age=${Math.max(0, Number(maxAge || 0))}`
  ].filter(Boolean).join("; ");
}

function sameOrigin(req) {
  const origin = clean(req?.headers?.origin);
  if (!origin) return true;
  const proto = clean(req?.headers?.["x-forwarded-proto"]).split(",")[0] || "https";
  const forwardedHost = clean(req?.headers?.["x-forwarded-host"]).split(",")[0];
  const host = forwardedHost || clean(req?.headers?.host);
  return Boolean(host && origin === `${proto}://${host}`);
}

export default async function handler(req, res) {
  if (req.method === "GET") {
    const authenticated = String(req.headers.cookie || "").includes(`${COOKIE_NAME}=`);
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({ ok: true, authenticated });
  }

  if (!sameOrigin(req)) {
    return res.status(403).json({
      ok: false,
      error: {
        code: "IXI_AUTH_ORIGIN_DENIED",
        message: "Cross-origin authentication request denied."
      }
    });
  }

  if (req.method === "DELETE") {
    res.setHeader("Set-Cookie", cookie("", 0));
    return res.status(200).json({ ok: true, authenticated: false });
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST, DELETE");
    return res.status(405).json({
      ok: false,
      error: {
        code: "METHOD_NOT_ALLOWED",
        message: "GET, POST, or DELETE required."
      }
    });
  }

  const username = clean(req.body?.username || req.body?.email);
  const password = String(req.body?.password || "");

  if (!username || !password) {
    return res.status(400).json({
      ok: false,
      error: {
        code: "IXI_CREDENTIALS_REQUIRED",
        message: "Email and password are required."
      }
    });
  }

  try {
    const response = await fetch(`https://cognito-idp.${REGION}.amazonaws.com/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-amz-json-1.1",
        "X-Amz-Target": "AWSCognitoIdentityProviderService.InitiateAuth"
      },
      body: JSON.stringify({
        AuthFlow: "USER_PASSWORD_AUTH",
        ClientId: CLIENT_ID,
        AuthParameters: {
          USERNAME: username,
          PASSWORD: password
        }
      })
    });

    const payload = await response.json().catch(() => ({}));
    const accessToken = clean(payload?.AuthenticationResult?.AccessToken);
    const expiresIn = Number(payload?.AuthenticationResult?.ExpiresIn || 3600);

    if (!response.ok || !accessToken) {
      return res.status(401).json({
        ok: false,
        error: {
          code: clean(payload?.__type) || "IXI_LOGIN_FAILED",
          message: clean(payload?.message) || "IXI authentication failed."
        }
      });
    }

    res.setHeader("Set-Cookie", cookie(accessToken, expiresIn));
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({
      ok: true,
      authenticated: true,
      expiresIn
    });
  } catch {
    return res.status(502).json({
      ok: false,
      error: {
        code: "IXI_COGNITO_UNAVAILABLE",
        message: "IXI authentication service is unavailable."
      }
    });
  }
}
