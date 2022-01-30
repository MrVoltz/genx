const assert = require("assert");

const { wrapType, wrapField } = require("../wrappers");

function mixinBaseBuilder(base) {
	class BaseBuilder extends base {
		static createInstance(obj, caller) {
			return new this(obj, caller && caller.builderParams);
		}

		constructor(obj, builderParams) {
			super(obj);
			this.builderParams = builderParams || {};
		}
	}
	return BaseBuilder;
}

function mixinTypeBuilder(base) {
	class TypeBuilder extends base {
		static get isTypeBuilder() {
			return true;
		}

		get isTypeBuilderInstance() {
			return true;
		}
	}
	return TypeBuilder;
}

function mixinFieldBuilder(base) {
	class FieldBuilder extends base {
		static get isFieldBuilder() {
			return true;
		}

		static get type() {
			if(!this._type)
				this._type = getBuilderForType(this.inner.type);
			return this._type;
		}

		get isFieldBuilderInstance() {
			return true;
		}
	}
	return FieldBuilder;
}

const typeBuilderMixins = [];
function registerTypeBuilderMixin(mixin) {
	typeBuilderMixins.push(mixin);
}

const fieldBuilderMixins = [];
function registerFieldBuilderMixin(mixin) {
	fieldBuilderMixins.push(mixin);
}

function registerBuilderMixin(mixin) {
	registerTypeBuilderMixin(mixin);
	registerFieldBuilderMixin(mixin);
}

const typeBuilderCache = new Map;
function getBuilderForType(wrappedType) {
	wrappedType = wrapType(wrappedType);
	let typeBuilder = typeBuilderCache.get(wrappedType);
	if(!typeBuilder) {
		typeBuilder = wrappedType;
		for(let mixin of typeBuilderMixins) {
			typeBuilder = mixin(typeBuilder);
			if(!typeBuilder || !typeBuilder.isWrappedType)
				throw new Error(`invalid type builder mixin: ${mixin}`);
		}
		typeBuilderCache.set(wrappedType, typeBuilder);
	}
	return typeBuilder;
}

const fieldBuilderCache = new Map;
function getBuilderForField(wrappedField) {
	wrappedField = wrapField(wrappedField);
	let fieldBuilder = fieldBuilderCache.get(wrappedField);
	if(!fieldBuilder) {
		fieldBuilder = wrappedField;
		for(let mixin of fieldBuilderMixins) {
			fieldBuilder = mixin(fieldBuilder);
			if(!fieldBuilder || !fieldBuilder.isWrappedField)
				throw new Error(`invalid field builder mixin: ${mixin}`);
		}
		fieldBuilderCache.set(wrappedField, fieldBuilder);
	}
	return fieldBuilder;
}

registerBuilderMixin(mixinBaseBuilder);
registerTypeBuilderMixin(mixinTypeBuilder);
registerFieldBuilderMixin(mixinFieldBuilder);

module.exports = {
	registerTypeBuilderMixin, registerFieldBuilderMixin, registerBuilderMixin,
	getBuilderForType, getBuilderForField
};
