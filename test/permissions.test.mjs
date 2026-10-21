// GET /user/permissions carries the permission map the profile used to carry.
// getPermissions asks it, falls back to the profile on a server without the
// route, and keeps localStorage["permissions"] where the apps read it.
import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { Dmart } from "../dist/index.js";

function installStorage() {
  const items = new Map();
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (k) => (items.has(k) ? items.get(k) : null),
      setItem: (k, v) => items.set(k, String(v)),
      removeItem: (k) => items.delete(k),
    },
  });
  return items;
}

// Answers each URL from `routes` as an axios response, checking the status
// against the caller's validateStatus the way axios does.
function installServer(routes) {
  const calls = [];
  Dmart.setAxiosInstance({
    defaults: { baseURL: "https://example.test/dmart" },
    get: async (url, config) => {
      calls.push(url);
      const { status = 200, data = {} } = routes[url] ?? { status: 404 };
      const valid = config?.validateStatus ?? ((s) => s >= 200 && s < 300);
      if (!valid(status)) {
        throw Object.assign(new Error(`status ${status}`), { response: { status, data } });
      }
      return { status, data };
    },
  });
  return calls;
}

const map = { "demo:content:content": { allowed_actions: ["view"], conditions: [], restricted_fields: [], allowed_fields_values: {} } };
const profile = (attributes) => ({ status: "success", records: [{ resource_type: "user", shortname: "u", subpath: "users", attributes: { roles: ["r"], ...attributes } }] });

describe("getPermissions", () => {
  let items;
  beforeEach(() => { items = installStorage(); });
  afterEach(() => { delete globalThis.localStorage; });

  test("reads GET user/permissions and stores the map", async () => {
    const calls = installServer({ "user/permissions": { data: { status: "success", attributes: { permissions: map } } } });
    assert.deepEqual(await Dmart.getPermissions(), map);
    assert.deepEqual(calls, ["user/permissions"]);
    assert.deepEqual(JSON.parse(items.get("permissions")), map);
  });

  // What a dmart without the route sends: the unmatched-route rewrite.
  const invalidRoute = { status: "failed", error: { type: "request", code: 230, message: "Route not found: GET /user/permissions" } };

  for (const status of [422, 404]) {
    test(`falls back to the profile's map on a server without the route (${status})`, async () => {
      const calls = installServer({
        "user/permissions": { status, data: invalidRoute },
        "user/profile": { data: profile({ permissions: map }) },
      });
      assert.deepEqual(await Dmart.getPermissions(), map);
      assert.deepEqual(calls, ["user/permissions", "user/profile"]);
      assert.deepEqual(JSON.parse(items.get("permissions")), map);
    });
  }

  test("a 404 without dmart's envelope also falls back", async () => {
    const calls = installServer({ "user/profile": { data: profile({ permissions: map }) } });
    assert.deepEqual(await Dmart.getPermissions(), map);
    assert.deepEqual(calls, ["user/permissions", "user/profile"]);
  });

  for (const [status, code] of [[401, 49], [422, 400]]) {
    test(`throws on any other failure (${status}, code ${code})`, async () => {
      installServer({ "user/permissions": { status, data: { status: "failed", error: { type: "request", code } } } });
      await assert.rejects(Dmart.getPermissions(), new RegExp(`status ${status}`));
      assert.equal(items.has("permissions"), false);
    });
  }
});

describe("getProfile", () => {
  let items;
  beforeEach(() => { items = installStorage(); });
  afterEach(() => { delete globalThis.localStorage; });

  test("still stores the profile's map while the server sends one", async () => {
    installServer({ "user/profile": { data: profile({ permissions: map }) } });
    await Dmart.getProfile();
    assert.deepEqual(JSON.parse(items.get("permissions")), map);
    assert.deepEqual(JSON.parse(items.get("roles")), ["r"]);
  });

  test("keeps the stored map when the profile has none", async () => {
    items.set("permissions", JSON.stringify(map));
    installServer({ "user/profile": { data: profile({}) } });
    await Dmart.getProfile();
    assert.deepEqual(JSON.parse(items.get("permissions")), map);
  });
});
