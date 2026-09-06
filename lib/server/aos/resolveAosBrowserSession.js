import * as SharetribeSdkModule from "sharetribe-flex-sdk";

function clean(value) {
  return String(value ?? "").trim();
}

function getSharetribeSdk() {
  /*
   * sharetribe-flex-sdk is published as CommonJS. Next.js can expose
   * that module differently between browser bundles and serverless
   * runtime chunks. Normalize both shapes instead of assuming a
   * synthetic default export exists.
   */
  const candidate =
    SharetribeSdkModule?.default ||
    SharetribeSdkModule;

  if (
    !candidate ||
    typeof candidate.createInstance !== "function" ||
    typeof candidate?.tokenStore?.expressCookieStore !== "function"
  ) {
    const error = new Error(
      "Sharetribe server SDK did not expose the required cookie token-store API."
    );
    error.code = "AOS_BROWSER_SHARETRIBE_SDK_INVALID";
    error.status = 503;
    throw error;
  }

  return candidate;
}

function appendSetCookie(res, value) {
  const current = res.getHeader("Set-Cookie");
  const next = Array.isArray(current)
    ? [...current, value]
    : current
      ? [String(current), value]
      : [value];

  res.setHeader("Set-Cookie", next);
}

function serializeCookie(name, value, options = {}) {
  const parts = [
    `${encodeURIComponent(name)}=${encodeURIComponent(String(value ?? ""))}`
  ];

  if (options.maxAge !== undefined) {
    parts.push(`Max-Age=${Math.floor(Number(options.maxAge) / 1000)}`);
  }

  if (options.domain) {
    parts.push(`Domain=${options.domain}`);
  }

  parts.push(`Path=${options.path || "/"}`);

  if (options.expires) {
    const expires =
      options.expires instanceof Date
        ? options.expires
        : new Date(options.expires);

    if (!Number.isNaN(expires.getTime())) {
      parts.push(`Expires=${expires.toUTCString()}`);
    }
  }

  if (options.httpOnly) {
    parts.push("HttpOnly");
  }

  if (options.secure) {
    parts.push("Secure");
  }

  const sameSite =
    typeof options.sameSite === "string"
      ? options.sameSite
      : options.sameSite === true
        ? "Strict"
        : "";

  if (sameSite) {
    parts.push(`SameSite=${sameSite}`);
  }

  return parts.join("; ");
}

function createResponseCookieAdapter(res) {
  return {
    cookie(name, value, options = {}) {
      appendSetCookie(
        res,
        serializeCookie(name, value, options)
      );

      return this;
    },

    clearCookie(name, options = {}) {
      appendSetCookie(
        res,
        serializeCookie(
          name,
          "",
          {
            ...options,
            expires: new Date(0),
            maxAge: 0
          }
        )
      );

      return this;
    }
  };
}

function getCurrentUserId(currentUser = {}) {
  return clean(
    currentUser?.id?.uuid ||
    currentUser?.id
  );
}

function getEntityDisplayName(currentUser = {}) {
  const profile =
    currentUser?.attributes?.profile ||
    currentUser?.profile ||
    {};

  const publicData =
    profile?.publicData || {};

  const protectedData =
    profile?.protectedData || {};

  return (
    clean(publicData.companyName) ||
    clean(publicData.company) ||
    clean(protectedData.companyName) ||
    clean(profile.displayName) ||
    clean(currentUser?.attributes?.email) ||
    "IXI Entity"
  );
}

export async function resolveAosBrowserSession(req, res) {
  const clientId =
    clean(
      process.env.NEXT_PUBLIC_SHARETRIBE_CLIENT_ID
    );

  if (!clientId) {
    const error = new Error(
      "Sharetribe browser authentication is not configured."
    );

    error.code = "AOS_BROWSER_AUTH_NOT_CONFIGURED";
    error.status = 503;
    throw error;
  }

  const SharetribeSdk =
    getSharetribeSdk();

  /*
   * Sharetribe's browser SDK stores the user session in its
   * client-id-scoped cookie store. The supported server-side
   * counterpart is expressCookieStore using the SAME clientId.
   *
   * A fresh SDK instance is created for every HTTP request so
   * sessions can never bleed between users.
   */
  const tokenStore =
    SharetribeSdk.tokenStore.expressCookieStore({
      clientId,
      req,
      res: createResponseCookieAdapter(res),
      secure:
        process.env.NODE_ENV === "production"
    });

  const sdk =
    SharetribeSdk.createInstance({
      clientId,
      tokenStore
    });

  const authInfo =
    await sdk.authInfo();

  if (
    !authInfo ||
    authInfo.isAnonymous !== false
  ) {
    const error = new Error(
      "Authenticated IXI user session is required."
    );

    error.code = "AOS_BROWSER_AUTH_REQUIRED";
    error.status = 401;
    throw error;
  }

  let response;

  try {
    response =
      await sdk.currentUser.show({
        include: ["profileImage"]
      });
  } catch (cause) {
    const error = new Error(
      "IXI could not verify the current Sharetribe user session."
    );

    error.code = "AOS_BROWSER_AUTH_VERIFY_FAILED";
    error.status = 401;
    error.cause = cause;
    throw error;
  }

  const currentUser =
    response?.data?.data || null;

  const userId =
    getCurrentUserId(currentUser);

  if (!userId) {
    const error = new Error(
      "Authenticated Sharetribe session returned no user identity."
    );

    error.code = "AOS_BROWSER_USER_ID_MISSING";
    error.status = 401;
    throw error;
  }

  return {
    authenticated: true,
    userId,
    sdk,
    currentUser,
    included:
      Array.isArray(response?.data?.included)
        ? response.data.included
        : [],
    displayName:
      getEntityDisplayName(currentUser),
    authInfo
  };
}

export default resolveAosBrowserSession;
