const { TypeReference } = require("./types/type");
const { TypeLibrary } = require("./types/type-library");

const library = new TypeLibrary;

library.loadFromJson(require("../data/types.json"));
library.loadAliasesFromJson(require("../data/type-aliases.json"));

const simpleTypeCache = new Map;
function resolveSimpleType(str, genericParameters) {
	if(str instanceof TypeReference)
		return str;
	let type = simpleTypeCache.get(str);
	if(!type)
		simpleTypeCache.set(str, type = library.resolveSimpleType(str, genericParameters));
	return type;
}

const activatorTypeCache = new Map;
function resolveActivatorType(str) {
	let type = activatorTypeCache.get(str);
	if(!type)
		activatorTypeCache.set(str, type = library.resolveActivatorType(str));
	return type;
}

const typeWrapperResolver = [];
function registerTypeWrapperResolver(resolver) {
	typeWrapperResolver.unshift(resolver);
}
function resolveTypeWrapper(type, defaultWrapperType) {
	for(let resolver of typeWrapperResolver) {
		let wrapperType = resolver(type);
		if(wrapperType)
			return wrapperType
	}
	return defaultWrapperType;
}

module.exports = {
	library,
	resolveSimpleType, type: resolveSimpleType,
	resolveActivatorType,
	registerTypeWrapperResolver, resolveTypeWrapper
};
