/* ============================================================
   facts.test.js — the honesty gate for looptrace·explained.

   1. THE REAL-NODE PROOF: every demo snippet in data/facts.js is
      executed verbatim in a Node child process; the captured
      console output must equal the stored `order` exactly.
   2. THE PAGE-DRIFT PROOF: index.html must display those exact
      orders (every data-demo list) and each demo's exact code.
   3. Invariants: unique ids, ISO verified date, exact CSP meta,
      the verified-badge strings, and the app link everywhere.
   ============================================================ */
"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const { FACTS } = require("../data/facts.js");

const ROOT = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
const readme = fs.readFileSync(path.join(ROOT, "README.md"), "utf8");

function runInNode(code) {
  const r = spawnSync(process.execPath, ["-e", code], {
    encoding: "utf8",
    timeout: 15000
  });
  assert.equal(r.status, 0, "snippet must exit 0; stderr: " + r.stderr);
  return r.stdout.split("\n").filter((l) => l.length > 0);
}

/* Extract every <li> list rendered for a given data-demo id, in order. */
function displayedOrders(id) {
  const lists = [];
  const re = new RegExp('data-demo="' + id + '"[^>]*>([\\s\\S]*?)</ol>', "g");
  let m;
  while ((m = re.exec(html)) !== null) {
    const items = [];
    const liRe = /<li>([^<]*)<\/li>/g;
    let li;
    while ((li = liRe.exec(m[1])) !== null) items.push(li[1].trim());
    lists.push(items);
  }
  return lists;
}

/* ---------- 1. the real-Node proof ---------- */
for (const demo of FACTS.demos) {
  test(`real Node run matches stored order: ${demo.id}`, () => {
    assert.deepEqual(runInNode(demo.code), demo.order);
  });
  test(`naive guess is genuinely different (the trap is real): ${demo.id}`, () => {
    assert.notDeepEqual(demo.naiveGuess, demo.order);
  });
}

/* ---------- 2. the page-drift proof ---------- */
for (const demo of FACTS.demos) {
  test(`index.html displays the proven order for ${demo.id} (every occurrence)`, () => {
    const lists = displayedOrders(demo.id);
    assert.ok(lists.length >= 1, `no data-demo="${demo.id}" list found in index.html`);
    for (const items of lists) assert.deepEqual(items, demo.order);
  });
  test(`index.html shows the exact verbatim code for ${demo.id}`, () => {
    assert.ok(html.includes(demo.code), `code for ${demo.id} not found verbatim in index.html`);
  });
}

test("every data-demo id used in index.html exists in FACTS", () => {
  const known = new Set(FACTS.demos.map((d) => d.id));
  const re = /data-demo="([^"]+)"/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    assert.ok(known.has(m[1]), `unknown data-demo id in index.html: ${m[1]}`);
  }
});

/* ---------- 3. invariants ---------- */
test("demo ids are unique; orders and code are non-empty", () => {
  const ids = FACTS.demos.map((d) => d.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const d of FACTS.demos) {
    assert.ok(d.code.length > 0);
    assert.ok(Array.isArray(d.order) && d.order.length > 0);
    assert.ok(d.order.every((l) => typeof l === "string" && l.length > 0));
  }
});

test("verifiedDate is a real ISO date; verified strings appear on the page", () => {
  assert.match(FACTS.app.verifiedDate, /^\d{4}-\d{2}-\d{2}$/);
  const dt = new Date(FACTS.app.verifiedDate + "T00:00:00Z");
  assert.ok(!Number.isNaN(dt.getTime()));
  assert.equal(dt.toISOString().slice(0, 10), FACTS.app.verifiedDate); // rejects e.g. 2026-02-31
  assert.ok(html.includes(FACTS.app.verifiedNode), "verified Node version missing from page");
  assert.ok(html.includes(FACTS.app.verifiedDate), "verified date missing from page");
});

test("snippet count claim is consistent (sourced from the looptrace README)", () => {
  assert.equal(FACTS.app.snippetCount, 36);
  assert.ok(html.includes("36"), "snippet-count claim missing from page");
});

test("the exact strict CSP meta is present", () => {
  const csp = `<meta http-equiv="Content-Security-Policy" content="default-src 'self'; connect-src 'none'; img-src 'self' data:; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; object-src 'none'">`;
  assert.ok(html.includes(csp));
});

test("no inline event handlers or executable inline script in index.html", () => {
  assert.ok(!/\son[a-z]+=/i.test(html), "inline on*= handler found");
  const scripts = html.match(/<script\b[^>]*>/g) || [];
  for (const tag of scripts) {
    assert.ok(
      tag.includes('type="application/ld+json"') || tag.includes('src="app.js"'),
      "unexpected script tag: " + tag
    );
  }
});

test("the live app link is present in page and README", () => {
  assert.ok(html.includes(FACTS.app.url));
  assert.ok(readme.includes(FACTS.app.url));
});
