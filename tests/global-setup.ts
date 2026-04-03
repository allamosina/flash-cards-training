import "dotenv/config";
import { chromium, type FullConfig } from "@playwright/test";
import path from "path";
import { encode } from "next-auth/jwt";

// Single email/password used by ALL tests
export const TEST_EMAIL = "playwright@test.local";
export const TEST_PASSWORD = "playwright123";
export const TEST_NAME = "Playwright User";
export const AUTH_FILE = path.join(__dirname, ".auth/user.json");

async function globalSetup(config: FullConfig) {
  // Resolve base URL from global or project-level config
  const baseURL =
    (config.use as { baseURL?: string })?.baseURL ??
    (config.projects[0].use as { baseURL?: string })?.baseURL ??
    "http://localhost:3001";

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  // 1. Register (idempotent — okay if user already exists)
  const regRes = await page.request.post(`${baseURL}/api/register`, {
    data: { email: TEST_EMAIL, name: TEST_NAME, password: TEST_PASSWORD },
  });
  if (!regRes.ok()) {
    const body = await regRes.json();
    if (body.error !== "Email already in use") {
      throw new Error(`Registration failed: ${JSON.stringify(body)}`);
    }
  }

  // 2. Get the user's DB id (needed to sign the JWT)
  //    We fetch it via a lightweight internal helper — avoids importing Prisma here
  const userRes = await page.request.post(`${baseURL}/api/test-user-id`, {
    data: { email: TEST_EMAIL },
  });
  if (!userRes.ok()) throw new Error("Could not retrieve user id from test endpoint");
  const { id: userId } = await userRes.json();

  // 3. Mint a NextAuth v5 JWT directly, bypassing the browser login form
  const secret = process.env.AUTH_SECRET ?? "";
  const token = await encode({
    token: {
      sub: userId,
      email: TEST_EMAIL,
      name: TEST_NAME,
      id: userId,
    },
    secret,
    salt: "authjs.session-token",
  });

  // 4. Inject the session cookie so the saved context is fully authenticated
  await context.addCookies([
    {
      name: "authjs.session-token",
      value: token,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);

  // 5. Verify the cookie actually works
  await page.goto(`${baseURL}/dashboard`);
  const url = page.url();
  if (!url.includes("/dashboard")) {
    throw new Error(`Auth cookie verification failed — ended up at: ${url}`);
  }

  // 6. Save authenticated storage state
  const fs = await import("fs");
  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });
  await context.storageState({ path: AUTH_FILE });

  await browser.close();
}

export default globalSetup;
