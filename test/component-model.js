// const { test } = require("uvu"),
// 	assert = require("assert"),
// 	util = require("util"),
// 	fs = require("fs");

// const { createWorker, createConstant } = require("../lib/worker");
// const { type } = require("../lib/neos-types");
// const { createObject } = require("../lib/component-model");

// require("../lib/sync-members");

// test("slot", () => {
// 	let slot = createWorker("Slot");
// 	let grabbable = slot.attachComponent("Grabbable");

// 	console.log(util.inspect(slot.toJSON(), { depth: Infinity }));
// });

// test("object", () => {
// 	let object = createObject();

// 	let slot = object.rootSlot;

// 	slot.attachComponent("Grabbable");
// 	slot.get("Name").assign(createConstant("string", "Testovací objekt"));

// 	let valueCopy = slot.attachComponent("ValueCopy<string>");
// 	let valueField = slot.attachComponent("ValueField<string>");

// 	valueCopy.get("Source").assign(slot.get("Name"));
// 	valueCopy.get("Target").assign(valueField.get("Value"));

// 	let obj = object.toJSON();

// 	console.log(util.inspect(obj, { depth: Infinity }));
// 	fs.writeFileSync("/tmp/testobj.json", JSON.stringify(obj));
// });

// test.run();
