const { test } = require("uvu"),
	assert = require("assert");

const { createWorker } = require("../lib/worker");
const { type } = require("../lib/neos-types");

require("../lib/component-model");
require("../lib/sync-members");

test("slot", () => {
	let slot = createWorker("Slot");
	let grabbable = slot.attachComponent("Grabbable");

	console.log(slot.toJSON());
});

test.run();
