// A service's own token (client_credentials, dmart 1.8.0+): loginClientCredentials
// asks the token endpoint, keeps the token, and renews it before it expires;
// every call sends the token current at send time.
import { test, describe, afterEach } from "node:test";
import assert from "node:assert/strict";
import { Dmart, ResourceType } from "../dist/index.js";

// A fake axios instance: the token endpoint answers from `tokens` in turn, or
// refuses with `tokenStatus`; every call is recorded with the Authorization it
// carried. axios reads the shared headers object when the call is made, so the
// header is copied here at that moment.
function installServer({ tokens = [{ access_token: "first", token_type: "Bearer", expires_in: 600 }], tokenStatus = 200 } = {}) {
  const calls = [];
  const queue = [...tokens];
  Dmart.setAxiosInstance({
    defaults: { baseURL: "https://example.test/dmart" },
    post: async (url, body, config) => {
      calls.push({ url, body, auth: config?.headers?.Authorization });
      const data = tokenStatus >= 400
        ? { error: "invalid_client", error_description: "unknown client or wrong secret" }
        : queue.shift();
      const valid = config?.validateStatus ?? ((s) => s >= 200 && s < 300);
      if (!valid(tokenStatus)) throw Object.assign(new Error(`status ${tokenStatus}`), { response: { status: tokenStatus, data } });
      return { status: tokenStatus, data };
    },
    get: async (url, config) => {
      calls.push({ url, auth: config?.headers?.Authorization });
      return { status: 200, data: { status: "success", records: [] } };
    },
  });
  return calls;
}

const tokenCalls = (calls) => calls.filter((c) => c.url.endsWith("oidc/token"));

describe("loginClientCredentials", () => {
  afterEach(() => Dmart.clearToken());

  test("posts the form and keeps the token", async () => {
    const calls = installServer();
    const answer = await Dmart.loginClientCredentials("billing", "s3cret", { resource: "https://api.example.com" });
    assert.equal(answer.access_token, "first");
    assert.equal(Dmart.getToken(), "first");
    const form = new URLSearchParams(tokenCalls(calls)[0].body);
    assert.deepEqual(Object.fromEntries(form), {
      grant_type: "client_credentials", client_id: "billing", client_secret: "s3cret", resource: "https://api.example.com",
    });
    assert.equal(tokenCalls(calls)[0].url, "oidc/token");
  });

  test("a token that is due is renewed before the call, which carries the new one", async () => {
    const calls = installServer({ tokens: [
      { access_token: "first", token_type: "Bearer", expires_in: 0.001 },
      { access_token: "second", token_type: "Bearer", expires_in: 600 },
    ] });
    await Dmart.loginClientCredentials("billing", "s3cret");
    await new Promise((r) => setTimeout(r, 5));
    await Dmart.getManifest();
    assert.equal(Dmart.getToken(), "second");
    assert.equal(calls.at(-1).auth, "Bearer second");
    assert.equal(tokenCalls(calls).length, 2);
  });

  test("a token not yet due is kept", async () => {
    const calls = installServer();
    await Dmart.loginClientCredentials("billing", "s3cret");
    await Dmart.getManifest();
    assert.equal(calls.at(-1).auth, "Bearer first");
    assert.equal(tokenCalls(calls).length, 1);
  });

  test("concurrent calls share one renewal", async () => {
    const calls = installServer({ tokens: [
      { access_token: "first", token_type: "Bearer", expires_in: 0.001 },
      { access_token: "second", token_type: "Bearer", expires_in: 600 },
    ] });
    await Dmart.loginClientCredentials("billing", "s3cret");
    await new Promise((r) => setTimeout(r, 5));
    await Promise.all([1, 2, 3, 4, 5].map(() => Dmart.getManifest()));
    assert.equal(tokenCalls(calls).length, 2);
  });

  test("a refusal throws the endpoint's OAuth error", async () => {
    installServer({ tokenStatus: 401 });
    await assert.rejects(Dmart.loginClientCredentials("billing", "wrong"), (e) => {
      assert.match(e.message, /^invalid_client/);
      assert.equal(e.status, 401);
      return true;
    });
    assert.equal(Dmart.getToken(), null);
  });

  test("setting the token by hand ends the renewal", async () => {
    const calls = installServer({ tokens: [{ access_token: "first", token_type: "Bearer", expires_in: 0.001 }] });
    await Dmart.loginClientCredentials("billing", "s3cret");
    Dmart.setToken("mine");
    await new Promise((r) => setTimeout(r, 5));
    await Dmart.getManifest();
    assert.equal(calls.at(-1).auth, "Bearer mine");
    assert.equal(tokenCalls(calls).length, 1);
  });

  test("tokenUrl can point elsewhere", async () => {
    const calls = installServer();
    await Dmart.loginClientCredentials("billing", "s3cret", { tokenUrl: "https://id.example.com/oidc/token" });
    assert.equal(tokenCalls(calls)[0].url, "https://id.example.com/oidc/token");
  });
});

describe("ResourceType", () => {
  test("has the types dmart added", () => {
    for (const t of ["data_asset", "lock", "log", "reply", "share", "integration"]) assert.equal(ResourceType[t], t);
  });
});
