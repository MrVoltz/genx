const { test } = require("uvu"),
	assert = require("assert");

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

test("complex", () => {
	const tl = new TypeLibrary;

	tl.loadFromJson(require("../../data/types.json"));
	tl.loadAliasesFromJson(require("../../data/type-aliases.json"));

	let chiralityDefinition = tl.findTypeByNamespacedName("FrooxEngine.Chirality");
	assert.equal(chiralityDefinition.definition, chiralityDefinition);
	assert.equal(chiralityDefinition.kind, "enum");
	assert.deepEqual(chiralityDefinition.enumNames, [ "Left", "Right" ]);

	let chiralityReference = tl.createTypeReference(chiralityDefinition);
	assert.equal(chiralityReference.definition, chiralityDefinition);
	assert.equal(chiralityReference.kind, "enum");
	assert.deepEqual(chiralityReference.enumNames, [ "Left", "Right" ]);
});

test.run();
