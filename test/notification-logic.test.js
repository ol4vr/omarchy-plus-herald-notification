const test = require("node:test")
const assert = require("node:assert/strict")
const Logic = require("../NotificationLogic.js")

test("accepts only non-negative decimal history components", () => {
  assert.equal(Logic.safeDecimalComponent(42), "42")
  assert.equal(Logic.safeDecimalComponent("0042"), "0042")
  for (const value of ["../42", "42/7", "42.7", -1, "-1", "", null, undefined])
    assert.equal(Logic.safeDecimalComponent(value), "")
})

test("constructs and validates contained history identities", () => {
  const entry = { timestamp: 1723982400000, originalId: 17 }
  assert.equal(Logic.imageStem(entry), "1723982400000-17")
  assert.equal(Logic.popupFileName(entry), "1723982400000-17.json")
  assert.equal(Logic.safeHistoryFileName("1723982400000-17.json"), "1723982400000-17.json")
  assert.equal(Logic.safeImageStem("1723982400000-17"), "1723982400000-17")
})

test("rejects traversal and shell-like deletion identities", () => {
  for (const value of [
    "../17.json", "1-../../17.json", "/tmp/1-2.json", "1-2.json;touch pwned",
    "1-2.json$(id)", "1-2.JSON", "1--2.json", "1-2/3.json"
  ]) assert.equal(Logic.safeHistoryFileName(value), "")
  for (const value of ["../1-2", "1-2/*", "1-2;id", "1--2", "1-2.json"])
    assert.equal(Logic.safeImageStem(value), "")
})

test("drops malformed and unsafe history records", () => {
  const valid = JSON.stringify({ id: 7, originalId: 7, timestamp: 1723982400000, summary: "safe" })
  const traversal = JSON.stringify({ id: "../../x", originalId: "../../x", timestamp: "../tmp", summary: "unsafe" })
  const parsed = Logic.parsePopupFiles([valid, traversal, "not-json"].join("\n"), 1)
  assert.equal(parsed.length, 1)
  assert.equal(parsed[0].summary, "safe")
  assert.equal(parsed[0].exec, undefined)
})

test("formats browser notification identity without network access", () => {
  const body = '<a href="https://github.com/ol4vr">open</a>'
  assert.equal(Logic.extractFirstHref(body), "https://github.com/ol4vr")
  assert.equal(Logic.domainFromUrl(Logic.extractFirstHref(body)), "github.com")
  assert.equal(Logic.iconNameForDomain("github.com"), "github")
  assert.deepEqual(Logic.formatAppTitle("Brave Origin", body), {
    primary: "GitHub",
    secondary: "Brave Origin"
  })
})
