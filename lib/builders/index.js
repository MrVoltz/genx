const { getBuilderForType, getBuilderForField } = require("./builder");

function createBuilder(wrappedType, obj, builderParams) {
	wrappedTypeBuilder = getBuilderForType(wrappedType);
	return new wrappedTypeBuilder(obj, builderParams);
}

module.exports = {
	getBuilderForType, getBuilderForField,
	createBuilder, builder: createBuilder
};

require("./proxies");
require("./common");
require("./logix/operators");
