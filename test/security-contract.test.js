const test = require("node:test")
const assert = require("node:assert/strict")
const { readFileSync } = require("node:fs")
const { join } = require("node:path")

const root = join(__dirname, "..")
const read = path => readFileSync(join(root, path), "utf8")

test("owned manifest identity is coherent", () => {
  const manifest = JSON.parse(read("manifest.json"))
  assert.equal(manifest.id, "io.github.ol4vr.herald-notification")
  assert.equal(manifest.name, "Omarchy+ Herald Notification Center")
  assert.equal(manifest.version, "1.1.1")
  assert.equal(manifest.author, "Olav Rorvik")
  assert.deepEqual(manifest.kinds, ["bar-widget"])
  assert.equal(manifest.entryPoints.barWidget, "BarWidget.qml")
})

test("runtime contains no Bash command surface", () => {
  for (const name of ["BarWidget.qml", "Panel.qml"])
    assert.equal(read(name).includes('command: ["bash"'), false, name)
})

test("persisted history cannot execute notification commands", () => {
  const panel = read("Panel.qml")
  assert.equal(panel.includes("root.bar.run(entry.exec)"), false)
  assert.equal(panel.includes("entry.exec && root.bar"), false)
  assert.ok(panel.includes("Persisted history is display-and-focus only"))
  assert.ok(panel.includes("invokePopupDefault(entry.index)"))
})

test("per-item deletion is validated and argument-safe", () => {
  const panel = read("Panel.qml")
  assert.ok(panel.includes("NotificationLogic.safeHistoryFileName(fileName)"))
  assert.ok(panel.includes("NotificationLogic.safeImageStem"))
  assert.ok(panel.includes('["rm", "-f", "--", root.historyDir + "/" + safeFileName]'))
  assert.ok(panel.includes('"find", root.imagesDir'))
  assert.equal(panel.includes('"rm -f'), false)
})

test("panel title uses the owned bell glyph", () => {
  const bar = read("BarWidget.qml")
  const panel = read("Panel.qml")
  assert.ok(bar.includes('text: "󰂚"'))
  assert.ok(panel.includes("id: titleIcon"))
  assert.ok(panel.includes('text: "󰂚"'))
  assert.ok(panel.indexOf("id: titleIcon") < panel.indexOf("id: titleText"))
})

test("owned runtime namespace replaces upstream identity", () => {
  for (const name of ["BarWidget.qml", "Panel.qml"])
    assert.equal(read(name).includes("jesseburlamaque.herald-notification"), false, name)
  assert.ok(read("BarWidget.qml").includes("omarchy-plus-herald-notification"))
  assert.ok(read("Panel.qml").includes("omarchy-plus-herald-notification"))
})
