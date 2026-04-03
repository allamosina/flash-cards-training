import { test, expect, type Page } from "@playwright/test";
import path from "path";
import fs from "fs";
import os from "os";
import { TEST_EMAIL, TEST_PASSWORD, TEST_NAME, AUTH_FILE } from "./global-setup";

const RUN_ID = Date.now();

const CSV_CONTENT = `question,answer
What is the capital of France?,Paris
What is 2 + 2?,4
What language does Next.js use?,TypeScript
Who wrote Hamlet?,Shakespeare
What does HTTP stand for?,HyperText Transfer Protocol
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Login the pre-created test user via the UI form */
async function loginTestUser(page: Page) {
  await page.goto("/login");
  await page.fill('input[name="email"]', TEST_EMAIL);
  await page.fill('input[name="password"]', TEST_PASSWORD);
  await Promise.all([
    page.waitForURL("/dashboard", { timeout: 12000 }),
    page.click('button[type="submit"]'),
  ]);
}

/** Creates an authenticated page from the saved auth storage state (no UI login) */
async function authedPage(browser: import("@playwright/test").Browser) {
  const ctx = await browser.newContext({ storageState: AUTH_FILE });
  const page = await ctx.newPage();
  return { ctx, page };
}

// ─── Auth Tests ────────────────────────────────────────────────────────────────

test.describe("Authentication", () => {
  test("R3 – duplicate email shows error", async ({ page }) => {
    await page.goto("/register");
    await page.fill('input[name="name"]', TEST_NAME);
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await expect(page.locator("text=Email already in use")).toBeVisible();
  });

  test("R2 – missing name fails browser validation", async ({ page }) => {
    await page.goto("/register");
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    const isValid = await page.$eval("form", (f: HTMLFormElement) => f.checkValidity());
    expect(isValid).toBe(false);
  });

  test("L1 – valid credentials redirects to dashboard", async ({ page }) => {
    await loginTestUser(page);
    await expect(page.locator("h1", { hasText: "My Decks" })).toBeVisible();
  });

  test("L2 – wrong password shows error", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', "wrongpass");
    await page.click('button[type="submit"]');
    await expect(page.locator("text=Invalid email or password")).toBeVisible();
  });

  test("S1 – unauthenticated /dashboard redirects to /login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("S2 – authenticated user visiting / redirects to /dashboard", async ({ browser }) => {
    const { ctx, page } = await authedPage(browser);
    await page.goto("/");
    await expect(page).toHaveURL("/dashboard");
    await ctx.close();
  });

  test("S3 – sign out clears session", async ({ browser }) => {
    const { ctx, page } = await authedPage(browser);
    await page.goto("/dashboard");
    await page.click("text=Sign out");
    await expect(page).toHaveURL(/\/login/, { timeout: 8000 });
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
    await ctx.close();
  });

  test("S4 – already-logged-in user visiting /login redirects to /dashboard", async ({
    browser,
  }) => {
    const { ctx, page } = await authedPage(browser);
    await page.goto("/login");
    await expect(page).toHaveURL("/dashboard");
    await ctx.close();
  });
});

// ─── Deck Management ──────────────────────────────────────────────────────────

test.describe("Deck Management", () => {
  let csvPath: string;

  test.beforeAll(async () => {
    csvPath = path.join(os.tmpdir(), `cards-${RUN_ID}.csv`);
    fs.writeFileSync(csvPath, CSV_CONTENT);
  });

  test.afterAll(() => {
    if (fs.existsSync(csvPath)) fs.unlinkSync(csvPath);
  });

  test("D1 – create deck with valid CSV", async ({ browser }) => {
    const { ctx, page } = await authedPage(browser);
    await page.goto("/decks/new");
    await page.fill('input[name="name"]', `Deck ${RUN_ID}`);
    await page.setInputFiles('input[type="file"]', csvPath);
    await page.click('button[type="submit"]');
    await page.waitForURL(
      (url) => url.pathname.startsWith("/decks/") && url.pathname !== "/decks/new",
      { timeout: 8000 }
    );
    await expect(page.locator("h1", { hasText: `Deck ${RUN_ID}` })).toBeVisible();
    await expect(page.locator("text=5 total")).toBeVisible();
    await ctx.close();
  });

  test("DL2 – deck appears on dashboard with stats", async ({ browser }) => {
    const { ctx, page } = await authedPage(browser);
    await page.goto("/dashboard");
    await expect(page.locator(`text=Deck ${RUN_ID}`).first()).toBeVisible();
    await expect(page.locator("text=5 cards").first()).toBeVisible();
    await ctx.close();
  });

  test("DD1 – clicking deck name navigates to detail; all cards unseen", async ({ browser }) => {
    const { ctx, page } = await authedPage(browser);
    await page.goto("/dashboard");
    await page.click(`text=Deck ${RUN_ID}`);
    await expect(page).toHaveURL(
      (url) => url.pathname.startsWith("/decks/") && url.pathname !== "/decks/new",
      { timeout: 8000 }
    );
    await expect(page.locator("td span", { hasText: /^Unseen$/ })).toHaveCount(5);
    await ctx.close();
  });

  test("D4 – empty CSV shows error", async ({ browser }) => {
    const emptyPath = path.join(os.tmpdir(), `empty-${RUN_ID}.csv`);
    fs.writeFileSync(emptyPath, "question,answer\n");
    const { ctx, page } = await authedPage(browser);
    await page.goto("/decks/new");
    await page.fill('input[name="name"]', "Bad Deck");
    await page.setInputFiles('input[type="file"]', emptyPath);
    await page.click('button[type="submit"]');
    await expect(page.locator("text=CSV has no valid rows")).toBeVisible();
    fs.unlinkSync(emptyPath);
    await ctx.close();
  });
});

// ─── Study Session ────────────────────────────────────────────────────────────

test.describe("Study Session", () => {
  let deckUrl: string;
  let studyCsv: string;

  test.beforeAll(async ({ browser }) => {
    studyCsv = path.join(os.tmpdir(), `study-${RUN_ID}.csv`);
    fs.writeFileSync(studyCsv, CSV_CONTENT);

    const { ctx, page } = await authedPage(browser);
    await page.goto("/decks/new");
    await page.fill('input[name="name"]', `Study ${RUN_ID}`);
    await page.setInputFiles('input[type="file"]', studyCsv);
    await page.click('button[type="submit"]');
    await page.waitForURL(
      (url) => url.pathname.startsWith("/decks/") && url.pathname !== "/decks/new",
      { timeout: 10000 }
    );
    deckUrl = page.url();
    await ctx.close();
    fs.unlinkSync(studyCsv);
  });

  test("ST1+ST2 – card shows question, flips to answer, buttons appear after flip", async ({
    browser,
  }) => {
    const { ctx, page } = await authedPage(browser);
    await page.goto(`${deckUrl}/study`);
    await expect(page.locator("text=Question")).toBeVisible({ timeout: 8000 });
    await expect(page.locator("button", { hasText: "Known" })).not.toBeVisible();
    await page.locator('[style*="perspective"]').click();
    // "Answer" label (exact) on the card back — must not match "Click to reveal answer" on the front
    await expect(page.locator('span', { hasText: /^Answer$/ })).toBeVisible();
    await expect(page.locator("button", { hasText: "Known" })).toBeVisible();
    await expect(page.locator("button", { hasText: "Hard" })).toBeVisible();
    await expect(page.locator("button", { hasText: "Not Sure" })).toBeVisible();
    await ctx.close();
  });

  test("ST6 – card counter shows Card 1 of 5", async ({ browser }) => {
    const { ctx, page } = await authedPage(browser);
    await page.goto(`${deckUrl}/study`);
    await expect(page.locator("text=Card 1 of 5")).toBeVisible({ timeout: 8000 });
    await ctx.close();
  });

  test("M1+SUM1 – mark all Known, see session-complete summary", async ({ browser }) => {
    const { ctx, page } = await authedPage(browser);
    await page.goto(`${deckUrl}/study`);
    await expect(page.locator("text=Card 1 of 5")).toBeVisible({ timeout: 8000 });

    for (let i = 0; i < 5; i++) {
      await expect(page.locator(`text=Card ${i + 1} of 5`)).toBeVisible({ timeout: 10000 });
      await page.locator('[style*="perspective"]').click();
      await expect(page.locator("button", { hasText: "Known" })).toBeVisible({ timeout: 5000 });
      await page.locator("button", { hasText: "Known" }).click();
      if (i < 4) {
        // After marking, wait for the NEXT card to appear (confirms API + state update completed)
        await expect(page.locator(`text=Card ${i + 2} of 5`)).toBeVisible({ timeout: 10000 });
      }
    }

    // All 5 marked Known → shows "All cards known!" (not "Session complete")
    await expect(page.locator("text=All cards known!")).toBeVisible({ timeout: 15000 });
    await expect(page.locator("button", { hasText: "Study Again" })).not.toBeVisible();
    await ctx.close();
  });

  test("M4 – E1: after all Known, study page shows 'All cards are known!'", async ({
    browser,
  }) => {
    const { ctx, page } = await authedPage(browser);
    await page.goto(`${deckUrl}/study`);
    await expect(page.locator("text=All cards are known!")).toBeVisible({ timeout: 8000 });
    await expect(page.locator("text=0 cards to study")).toBeVisible();
    await ctx.close();
  });

  test("E3 – reset progress restores all 5 cards", async ({ browser }) => {
    const { ctx, page } = await authedPage(browser);
    await page.goto(`${deckUrl}/study`);
    await expect(page.locator("text=All cards are known!")).toBeVisible({ timeout: 8000 });
    await page.click("text=Reset Progress");
    await expect(page.locator("text=5 cards to study")).toBeVisible({ timeout: 8000 });
    await ctx.close();
  });

  test("M2+M3+SUM3 – Hard+NotSure cards reappear; Known excluded", async ({ browser }) => {
    const { ctx, page } = await authedPage(browser);
    await page.goto(`${deckUrl}/study`);
    await expect(page.locator("text=Card 1 of 5")).toBeVisible({ timeout: 8000 });

    async function markCard(btn: string, expectedNextCard?: string) {
      await page.locator('[style*="perspective"]').click();
      await expect(page.locator("button", { hasText: btn })).toBeVisible({ timeout: 5000 });
      await page.locator("button", { hasText: btn }).click();
      if (expectedNextCard) {
        await expect(page.locator(`text=${expectedNextCard}`)).toBeVisible({ timeout: 10000 });
      }
    }

    // Card 1 → Hard, wait for card 2
    await expect(page.locator("text=Card 1 of 5")).toBeVisible({ timeout: 10000 });
    await markCard("Hard", "Card 2 of 5");
    // Card 2 → Not Sure, wait for card 3
    await markCard("Not Sure", "Card 3 of 5");
    // Card 3 → Known, wait for card 4
    await markCard("Known", "Card 4 of 5");
    // Card 4 → Known, wait for card 5
    await markCard("Known", "Card 5 of 5");
    // Card 5 → Known (last)
    await markCard("Known");

    await expect(page.locator("text=Session complete")).toBeVisible({ timeout: 8000 });
    await expect(page.locator("text=Study Again")).toBeVisible();
    await page.click("text=Study Again");
    await expect(page.locator("text=2 cards to study")).toBeVisible({ timeout: 8000 });
    await ctx.close();
  });

  test("DEL1 – delete deck removes it from dashboard", async ({ browser }) => {
    const { ctx, page } = await authedPage(browser);
    await page.goto(deckUrl);
    page.once("dialog", (dialog) => dialog.accept());
    await page.locator("button", { hasText: "Delete" }).click();
    await expect(page).toHaveURL("/dashboard", { timeout: 8000 });
    await expect(page.locator(`text=Study ${RUN_ID}`)).not.toBeVisible();
    await ctx.close();
  });
});
