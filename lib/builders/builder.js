const { wrapType, wrapField } = require("../wrappers");
const { registerFieldWrapper } = require("../wrappers/field");

function mixinBaseBuilder(base) {
	class BaseBuilder extends base {
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
		for(let mixin of typeBuilderMixins)
			typeBuilder = mixin(typeBuilder);
		typeBuilderCache.set(wrappedType, typeBuilder);
	}
	return typeBuilder;
}

const fieldBuilderCache = new Map;
function getBuilderForField(wrappedField) {
	wrappedField = wrapType(wrappedField);
	let fieldBuilder = fieldBuilderCache.get(wrappedField);
	if(!fieldBuilder) {
		fieldBuilder = wrappedField;
		for(let mixin of fieldBuilderMixins)
			fieldBuilder = mixin(fieldBuilder);
		fieldBuilderCache.set(wrappedField, fieldBuilder);
	}
	return fieldBuilder;
}

function createBuilderForInstance(inst, builderParams) {
	assert(inst.isTypeInstance);
	if(inst.isTypeBuilderInstance)
		return inst;

	let builder = getBuilderForType(inst.type);
	return new builder(inst.toJSON(), builderParams);
}

function createBuilderForInstanceField(instField, builderParams) {
	assert(instField.isInstanceField);
	if(instField.isFieldBuilderInstance)
		return instField;

	let builder = getBuilderForField(instField.field);
	return new builder(instField.toJSON(), builderParams);
}

registerBuilderMixin(mixinBaseBuilder);
registerTypeBuilderMixin(mixinTypeBuilder);
registerFieldBuilderMixin(mixinFieldBuilder);

module.exports = {
	registerTypeBuilderMixin, registerFieldWrapper,
	getBuilderForType, getBuilderForField,
	createBuilderForInstance, createBuilderForInstanceField
};
