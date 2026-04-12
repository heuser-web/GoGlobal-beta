// GoGlobal Image Service — AOT (Ahead-Of-Time) persistence
//
// Instead of generating images in the browser (slow, exposes API key),
// this calls the local Express server which:
//   1. Checks if the image is already on disk → returns URL instantly
//   2. Otherwise calls Gemini, saves the JPEG, returns the permanent URL
//
// The returned URL is a normal https://.../image.jpg — loads from CDN/disk
// with no generation delay after the first request.

const CACHE_PREFIX = "gg_url_v2_";

function cacheKey(prompt) {
  let hash = 0;
  for (let i = 0; i < prompt.length; i++) {
    hash = ((hash << 5) - hash + prompt.charCodeAt(i)) | 0;
  }
  return CACHE_PREFIX + Math.abs(hash).toString(36);
}

export async function generateImage(prompt) {
  if (!prompt) return null;

  const key = cacheKey(prompt);

  // Session cache: store the URL string (tiny, not base64 blob)
  try {
    const cached = sessionStorage.getItem(key);
    if (cached) return cached;
  } catch (_) {}

  try {
    const res = await fetch(`/api/image?prompt=${encodeURIComponent(prompt)}`);
    if (!res.ok) return null;

    const { url } = await res.json();
    if (!url) return null;

    // Cache the URL in sessionStorage for instant repeat access
    try {
      sessionStorage.setItem(key, url);
    } catch (_) {}

    return url;
  } catch (err) {
    // Server not running or network error — silent fallback to gradient
    return null;
  }
}
