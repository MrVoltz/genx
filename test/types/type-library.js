const { test } = require("uvu"),
	assert = require("assert"),
	_ = require("underscore");

const { TypeLibrary } = require("../../lib/types/type-library");

test("loadAliasesFromJson", () => {
	const tl = new TypeLibrary;

	tl.loadAliasesFromJson(require("../../data/type-aliases.json"));

	assert.equal(tl.resolveTypeAlias("int").namespacedName, "System.Int32");
	assert(!tl.resolveTypeAlias("nonexistent"));
});

test("loadFromJson", () => {
	const tl = new TypeLibrary;

	tl.loadFromJson(require("../../data/types.json"));
});

function createTypeLibrary() {
	const tl = new TypeLibrary;

	tl.loadFromJson(require("../../data/types.json"));
	tl.loadFromJson(require("../../data/types-extra.json"));
	tl.loadAliasesFromJson(require("../../data/type-aliases.json"));

	return tl;
}

test("enums", () => {
	const tl = createTypeLibrary();

	let chiralityDefinition = tl.findTypeByNamespacedName("FrooxEngine.Chirality");
	assert.equal(chiralityDefinition.definition, chiralityDefinition);
	assert.equal(chiralityDefinition.kind, "enum");
	assert.deepEqual(chiralityDefinition.enumNames, [ "Left", "Right" ]);

	let chiralityReference = tl.createTypeReference(chiralityDefinition);
	assert.equal(chiralityReference.definition, chiralityDefinition);
	assert.equal(chiralityReference.kind, "enum");
	assert.deepEqual(chiralityReference.enumNames, [ "Left", "Right" ]);
});

test("resolveSimpleType - parsing", () => {
	const tl = createTypeLibrary();

	assert.equal(tl.resolveSimpleType("T", ["T"]), "T");
	assert.equal(tl.resolveSimpleType("int").namespacedName, "System.Int32");

	assert.equal(tl.resolveSimpleType("Chirality").namespacedName, "FrooxEngine.Chirality");
	assert.equal(tl.resolveSimpleType("FrooxEngine.Chirality").definition.namespacedName, "FrooxEngine.Chirality");
	assert.equal(tl.resolveSimpleType("frOOxEngine.Chirality").namespacedName, "FrooxEngine.Chirality");

	assert.throws(() => {
		tl.resolveSimpleType("Sync");
	});
	assert.throws(() => {
		tl.resolveSimpleType("Sync`1");
	});

	let syncInt = tl.resolveSimpleType("Sync<int>");
	let syncT = tl.resolveSimpleType("Sync<T>", ["T"]);

	assert.equal(syncInt.definition, syncT.definition);
	assert.deepEqual(syncT.genericArguments, ["T"]);
	assert.equal(syncInt.genericArguments[0].namespacedName, "System.Int32");

	let complexGeneric = tl.resolveSimpleType("CastClass<SyncRef<T>, U>", ["T","U"]);
	assert.deepEqual(complexGeneric.genericParameters, ["T","U"]);
	assert.equal(complexGeneric.genericArguments[0].namespacedName, "FrooxEngine.SyncRef`1");
	assert.equal(complexGeneric.genericArguments[0].genericArguments[0], "T");
	assert.equal(complexGeneric.genericArguments[1], "U");
});

test("makeGenericType", () => {
	const tl = createTypeLibrary();

 	let int = tl.resolveSimpleType("int");
	let syncT = tl.resolveSimpleType("Sync<T>", ["T"]);
	let syncInt = tl.resolveSimpleType("Sync<int>");

	let syncInt2 = syncT.makeGenericType([ int ]);
	assert.equal(syncInt2.genericParameters.length, 0);
});

test("isAssignableFrom - non-generic", () => {
	const tl = createTypeLibrary();

	let iWorldElement = tl.resolveSimpleType("IWorldElement");
	let addInt = tl.resolveSimpleType("Add_Int");
	let logixNode = tl.resolveSimpleType("LogixNode");

	assert(iWorldElement.isAssignableFrom(iWorldElement));
	assert(iWorldElement.isAssignableFrom(addInt));
	assert(logixNode.isAssignableFrom(addInt));
});

test("methods", () => {
	const tl = createTypeLibrary();

	let slot = tl.resolveSimpleType("Slot");
	let destroyMethod = _.findWhere(slot.methods, { name: "Destroy" });
	assert(destroyMethod);
});

test("equals", () => {
	const tl = createTypeLibrary();

	let syncInt = tl.resolveSimpleType("Sync<int>");
	let syncBool = tl.resolveSimpleType("Sync<bool>");

	assert(syncInt.equals(syncInt));
	assert(syncInt.equals(syncInt, true));
	assert(!syncInt.equals(syncBool));
	assert(!syncInt.equals(syncBool, true));

	let syncT = tl.resolveSimpleType("Sync<T>", ["T"]);
	let syncL = tl.resolveSimpleType("Sync<L>", ["L"]);

	assert(!syncT.equals(syncL));
	assert(syncT.equals(syncL, true));

	let forward = syncT.mapGenericArguments(syncL);
	assert.equal(forward.size, 1);
	assert.equal(forward.get("T"), "L");

	let reverse = syncL.mapGenericArguments(syncT);
	assert.equal(reverse.size, 1);
	assert.equal(reverse.get("L"), "T");

	let castClassCC = tl.resolveSimpleType("CastClass<C,C>", ["C"]);
	let castClassDD = tl.resolveSimpleType("CastClass<D,D>", ["D"]);
	let castClassAB = tl.resolveSimpleType("CastClass<A,B>", ["A", "B"]);

	assert(castClassCC.equals(castClassDD, true));
	assert(!castClassCC.equals(castClassAB, true));
});

test("isAssignableFrom - generic", () => {
	const tl = createTypeLibrary();

	let addInt = tl.resolveSimpleType("Add_Int");
	let iElementContentInt = tl.resolveSimpleType("IElementContent<int>");

	assert(iElementContentInt.isAssignableFrom(addInt));

	let iElementContentT = tl.resolveSimpleType("IElementContent<T>", ["T"]);
	let map = iElementContentT.isAssignableFrom(addInt);
	assert(map);
	assert.equal(map.get("T").namespacedName, "System.Int32");
});

test("naked types", () => {
	const tl = createTypeLibrary();

	assert(tl.resolveSimpleType("int"));
	assert(tl.resolveSimpleType("Int32"));
	assert(tl.resolveSimpleType("TimeSpan"));
});

test.run();
