import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders Eric's BD Map product surface", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Eric&#x27;s BD Map \| Partnering Intelligence<\/title>/i);
  assert.match(html, /See the whole board\./);
  assert.match(html, /Global map/);
  assert.match(html, /Named people<\/span><strong>76/);
  assert.match(html, /8 companies · sourced roles/);
  assert.doesNotMatch(html, /codex-preview|Building your site|loading skeleton/i);
});

test("ships a complete and evidence-safe LinkedIn portrait registry", async () => {
  const [profileSource, appSource, portraitFiles] = await Promise.all([
    readFile(new URL("../app/people-profiles.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/BDMapApp.tsx", import.meta.url), "utf8"),
    readdir(new URL("../public/people/", import.meta.url)),
  ]);

  const registeredIds = profileSource.match(/^  "[a-z]+-[^"]+":/gm) ?? [];
  const unresolvedProfiles =
    profileSource.match(/: unresolved,/g) ?? [];

  assert.equal(registeredIds.length, 76);
  assert.equal(unresolvedProfiles.length, 10);
  assert.equal(portraitFiles.length, 66);
  assert.ok(portraitFiles.every((file) => file.endsWith(".jpg")));
  assert.match(appSource, /function PersonAvatar/);
  assert.match(appSource, /Open LinkedIn ↗/);
  assert.match(appSource, /Profile not confirmed/);
});
