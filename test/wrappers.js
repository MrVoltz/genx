const { test } = require("uvu"),
	assert = require("assert"),
	util = require("util");

const { wrapType } = require("../lib/wrappers");

test("base type", () => {
	const Slot = wrapType("Slot");
	let slot = new Slot;

	assert(Slot);
	assert(slot);
});

test("neos primitives", () => {
	const int = wrapType("int");
	assert(int.isNeosPrimitive);

	let ten = new int(10);
	assert(ten.toJSON() === 10);

	const Chirality = wrapType("Chirality");
	assert(Chirality.isNeosPrimitive);
	let left = new Chirality("Left");

	const Slot = wrapType("Slot");
	assert(!Slot.isNeosPrimitive);
});

test("worker - syncMembers", () => {
	const Slot = wrapType("Slot");

	assert(Slot.get("Scale"));
	assert(Slot.get("Components"));

	let slot = new Slot;
	assert(slot.get("Scale"));
	assert(slot.get("Components"));
});

test("worker - syncMethods", () => {
	const Slot = wrapType("Slot");

	let destroyMethod = Slot.get("Destroy");
	assert(destroyMethod.isSyncMethod);
	assert(!destroyMethod.isImpulseTarget);

	const WriteValueNode_Int = wrapType("WriteValueNode<int>");

	let writeMethod = WriteValueNode_Int.get("Write");
	assert(writeMethod.isSyncMethod);
	assert(writeMethod.isImpulseTarget);
});

test("assign syncValue", () => {
	const Slot = wrapType("Slot");
	const string = wrapType("string");
	const float3 = wrapType("float3");
	const int = wrapType("int");
	const ValueField_Int = wrapType("ValueField<int>");
	const ValueCopy_int = wrapType("ValueCopy<int>");
	const ValueCopy_string = wrapType("ValueCopy<string>");

	let slot = new Slot;
	slot.get("Name").assign(new string("Testovací slot"));

	assert.throws(() => {
		slot.get("Name").assign(new int(10));
	});

	const valueField = new ValueField_Int;
	valueField.get("Value").assign(new int(10));

	const valueCopyString = new ValueCopy_string;
	assert.throws(() => {
		valueCopyString.get("Source").assign(valueField.get("Value"));
	});

	const valueCopyInt = new ValueCopy_int;
	valueCopyInt.get("Source").assign(valueField.get("Value"));

	assert.throws(() => slot.get("Scale").assign(new string("test")));
	slot.get("Scale").assign(new float3([ 1, 1, 1 ]));
});

test("slot - attachComponent", () => {
	const Slot = wrapType("Slot");

	let slot = new Slot;
	let grabbable = slot.attachComponent("Grabbable");
	console.log(util.inspect(slot.toJSON(), { depth: Infinity }));
});

test.run();
