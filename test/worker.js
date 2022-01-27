const { test } = require("uvu"),
	assert = require("assert");

const { Worker } = require("../lib/worker");
const { type } = require("../lib/neos-types");

test("syncMembers", () => {
	const slot = new Worker(type("Slot"));

	assert(slot.get("Scale"));
	assert(slot.get("Components"));
});

test("syncMethods", () => {
	const slot = new Worker(type("Slot"));
	const destroyMethod = slot.get("Destroy");
	assert(destroyMethod.isSyncMethod);
	assert(!destroyMethod.isImpulseTarget);

	const writeInt = new Worker(type("WriteValueNode<int>"));
	const writeMethod = writeInt.get("Write");
	assert(writeMethod.isSyncMethod);
	assert(writeMethod.isImpulseTarget);
});

test.run();
