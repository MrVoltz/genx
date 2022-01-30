const { test } = require("uvu"),
	assert = require("assert"),
	util = require("util"),
	fs = require("fs");

const { createObject } = require("../lib/neos-object");
const { createInstance } = require("../lib/wrappers");

test("slot", () => {
	let slot = createInstance("Slot");
	let grabbable = slot.attachComponent("Grabbable");

	// console.log(util.inspect(slot.toJSON(), { depth: Infinity }));
});

test("object", () => {
	let object = createObject();

	let slot = object.rootSlot;

	slot.attachComponent("Grabbable");
	slot.get("Name").assign(createInstance("string", "Testovací objekt"));
	slot.get("Name").assign("Testovací objekt 2");

	let valueCopy = slot.attachComponent("ValueCopy<string>");
	let valueField = slot.attachComponent("ValueField<string>");

	valueCopy.get("Source").assign(slot.get("Name"));
	valueCopy.get("Target").assign(valueField.get("Value"));

	let obj = object.toJSON();

	// console.log(util.inspect(obj, { depth: Infinity }));
	fs.writeFileSync("/tmp/testobj.json", JSON.stringify(obj));
});

test.run();
