const { test } = require("uvu"),
	assert = require("assert"),
	util = require("util"),
	fs = require("fs");

const { createBuilder, getBuilderForType } = require("../lib/builders");
const { wrapType } = require("../lib/wrappers");

test("create slot builder", () => {
	createBuilder("Slot");
});

test("factory extensions", () => {
	let slot = createBuilder("Slot");

	let child = slot.slot("child");
	assert(slot.children.length);
	assert.equal(child.get("Name").nativeValue, "child");

	let vf = child.component("ValueField<int>");
	assert(slot.get("Components").items.length);

	// console.log(util.inspect(slot.toJSON(), { depth: Infinity }));
});

test("content type", () => {
	const Add_Int = getBuilderForType("Add_Int");
	assert(Add_Int.contentType.equals(wrapType("int")));
});

test("asIElementContent", () => {
	const factoryTargetSlot = createBuilder("Slot");

	let a = createBuilder("string", "test", { factoryTargetSlot })
		.asIElementContent();
	assert(a.type.contentType.equals(wrapType("string")));

	let b = a.asIElementContent();
	assert(b === a);

	let c = a.get("Value").asIElementContent();
	assert(c.fieldType.contentType.equals(wrapType("string")));

	let d = factoryTargetSlot.component("FindAnimationTrackIndex").asIElementContent();
	assert(d.fieldType.contentType.equals(wrapType("int")));

	factoryTargetSlot.dump();
});

test("unary operators", () => {

});

test.run();
