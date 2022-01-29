const { wrapType } = require("./type");
const { wrapField } = require("./field");

require("./neos-primitive");
require("./worker");
require("./sync-members");
require("./slot");

function createInstance(wrappedType, obj) {
	wrappedType = wrapType(wrappedType);
	if(wrappedType.inner.genericParameters.length)
		throw new Error(`cannot create instance of open generic type ${wrappedType}`);
	return new wrappedType(obj);
}

module.exports = {
	wrapType, wrapField,
	createInstance, instance: createInstance
};
