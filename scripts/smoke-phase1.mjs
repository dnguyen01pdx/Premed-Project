import { chromium } from "playwright";

const BASE = "http://localhost:3100";
const errors = [];

async function main() {
  const browser = await chromium.launch({
    executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.setDefaultTimeout(8000);
  page.setDefaultNavigationTimeout(20000);
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(`console.error: ${msg.text()}`);
  });
  page.on("response", (res) => {
    if (res.status() >= 400) errors.push(`http ${res.status()}: ${res.url()}`);
  });

  // Quick pages
  for (const path of ["/contact", "/about", "/account"]) {
    await page.goto(BASE + path, { waitUntil: "load" });
    console.log(path, "->", await page.title());
  }

  // Turn on Pro preview
  await page.goto(BASE + "/account", { waitUntil: "load" });
  const checkbox = page.locator('input[type="checkbox"]');
  await checkbox.check();
  await page.waitForTimeout(200);
  console.log("Pro checkbox checked:", await checkbox.isChecked());

  // Secondaries: add two schools, add essays with matching type, verify tabs
  await page.goto(BASE + "/secondaries", { waitUntil: "load" });
  await page.fill("#tracker-search", "Alabama");
  await page.waitForTimeout(400);
  const firstResult = page.locator('#tracker-search ~ ul button').first();
  await firstResult.click();
  await page.waitForTimeout(300);

  await page.fill("#tracker-search", "Michigan");
  await page.waitForTimeout(400);
  const secondResult = page.locator('#tracker-search ~ ul button').first();
  await secondResult.click();
  await page.waitForTimeout(300);

  // Expand first school's essays and add one manually. Scoped to each
  // <article> card so a label changing from "Essays (0)" to "Hide essays"
  // after the first click can't shift a shared locator's indices.
  const cards = page.locator("article");
  const cardCount = await cards.count();
  console.log("school cards:", cardCount);
  if (cardCount >= 2) {
    const card0 = cards.nth(0);
    await card0.getByRole("button", { name: /Essays \(/ }).click();
    await page.waitForTimeout(200);
    await card0
      .getByPlaceholder("Paste or describe another essay prompt")
      .fill("Describe a challenge you overcame and what you learned.");
    await card0.getByPlaceholder("Paste or describe another essay prompt").press("Enter");
    await page.waitForTimeout(300);

    const card1 = cards.nth(1);
    await card1.getByRole("button", { name: /Essays \(/ }).click();
    await page.waitForTimeout(200);
    await card1
      .getByPlaceholder("Paste or describe another essay prompt")
      .fill("Tell us about a time you faced adversity.");
    await card1.getByPlaceholder("Paste or describe another essay prompt").press("Enter");
    await page.waitForTimeout(300);
  }

  // Open draft/tags panel on card1's essay specifically (cards sort
  // alphabetically by school name, not by add order) and mention the OTHER
  // tracked school by name, so the safety check has something real to catch.
  const targetCard = cards.nth(1);
  const draftToggle = targetCard.getByRole("button", { name: /Add details|^Details$/ });
  if (await draftToggle.count()) {
    await draftToggle.click();
    await page.waitForTimeout(200);
    await targetCard.locator("textarea").fill("This is my draft answer about overcoming a challenge, and why I'd thrive at Central Michigan specifically.");
    await targetCard.getByPlaceholder("Free clinic, Research, Music").fill("Free clinic, Research");
    await page.waitForTimeout(300);
  }

  // Click into Essay Map tab
  await page.locator('button[role="tab"]:has-text("Essay Map")').click();
  await page.waitForTimeout(400);
  const mapVisible = await page.locator("text=core essays").first().isVisible().catch(() => false);
  console.log("Essay Map header visible:", mapVisible);

  // Run the safety check if present
  const checkBtn = page.locator('button:has-text("Check for other school names")').first();
  if (await checkBtn.count()) {
    await checkBtn.click();
    await page.waitForTimeout(200);
    const flagged = await page.locator("text=Possible school-name error").first().isVisible().catch(() => false);
    console.log("Safety check flagged Northwestern mention:", flagged);
  } else {
    console.log("No safety-check button found (draft may not be attached to a grouped essay)");
  }

  await page.screenshot({ path: "/tmp/shots/essay-map.png", fullPage: true });

  // What overlaps tab too
  await page.locator('button[role="tab"]:has-text("What overlaps")').click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: "/tmp/shots/overlap-tab.png", fullPage: true });

  await browser.close();

  console.log("\n--- errors ---");
  console.log(errors.length ? errors.join("\n") : "none");
  if (errors.length) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
