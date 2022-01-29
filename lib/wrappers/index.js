const { wrapType } = require("./type");
const { wrapField } = require("./field");

require("./neos-primitive");
require("./worker");
require("./sync-members");
require("./slot");

function createInstance(wrappedType, obj) {
	wrappedType = wrapType(wrappedType);
	return new wrappedType(obj);
}

module.exports = { wrapType, wrapField, createInstance };
