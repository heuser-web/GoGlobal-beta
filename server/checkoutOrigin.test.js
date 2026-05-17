import assert from "node:assert/strict";
import test from "node:test";
import { normalizeOrigin, resolveCheckoutOrigin } from "./checkoutOrigin.js";

function mockReq(headers = {}, protocol = "https") {
  const normalized = Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value])
  );
  return {
    protocol,
    get(name) {
      return normalized[String(name).toLowerCase()];
    },
  };
}

test("normalizeOrigin accepts only http and https origins", () => {
  assert.equal(normalizeOrigin("https://app.example.com/path?x=1"), "https://app.example.com");
  assert.equal(normalizeOrigin("javascript:alert(1)"), null);
  assert.equal(normalizeOrigin("not a url"), null);
});

test("resolveCheckoutOrigin uses configured app origin first", () => {
  const previous = process.env.GOGLOBAL_APP_URL;
  process.env.GOGLOBAL_APP_URL = "https://goglobal.example.com/app";
  try {
    const req = mockReq({ origin: "https://evil.example", host: "api.example.com" });
    assert.equal(resolveCheckoutOrigin(req), "https://goglobal.example.com");
  } finally {
    if (previous === undefined) delete process.env.GOGLOBAL_APP_URL;
    else process.env.GOGLOBAL_APP_URL = previous;
  }
});

test("resolveCheckoutOrigin rejects a cross-origin production caller", () => {
  const previousNodeEnv = process.env.NODE_ENV;
  delete process.env.GOGLOBAL_APP_URL;
  process.env.NODE_ENV = "production";
  try {
    const req = mockReq({
      origin: "https://evil.example",
      host: "goglobal.example.com",
      "x-forwarded-proto": "https",
    });
    assert.equal(resolveCheckoutOrigin(req), "https://goglobal.example.com");
  } finally {
    if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousNodeEnv;
  }
});

test("resolveCheckoutOrigin keeps localhost development checkout working", () => {
  const previousNodeEnv = process.env.NODE_ENV;
  delete process.env.GOGLOBAL_APP_URL;
  process.env.NODE_ENV = "development";
  try {
    const req = mockReq({ origin: "http://localhost:3000", host: "localhost:3002" }, "http");
    assert.equal(resolveCheckoutOrigin(req), "http://localhost:3000");
  } finally {
    if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousNodeEnv;
  }
});
