const DEV_LOCALHOST_RE = /^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/;

export function normalizeOrigin(value) {
  if (!value) return null;
  try {
    const url = new URL(String(value).trim());
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.origin;
  } catch {
    return null;
  }
}

function configuredCheckoutOrigin() {
  return normalizeOrigin(
    process.env.GOGLOBAL_APP_URL ||
    process.env.PUBLIC_APP_URL ||
    process.env.SITE_URL ||
    process.env.RENDER_EXTERNAL_URL
  );
}

function requestBaseOrigin(req) {
  const host = req.get("x-forwarded-host") || req.get("host");
  if (!host) return null;
  const proto = String(req.get("x-forwarded-proto") || req.protocol || "http")
    .split(",")[0]
    .trim();
  return normalizeOrigin(`${proto}://${host}`);
}

export function resolveCheckoutOrigin(req) {
  const configured = configuredCheckoutOrigin();
  if (configured) return configured;

  const requestBase = requestBaseOrigin(req);
  const supplied = normalizeOrigin(req.get("origin"));
  if (supplied && supplied === requestBase) return supplied;

  if (process.env.NODE_ENV !== "production" && supplied && DEV_LOCALHOST_RE.test(supplied)) {
    return supplied;
  }

  return requestBase || "http://localhost:3000";
}
