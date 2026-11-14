// Post-build smoke test: boots the real production server (the same standalone bundle the Docker
// image runs) and requests the public pages.
//
// Why this exists: Jest loads every module as plain JS and `next build` never renders dynamic
// pages, so neither can see server render crashes (e.g. a server component importing data from a
// "use client" module). Only actually serving a page does.
//
// Usage: npm run build && npm run smoke
import {spawn} from "node:child_process";
import fs from "node:fs";

const PORT = process.env.SMOKE_PORT ?? "3999";
const BASE = `http://127.0.0.1:${PORT}`;
const SERVER_ENTRY = ".next/standalone/server.js";

if (!fs.existsSync(SERVER_ENTRY)) {
    console.error(`Missing ${SERVER_ENTRY}. Run "npm run build" first.`);
    process.exit(2);
}

const PUBLIC_ROUTES = ["/", "/login", "/signup", "/about", "/terms"];
const LANGUAGES = [
    {cookie: undefined, lang: "en", dir: "ltr"},
    {cookie: "toumaar-lang=en", lang: "en", dir: "ltr"},
    {cookie: "toumaar-lang=fa", lang: "fa", dir: "rtl"},
];

let serverOutput = "";
const server = spawn(process.execPath, [SERVER_ENTRY], {
    env: {...process.env, PORT, HOSTNAME: "127.0.0.1", NODE_ENV: "production", NEXT_TELEMETRY_DISABLED: "1"},
    stdio: ["ignore", "pipe", "pipe"],
});
server.stdout.on("data", (d) => (serverOutput += d));
server.stderr.on("data", (d) => (serverOutput += d));

const failures = [];
const fail = (msg) => failures.push(msg);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitUntilUp() {
    for (let i = 0; i < 60; i++) {
        if (server.exitCode !== null) throw new Error(`server exited early (code ${server.exitCode})`);
        try {
            await fetch(`${BASE}/login`);
            return;
        } catch {
            await sleep(500);
        }
    }
    throw new Error("server did not start within 30s");
}

async function get(path, cookie) {
    const res = await fetch(BASE + path, {
        headers: cookie ? {Cookie: cookie} : {},
        redirect: "manual",
    });
    return {status: res.status, location: res.headers.get("location"), body: await res.text()};
}

async function run() {
    await waitUntilUp();

    for (const route of PUBLIC_ROUTES) {
        for (const {cookie, lang, dir} of LANGUAGES) {
            const label = `${route} [${cookie ?? "no cookie"}]`;
            const {status, body} = await get(route, cookie);
            if (status !== 200) {
                fail(`${label}: expected 200, got ${status}`);
                continue;
            }
            const html = body.match(/<html[^>]*>/)?.[0] ?? "";
            if (!html.includes(`lang="${lang}"`) || !html.includes(`dir="${dir}"`)) {
                fail(`${label}: expected lang="${lang}" dir="${dir}", got ${html || "no <html> tag"}`);
            }
        }
    }

    // Signed-out visitors to the app must be sent to /login, not hit an error page.
    const protectedRes = await get("/dashboard");
    if (protectedRes.status < 300 || protectedRes.status >= 400 || !protectedRes.location?.includes("/login")) {
        fail(`/dashboard signed out: expected redirect to /login, got ${protectedRes.status} ${protectedRes.location ?? ""}`);
    }

    // A render crash is logged by the server even if some other layer swallowed it.
    if (/⨯|TypeError|ReferenceError|Unhandled/.test(serverOutput)) {
        fail(`server logged errors:\n${serverOutput.trim()}`);
    }
}

try {
    await run();
} catch (err) {
    fail(String(err.message ?? err));
} finally {
    server.kill();
}

if (failures.length > 0) {
    console.error("Smoke test FAILED:\n - " + failures.join("\n - "));
    if (serverOutput.trim()) console.error("\nServer output:\n" + serverOutput.trim());
    process.exit(1);
}
console.log(`Smoke test passed: ${PUBLIC_ROUTES.length} routes x ${LANGUAGES.length} language variants + auth redirect.`);
