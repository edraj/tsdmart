// Scope auto-detection: `managed/*` requires a bearer token and 401s without
// one, so an anonymous client must fall back to `public/*`. These tests drive
// the BUILT dist through a fake axios instance, so they assert on the exact
// URL the shipped package would request — no network, no live server.
import { test, describe, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { Dmart, DmartScope, ResourceType } from "../dist/index.js";

// Records every URL the library asks for, and answers with an empty envelope.
function installSpy() {
  const calls = [];
  Dmart.setAxiosInstance({
    defaults: { baseURL: "https://example.test/dmart" },
    get: async (url) => (calls.push({ method: "GET", url }), { data: {} }),
    post: async (url) => (calls.push({ method: "POST", url }), { data: {} }),
  });
  return calls;
}

const attachment = {
  resource_type: ResourceType.media,
  space_name: "archive",
  subpath: "content",
  parent_shortname: "parent",
  shortname: "att",
  ext: "jpg",
};

describe("scope auto-detection", () => {
  let calls;
  beforeEach(() => {
    calls = installSpy();
    Dmart.clearToken();
  });

  test("getAttachmentUrl uses public when no token is set", () => {
    const url = Dmart.getAttachmentUrl(attachment);
    assert.match(url, /\/public\/payload\//);
    assert.doesNotMatch(url, /\/managed\//);
  });

  test("getAttachmentUrl uses managed once a token is set", () => {
    Dmart.setToken("jwt");
    assert.match(Dmart.getAttachmentUrl(attachment), /\/managed\/payload\//);
  });

  test("getAttachmentUrl returns to public after clearToken", () => {
    Dmart.setToken("jwt");
    Dmart.clearToken();
    assert.match(Dmart.getAttachmentUrl(attachment), /\/public\/payload\//);
  });

  // Source compatibility: callers that already pass a scope must keep winning
  // over the detection, in BOTH directions.
  test("an explicit scope overrides detection (public while authenticated)", () => {
    Dmart.setToken("jwt");
    assert.match(
      Dmart.getAttachmentUrl(attachment, DmartScope.public),
      /\/public\/payload\//);
  });

  test("an explicit scope overrides detection (managed while anonymous)", () => {
    assert.match(
      Dmart.getAttachmentUrl(attachment, DmartScope.managed),
      /\/managed\/payload\//);
  });

  test("query follows the token", async () => {
    await Dmart.query({ type: "search", space_name: "archive", subpath: "/" });
    assert.equal(calls.at(-1).url, "public/query");
    Dmart.setToken("jwt");
    await Dmart.query({ type: "search", space_name: "archive", subpath: "/" });
    assert.equal(calls.at(-1).url, "managed/query");
  });

  test("retrieveEntry follows the token", async () => {
    await Dmart.retrieveEntry({
      resource_type: ResourceType.content, space_name: "archive",
      subpath: "content", shortname: "x",
    });
    assert.match(calls.at(-1).url, /^public\/entry\//);
    Dmart.setToken("jwt");
    await Dmart.retrieveEntry({
      resource_type: ResourceType.content, space_name: "archive",
      subpath: "content", shortname: "x",
    });
    assert.match(calls.at(-1).url, /^managed\/entry\//);
  });

  test("getPayload follows the token", async () => {
    await Dmart.getPayload({
      resource_type: ResourceType.media, space_name: "archive",
      subpath: "content", shortname: "att", ext: "jpg",
    });
    assert.match(calls.at(-1).url, /^public\/payload\//);
  });

  // The security-relevant exclusion. Auto-detecting a WRITE would turn an
  // anonymous upload from a guaranteed 401 into a real write attempt against
  // the public endpoint. If someone ever "consistently" applies detection to
  // uploadWithPayload, this test is the thing that stops it.
  test("uploadWithPayload stays on managed even when anonymous", async () => {
    await Dmart.uploadWithPayload({
      space_name: "archive", subpath: "content", shortname: "x",
      resource_type: ResourceType.content,
      payload_file: new Blob(["x"], { type: "text/plain" }),
    });
    assert.equal(calls.at(-1).url, "managed/resource_with_payload");
  });

  test("uploadWithPayload still honours an explicit public scope", async () => {
    await Dmart.uploadWithPayload({
      space_name: "archive", subpath: "content", shortname: "x",
      resource_type: ResourceType.content,
      payload_file: new Blob(["x"], { type: "text/plain" }),
    }, DmartScope.public);
    assert.equal(calls.at(-1).url, "public/resource_with_payload");
  });
});

describe("token lifecycle", () => {
  beforeEach(() => { installSpy(); Dmart.clearToken(); });

  test("getToken reflects set and clear", () => {
    assert.equal(Dmart.getToken(), null);
    Dmart.setToken("jwt");
    assert.equal(Dmart.getToken(), "jwt");
    Dmart.clearToken();
    assert.equal(Dmart.getToken(), null);
  });

  // Without this, a logged-out client keeps reporting a session that no longer
  // exists and detection pins it to managed/* — 401 on every read after logout.
  test("logout clears the token", async () => {
    Dmart.setToken("jwt");
    await Dmart.logout();
    assert.equal(Dmart.getToken(), null);
    assert.match(Dmart.getAttachmentUrl(attachment), /\/public\/payload\//);
  });
});
