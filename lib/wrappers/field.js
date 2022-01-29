const { wrapType } = require("./type");

function wrapBaseField(inner) {
	class Field {
		static get isWrappedField() {
			return true;
		}

		static get inner() {
			return inner;
		}

		static get type() {
			if(!this._type)
				this._type = wrapType(this.inner.type);
			return this._type;
		}

		static get name() {
			return this.inner.name;
		}

		constructor(obj) {
			this.obj = obj;
		}

		get isInstanceField() {
			return true;
		}

		get field() {
			return this.constructor;
		}

		get fieldType() {
			return this.field.type;
		}

		toJSON() {
			return this.obj;
		}
	}
	return Field;
}

const fieldWrappers = [];
function registerFieldWrapper(wrapper) {
	fieldWrappers.unshift(wrapper);
}

function wrapField(inner) {
	for(let wrapper of fieldWrappers) {
		let wrappedField = wrapper(inner);
		if(wrappedField)
			return wrappedField;
	}
	throw new Error(`Failed to wrap field "${inner}"`);
}

registerFieldWrapper(wrapBaseField);

module.exports = { wrapField, wrapBaseField, registerFieldWrapper };
