import { describe, expect, it } from "vitest";
import { crawlerName } from "./crawlers";

describe("crawlerName", () => {
  it("names the crawlers the site wants indexed and previewed by", () => {
    expect(
      crawlerName(
        "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
      ),
    ).toBe("googlebot");
    expect(
      crawlerName(
        "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)",
      ),
    ).toBe("bingbot");
    expect(crawlerName("WhatsApp/2.23.20.0")).toBe("whatsapp");
  });

  it("treats an ordinary browser, and no header at all, as not a crawler", () => {
    expect(
      crawlerName(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 Version/17.5 Mobile/15E148 Safari/604.1",
      ),
    ).toBeNull();
    expect(crawlerName(null)).toBeNull();
    expect(crawlerName("")).toBeNull();
  });

  it("matches whole words only, so a name inside another word is not a crawler", () => {
    expect(crawlerName("notgooglebotreally")).toBeNull();
  });
});
