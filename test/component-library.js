const { test } = require("uvu"),
	assert = require("assert"),
	util = require("util");

const { wrapType } = require("../lib/wrappers");
const { findLogixNodesByOverload } = require("../lib/component-library");

test("findLogixNodesByOverload", () => {
	assert(findLogixNodesByOverload("Add").length);

	const Add_Int = wrapType("Add_Int");
	assert(findLogixNodesByOverload(Add_Int).length);
});

test.run();
