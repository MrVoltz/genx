const { getBuilderForType, getBuilderForField, createBuilderForInstance, createBuilderForInstanceField } = require("./builder");

function createBuilder(wrappedType, obj, builderParams) {
	wrappedTypeBuilder = getBuilderForType(wrappedType);
	return new wrappedTypeBuilder(obj, builderParams);
}

module.exports = {
	getBuilderForType, getBuilderForField,
	createBuilderForInstance, createBuilderForInstanceField,
	createBuilder, builder: createBuilder
};

require("./proxies");
require("./operators");
