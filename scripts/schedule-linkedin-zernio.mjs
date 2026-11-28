/**
 * Optional marketing: schedule a LinkedIn post via Zernio API.
 * Requires ZERNIO_API_KEY in repo-root `.env` (see .env.example). Not used by scan/Action.
 * Usage: node scripts/schedule-linkedin-zernio.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envPath = path.join(root, ".env");
const imagePath = path.join(
  root,
  "docs/assets/hook/linkedin-hook-composite.png",
);

function loadEnv(file) {
  const out = {};
  if (!fs.existsSync(file)) return out;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([^#=]+)=(.*)$/);
    if (m) out[m[1].trim()] = m[2].trim();
  }
  return out;
}

const POST = `PETITION: Gmail and Outlook should make important emails impossible to ignore. 👇

Actually Microsoft, take your time. You're busy keeping the servers up. We wouldn't want you building another feature.

I got an email from OpenAI saying one of their models was being deprecated. I only noticed it by chance. I probably wouldn't have otherwise, because it looked the same as every other email.

That worried me. One of my apps with paying users runs on that model, and I couldn't believe I'd been careless enough to let it slip.

Obviously the first solution was to actually read every email and become one of those rare superhumans with 0 unread emails. But let's be realistic.

Next I thought about setting up a filter, or getting my agent to read my emails and pull out the deprecation notices specifically.

But what about deprecated models or packages that never come through email? I haven't been building software long enough to have been through many deprecations, so I thought, what if I made a tool that checks my codebase every week and alerts me when something is about to expire?

So that's what I did. Project Sundown. It scans your repo for anything with an expiry date (AI models, APIs, packages, runtimes), checks the official notices, and opens a GitHub issue when something is about to die.

Free and open source. npx sundown-cli . Link in the comments.

For those of us who refuse to read our emails, this one's for you.`;

const apiKey = loadEnv(envPath).ZERNIO_API_KEY;
if (!apiKey) {
  console.error("Missing ZERNIO_API_KEY in .env");
  process.exit(1);
}

const base = "https://zernio.com/api/v1";

async function api(pathname, init = {}) {
  const res = await fetch(`${base}${pathname}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      ...(init.headers ?? {}),
    },
  });
  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { raw: text };
  }
  if (!res.ok) {
    throw new Error(`${res.status} ${pathname}: ${JSON.stringify(body)}`);
  }
  return body;
}

const accountsRes = await api("/accounts");
const accounts = accountsRes.accounts ?? accountsRes.data?.accounts ?? [];
const linkedin = accounts.find(
  (a) => a.platform === "linkedin" && a.isActive !== false,
);
if (!linkedin) {
  console.error("No active LinkedIn account. Accounts:", accounts.length);
  process.exit(1);
}

// Presign + upload image
const presign = await api("/media/presign", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    filename: "linkedin-hook-composite.png",
    contentType: "image/png",
  }),
});

const uploadUrl =
  presign.uploadUrl ?? presign.url ?? presign.data?.uploadUrl;
const mediaUrl = presign.mediaUrl ?? presign.publicUrl ?? presign.data?.mediaUrl;
if (!uploadUrl || !mediaUrl) {
  throw new Error(`Unexpected presign response: ${JSON.stringify(presign)}`);
}

const bytes = fs.readFileSync(imagePath);
const put = await fetch(uploadUrl, {
  method: "PUT",
  headers: { "Content-Type": "image/png" },
  body: bytes,
});
if (!put.ok) {
  throw new Error(`Upload failed ${put.status}`);
}

const created = await api("/posts", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    content: POST,
    scheduledFor: "2026-12-01T11:00:00",
    timezone: "Pacific/Auckland",
    mediaItems: [{ type: "image", url: mediaUrl }],
    platforms: [{ platform: "linkedin", accountId: linkedin._id }],
  }),
});

const post = created.post ?? created.data?.post ?? created;
console.log(
  JSON.stringify(
    {
      status: post.status,
      id: post._id,
      scheduledFor: post.scheduledFor,
      timezone: post.timezone ?? "Pacific/Auckland",
    },
    null,
    2,
  ),
);