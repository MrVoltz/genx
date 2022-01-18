const _ = require("underscore"),
	assert = require("assert");

const { indexBy } = require("./utils");

/** Immutable class, which holds type name and its generic arguments.
 * For example FrooxEngine.IAssetProvider<Animation> or FrooxEngine.SyncRef<T>. */
class TypeReference {
	constructor(library, { name, location, genericArguments }, _definition) {
		this.library = library;
		this.name = name;
		this.location = location || [];
		this.genericArguments = genericArguments || [];

		this._definition = _definition;
	}

	get definition() {
		if(!this._definition)
			this._definition = this.library.findTypeByNamespacedName(this.namespacedName);
		return this._definition;
	}

	get namespacedName() {
		return [ ...this.location, this.name ].join(".");
	}

	/** returns true if all generic parameters are bound */
	isBound() {
		return this.definition.genericParameters.length === this.genericArguments.length;
	}

	get kind() {
		return this.definition ? this.definition.kind : null;
	}

	get baseType() {

	}

	get interfaces() {

	}

	get fields() {
		assert(this.isBound(), "");
	}

	get enumNames() {
		return this.definition.enumNames;
	}

	get genericParameters() {

	}
}

/** Holds metadata about a type. There is a single instance per generic class. */
class TypeDefinition extends TypeReference {
	constructor(library, obj) {
		super(library, obj);
		this._definition = this;

		this.obj = obj;
	}

	get definition() {
		return this;
	}

	get kind() {
		return this.obj.kind;
	}

	get enumNames() {
		assert.equal(this.kind, "enum");
		return this.obj.values;
	}

	get fields() {
		if(!this._fields)
			return this._fields = this.obj.fields.map(obj => new FieldOrProperty(this.library, obj));
		return this._fields;
	}

	get properties() {
		if(!this._properties)
			return this._properties = this.obj.properties.map(obj => new FieldOrProperty(this.library, obj));
		return this._properties;
	}

	get methods() {
		if(!this._methods)
			return this._methods = this.obj.methods.map(obj => new Method(this.library, obj));
		return this._methods;
	}
}

class Member {
	constructor(library, obj) {
		this.library = library;
		this.obj = obj;
	}

	get name() {
		return this.obj.name;
	}

	get customAttributes() {

	}
}

class FieldOrProperty extends Member {
	get type() {
		if(!this._type)
			this._type = new TypeReference(this.library, this.obj.type);
		return this._type;
	}
}

class Method extends Member {

}

module.exports = { TypeReference, TypeDefinition, Member, FieldOrProperty, Method };
