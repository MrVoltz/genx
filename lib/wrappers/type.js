const util = require("util"),
	assert = require("assert");

const { type } = require("../neos-types");
const { isGenericParameter } = require("../types/type");

function unwrapGenericArgument(wrapper) {
	if(isGenericParameter(wrapper))
		return wrapper;
	if(wrapper.isWrappedType)
		return wrapper.inner;
	return wrapper;
}

function wrapBaseType(inner) {
	class Type {
		static get isWrappedType() {
			return true;
		}

		static get inner() {
			return inner;
		}

		static get namespacedName() {
			return this.inner.namespacedName;
		}

		static makeGenericType(genericArguments, genericParameters) {
			if(genericArguments instanceof Map) {
				for(let [param, value] of genericArguments.entries())
					genericArguments.set(param, unwrapGenericArgument(value));
			} else
				genericArguments = genericArguments.map(unwrapGenericArgument);
			return wrapType(this.inner.makeGenericType(genericArguments, genericParameters));
		}

		static isAssignableFrom(other) {
			assert(other);
			if(other.isWrappedType)
				other = other.inner;
			let map = this.inner.isAssignableFrom(other);
			if(map) {
				for(let [param, value] of map.entries())
					map.set(param, wrapType(value));
			}
			return map;
		}

		static mapGenericArguments(other) {
			if(other.isWrappedType)
				other = other.inner;
			return this.inner.mapGenericArguments(other);
		}

		static equals(other) {
			if(other.isWrappedType)
				other = other.inner;
			return this.inner.equals(other);
		}

		static toSimpleType(simpler=false) {
			return this.inner.toSimpleType(simpler);
		}

		static toActivatorType(skipFirstAssembly=false) {
			return this.inner.toActivatorType(skipFirstAssembly);
		}

		static toString() {
			return this.toSimpleType();
		}

		static createInstance(obj, caller) {
			return new this(obj);
		}

		static [util.inspect.custom](depth, options, inspect) {
			return options.stylize(`[${this.name} ${this.toSimpleType()}]`, "special");
		}

		constructor(obj) {
			this.obj = obj;
		}

		get isTypeInstance() {
			return true;
		}

		get type() {
			return this.constructor;
		}

		toJSON() {
			return this.obj;
		}

		dump() {
			console.log(util.inspect(this.toJSON(), { depth: Infinity }));
		}
	}
	return Type;
}

const typeWrappers = [];
function registerTypeWrapper(wrapper) {
	typeWrappers.unshift(wrapper);
}

const wrappedTypeCache = new Map;
function wrapType(inner, genericParameters) {
	if(inner.isWrappedType)
		return inner;
	inner = type(inner, genericParameters);
	if(isGenericParameter(inner))
		return inner;

	let cache = wrappedTypeCache.get(inner.namespacedName) || [];
	for(let wrappedType of cache)
		if(wrappedType.equals(inner))
			return wrappedType;

	for(let wrapper of typeWrappers) {
		let wrappedType = wrapper(inner);
		if(wrappedType) {
			cache.push(wrappedType);
			wrappedTypeCache.set(inner.namespacedName, cache);
			return wrappedType;
		}
	}
	throw new Error(`Failed to wrap type "${inner}"`);
}

registerTypeWrapper(wrapBaseType);

module.exports = {
	wrapBaseType,
	registerTypeWrapper,
	wrapType
};
