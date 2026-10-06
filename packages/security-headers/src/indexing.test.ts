import { describe, expect, it } from "vitest";
import { isIndexableHost, NOINDEX_HEADER } from "./indexing";

// ---------------------------------------------------------------------------
// This decides whether a host is allowed into Google. Getting it wrong in one
// direction de-indexes the live shop; getting it wrong in the other publishes
// a staging environment. The test that matters most is the LAST one: anything
// unrecognised must come back false, because the whole point of an allowlist
// over a denylist is that a host nobody anticipated fails closed.
// ---------------------------------------------------------------------------

describe("isIndexableHost", () => {
  it("allows the live site, apex and www", () => {
    expect(isIndexableHost("mediary.com")).toBe(true);
    expect(isIndexableHost("www.mediary.com")).toBe(true);
  });

  it("ignores case and a port, which a Host header may carry either way", () => {
    expect(isIndexableHost("MEDIARY.COM")).toBe(true);
    expect(isIndexableHost("mediary.com:443")).toBe(true);
    expect(isIndexableHost("  mediary.com  ")).toBe(true);
  });

  it("refuses the internal host this was written for", () => {
    expect(isIndexableHost("app.mediary.com")).toBe(false);
  });

  it("refuses every other REACHABLE environment", () => {
    expect(isIndexableHost("admin.mediary.com")).toBe(false);
    expect(isIndexableHost("mediary.vercel.app")).toBe(false);
    expect(isIndexableHost("mediary-git-main-acme.vercel.app")).toBe(false);
  });

  // LOOPBACK IS EXEMPT, and these two used to assert the opposite. A crawler
  // that fetches `localhost` reaches its own machine, so there was never an
  // indexing risk here to guard against — only a permanently failing
  // `is-crawlable` audit on every local Lighthouse run, which is how a check
  // that can never pass teaches people to stop reading it.
  it("allows loopback, which no crawler can reach", () => {
    expect(isIndexableHost("localhost:3000")).toBe(true);
    expect(isIndexableHost("127.0.0.1:3000")).toBe(true);
    expect(isIndexableHost("[::1]:3000")).toBe(true);
  });

  // Every app in this repo runs on its own `*.localhost` name so the session
  // cookie is scoped per app — see docs/local-hostnames.md.
  it("allows the .localhost names the dev scripts use", () => {
    expect(isIndexableHost("shop.localhost:3000")).toBe(true);
    expect(isIndexableHost("admin.localhost:3001")).toBe(true);
  });

  // A tunnel rewrites the Host header to its own public name, so this is what
  // an exposed dev server actually arrives as — and it is still refused.
  it("still refuses a tunnelled dev server", () => {
    expect(isIndexableHost("a1b2c3.ngrok.app")).toBe(false);
    expect(isIndexableHost("shop.trycloudflare.com")).toBe(false);
  });

  // A subdomain match written as `endsWith("mediary.com")` would say yes to the
  // first of these, and a lookalike domain would slip past a loose check.
  it("is not fooled by a name that merely ends with the live one", () => {
    expect(isIndexableHost("staging.mediary.com")).toBe(false);
    expect(isIndexableHost("notmediary.com")).toBe(false);
    expect(isIndexableHost("mediary.com.evil.test")).toBe(false);
    // The loopback exemption is a suffix match on `.localhost`, so the same
    // trick must not work in the other direction either.
    expect(isIndexableHost("localhost.evil.test")).toBe(false);
    expect(isIndexableHost("notlocalhost")).toBe(false);
  });

  it("refuses a missing host rather than assuming the live one", () => {
    expect(isIndexableHost(null)).toBe(false);
    expect(isIndexableHost(undefined)).toBe(false);
    expect(isIndexableHost("")).toBe(false);
  });
});

describe("NOINDEX_HEADER", () => {
  // `nofollow` as well as `noindex`: without it a crawler that reaches a
  // staging host stays out of the index but still walks the whole site.
  it("says both noindex and nofollow", () => {
    expect(NOINDEX_HEADER.key).toBe("X-Robots-Tag");
    expect(NOINDEX_HEADER.value).toContain("noindex");
    expect(NOINDEX_HEADER.value).toContain("nofollow");
  });
});
