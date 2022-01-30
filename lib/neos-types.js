const _ = require("underscore"),
	assert = require("assert");

const { TypeReference } = require("./types/type");
const { TypeLibrary } = require("./types/type-library");

const library = new TypeLibrary;

library.loadFromJson(require("../data/types.json"));
library.loadFromJson(require("../data/types-extra.json"));
library.loadAliasesFromJson(require("../data/type-aliases.json"));

function resolveConflictCallback(library, namespacedName, candidates) {
	const searchLocations = [
		[ "FrooxEngine" ],
		[ "BaseX" ],
		[ "System" ]
	];
	for(let location of searchLocations) {
		for(let candidate of candidates) {
			if(_.isEqual(location, candidate.location))
				return candidate;
		}
	}
	// TODO: make this more intelligent

	throw new Error(`Failed to resolve type "${namespacedName}": multiple matching types found: ${candidates.map(m => m.namespacedName).join(", ")}`);
}

const simpleTypeCache = new Map;
function resolveSimpleType(str, genericParameters) {
	if(str instanceof TypeReference)
		return str;
	assert(_.isString(str));
	let type = simpleTypeCache.get(str);
	if(!type)
		simpleTypeCache.set(str, type = library.resolveSimpleType(str, genericParameters, resolveConflictCallback));
	return type;
}

const activatorTypeCache = new Map;
function resolveActivatorType(str) {
	assert(_.isString(str));
	let type = activatorTypeCache.get(str);
	if(!type)
		activatorTypeCache.set(str, type = library.resolveActivatorType(str));
	return type;
}

const neosPrimitivesObj = require("../data/neos-primitives.json");
const neosPrimitiesByNamespacedName = new Map;
for(let str of neosPrimitivesObj) {
	let type = resolveSimpleType(str);
	neosPrimitiesByNamespacedName.set(type.namespacedName, type);
}
function isNeosPrimitive(type) {
	if(neosPrimitiesByNamespacedName.has(type.namespacedName))
		return true;
	if(type.kind === "enum")
		return true;
	if(resolveSimpleType("IEncodable").isAssignableFrom(type))
		return true;
	return false;
}

module.exports = {
	library,
	resolveSimpleType, type: resolveSimpleType,
	resolveActivatorType, isNeosPrimitive
};
