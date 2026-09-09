function clean(value) {
  return String(value ?? "").trim();
}

export function getSafeIXILoginReturnTarget(search = "") {
  const params = new URLSearchParams(clean(search).replace(/^\?/, ""));
  const candidate = clean(params.get("returnTo") || params.get("next") || "/");

  if (
    !candidate.startsWith("/") ||
    candidate.startsWith("//") ||
    candidate.includes("\\") ||
    /[\u0000-\u001f\u007f]/u.test(candidate)
  ) {
    return "/";
  }

  return candidate;
}

