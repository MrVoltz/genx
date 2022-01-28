const { test } = require("uvu"),
	assert = require("assert");

const { Worker, createWorker, createConstant } = require("../lib/worker");
const { type } = require("../lib/neos-types");

test("syncMembers", () => {
	const slot = createWorker("Slot");

	assert(slot.get("Scale"));
	assert(slot.get("Components"));
});

test("syncMethods", () => {
	const slot = createWorker("Slot");

	const destroyMethod = slot.get("Destroy");
	assert(destroyMethod.isSyncMethod);
	assert(!destroyMethod.isImpulseTarget);

	const writeInt = createWorker("WriteValueNode<int>");
	const writeMethod = writeInt.get("Write");
	assert(writeMethod.isSyncMethod);
	assert(writeMethod.isImpulseTarget);
});

test("assign syncValue", () => {
	const slot = createWorker("Slot");
	slot.get("Name").assign(createConstant("string", "Testovací slot"));

	assert.throws(() => {
		slot.get("Name").assign(createConstant("int", 10));
	});

	const valueField = createWorker("ValueField<int>");
	valueField.get("Value").assign(createConstant("int", 10));

	const valueCopyString = createWorker("ValueCopy<string>");
	assert.throws(() => {
		valueCopyString.get("Source").assign(valueField.get("Value"));
	});

	const valueCopyInt = createWorker("ValueCopy<int>");
	valueCopyInt.get("Source").assign(valueField.get("Value"));
});

test.run();
