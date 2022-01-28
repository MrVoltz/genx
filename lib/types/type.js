const _ = require("underscore"),
	assert = require("assert"),
	util = require("util");

function isGenericParameter(ref) {
	return _.isString(ref);
}

function genericArgumentsEqual(a, b) {
	if(isGenericParameter(a) || isGenericParameter(b))
		return a === b;
	return a.equals(b);
}

function mixinCustomAttributes(base) {
	class CustomAttributes extends base {
		get customAttributes() {
			if(!this._customAttributes)
				this._customAttributes = new CustomAttributeBag(this.library, this.obj.customAttributes || []);
			return this._customAttributes;
		}
	}
	return CustomAttributes;
}

// genericArguments - what is plugged into the definition
// genericParameters - what is exposed to outside

/** Immutable class, which holds type name and its generic arguments.
 * For example FrooxEngine.IAssetProvider<Animation> or FrooxEngine.SyncRef<T>. */
class TypeReference {
	constructor(library, { name, location, genericArguments, genericParameters }) {
		this.library = library;
		this.name = name;
		this.location = location || [];

		this.obj = { name, location, genericArguments, genericParameters };
	}

	get assemblyName() {
		let rootNamespace = this.location[0].split(".")[0];
		return rootNamespace === "System" ? null : rootNamespace;
	}

	get namespacedName() {
		if(this.location.length > 1) // nested class
			return [ this.location.slice(0, 2).join("."), ...this.location.slice(2), this.name ].join("+");
		return [ ...this.location, this.name ].join(".");
	}

	get definition() {
		if(!this._definition)
			this._definition = this.library.findTypeByNamespacedName(this.namespacedName);
		return this._definition;
	}

	get kind() {
		return this.definition ? this.definition.kind : null;
	}

	get enumNames() {
		return this.definition.enumNames;
	}

	get genericParameters() {
		if(this.obj.genericParameters)
			return this.obj.genericParameters;
		if(!this.genericArguments.length)
			return [];
		if(!this._genericParameters) {
			var genericParameters = [];
			function addGenericParameters(params) {
				for(let param of params)
					if(genericParameters.indexOf(param) === -1)
						genericParameters.push(param);
			}

			for(let arg of this.genericArguments) {
				if(isGenericParameter(arg))
					addGenericParameters([arg]);
				else
					addGenericParameters(arg.genericParameters);
			}
			console.log(`inferring genericParameters for ${this.namespacedName}: `, genericParameters);
			this._genericParameters = genericParameters;
		}
		return this._genericParameters;
	}

	get genericArguments() {
		if(!this._genericArguments)
			this._genericArguments = (this.obj.genericArguments || []).map(a => this.library.createTypeReference(a));
		return this._genericArguments;
	}

	get _genericArgumentMap() {
		if(!this.__genericArgumentMap) {
			const map = new Map;
			for(let i = 0; i < this.definition.genericParameters.length; i++)
				map.set(this.definition.genericParameters[i], this.genericArguments[i]);
			this.__genericArgumentMap = map;
		}
		return this.__genericArgumentMap;
	}

	get baseType() {
		if(!this.definition)
			return null;
		if(this.namespacedName === "System.Object" || !this.definition.baseType)
			return null;

		// plug our arguments into baseType, genericParameters will be inferred
		return this.definition.baseType.makeGenericType(this._genericArgumentMap);
	}

	get fields() {
		if(!this.definition)
			return [];
		if(!this._fields)
			this._fields = this.definition.fields.map(field => field.makeGenericType(this._genericArgumentMap));
		return this._fields;
	}

	get properties() {
		if(!this.definition)
			return [];
		if(!this._properties)
			this._properties = this.definition.properties.map(prop => prop.makeGenericType(this._genericArgumentMap));
		return this._properties;
	}

	get methods() {
		if(!this.definition)
			return [];
		if(!this._methods)
			this._methods = this.definition.methods.map(method => method.makeGenericType(this._genericArgumentMap));
		return this._methods;
	}

	get interfaces() {
		if(!this.definition)
			return [];
		if(!this._interfaces)
			this._interfaces = this.definition.interfaces.map(iface => iface.makeGenericType(this._genericArgumentMap));
		return this._interfaces;
	}

	makeGenericType(genericArguments, genericParameters) {
		let genericArgumentMap;
		if(genericArguments instanceof Map) {
			genericArgumentMap = genericArguments;
			for(let param of this.genericParameters)
				assert(genericArgumentMap.has(param), `missing generic parameter: ${param}`);
		} else {
			assert.equal(this.genericParameters.length, genericArguments.length);
			genericArgumentMap = new Map;
			for(let i = 0; i < this.genericParameters.length; i++)
				genericArgumentMap.set(this.genericParameters[i], genericArguments[i]);
		}

		if(!this.genericParameters.length)
			return this;

		genericArguments = this.genericArguments.map(arg => {
			if(isGenericParameter(arg))
				return genericArgumentMap.get(arg);
			return arg.makeGenericType(genericArgumentMap);
		});
		return this.library.createTypeReference({
			...this.obj,
			genericArguments, genericParameters
		});
	}

	// IElementContent<T>.isAssignableFrom(Add_Int) -> { T: int }
	isAssignableFrom(other) {
		if(other.namespacedName === this.namespacedName)
			return this.mapGenericArguments(other);

		let res;
		if(other.baseType && (res = this.isAssignableFrom(other.baseType)))
			return res;

		for(let iface of other.interfaces) {
			let res = this.isAssignableFrom(iface);
			if(res)
				return res;
		}
		return false;
	}

	mapGenericArguments(other, genericArgumentMap) {
		if(this.namespacedName !== other.namespacedName)
			return false;
		assert(this.genericArguments.length === other.genericArguments.length);
		if(!genericArgumentMap)
			genericArgumentMap = new Map; // this -> other
		for(let i = 0; i < this.genericArguments.length; i++) {
			let a = this.genericArguments[i],
				b = other.genericArguments[i];
			if(isGenericParameter(a)) {
				let mapping = genericArgumentMap.get(a);
				if(mapping && !genericArgumentsEqual(mapping, b))
					return false;
				genericArgumentMap.set(a, b);
			} else if(isGenericParameter(b)) {
				console.log(`${other} is more generic than ${this}`);
				return false;
			} else if(!a.mapGenericArguments(b, genericArgumentMap))
				return false;
		}
		return genericArgumentMap;
	}

	equals(other, ignoreGenericParameters=false) {
		if(ignoreGenericParameters) {
			let forwardMapping = this.mapGenericArguments(other);
			if(!forwardMapping || !_.all(forwardMapping.values(), isGenericParameter))
				return false;
			let reverseMapping = other.mapGenericArguments(this);
			if(!reverseMapping || !_.all(reverseMapping.values(), isGenericParameter))
				return false;
			return true;
		}
		if(this.namespacedName !== other.namespacedName)
			return false;
		assert(this.genericArguments.length === other.genericArguments.length);
		for(let i = 0; i < this.genericArguments.length; i++) {
			let a = this.genericArguments[i],
				b = other.genericArguments[i];
			if(!genericArgumentsEqual(a, b))
				return false;
		}
		return true;
	}

	toSimpleType(simpler=false) {
		let str = simpler ? (this.library.findAliasForType(this) || this.name) : this.namespacedName;
		if(this.genericArguments.length)
			str += "<" + this.genericArguments.map(a => a.toSimpleType(stripNamespace)).join(", ") + ">";
		return str;
	}

	toActivatorType(skipFirstAssembly=false) {
		var str = this.namespacedName;
		if(this.genericArguments.length)
			str += "[" + this.genericArguments.map(a => a.toActivatorType(false)).join(", ") + "]";

		if(skipFirstAssembly || !this.assemblyName)
			return str;
		return `[${str}, ${assemblyName}]`;
	}

	toString() {
		return this.toSimpleType();
	}

	[util.inspect.custom](depth, options, inspect) {
		return options.stylize(`[TypeReference ${this.toSimpleType()}]`, "special");
	}
}

/** Holds metadata about a type. There is a single instance per generic class. */
class TypeDefinition extends mixinCustomAttributes(TypeReference) {
	constructor(library, obj) {
		super(library, obj);
		this._definition = this;

		this.obj = obj;
	}

	get definition() {
		return this;
	}

	get kind() {
		return this.obj.kind || null;
	}

	get enumNames() {
		assert.equal(this.kind, "enum");
		return this.obj.values;
	}

	get genericParameters() {
		return this.obj.genericParameters || [];
	}

	get genericArguments() {
		return this.genericParameters;
	}

	get baseType() {
		if(!this._baseType)
			this._baseType = this.obj.baseType ? this.library.createTypeReference(this.obj.baseType) : null;
		return this._baseType;
	}

	get fields() {
		if(!this._fields)
			this._fields = (this.obj.fields || []).map(obj => new FieldOrProperty(this.library, obj));
		return this._fields;
	}

	get properties() {
		if(!this._properties)
			this._properties = (this.obj.properties || []).map(obj => new FieldOrProperty(this.library, obj));
		return this._properties;
	}

	get methods() {
		if(!this._methods)
			this._methods = (this.obj.methods || []).map(obj => new Method(this.library, obj));
		return this._methods;
	}

	get interfaces() {
		if(!this._interfaces)
			this._interfaces = (this.obj.interfaces || []).map(obj => this.library.createTypeReference(obj));
		return this._interfaces;
	}

	[util.inspect.custom](depth, options, inspect) {
		return options.stylize(`[TypeDefinition ${this.toSimpleType()}]`, "special");
	}
}

class CustomAttributeBag {
	constructor(library, arr) {
		this.library = library;
		this.arr = arr;
	}

	get all() {
		if(!this._all)
			this._all = this.arr.map(obj => new CustomAttribute(this.library, obj));
		return this._all;
	}

	findByType(type) {
		return _.first(this.filterByType(type));
	}

	filterByType(type) {
		return this.all.filter(attr => type.isAssignableFrom(attr.type));
	}
}

class CustomAttribute {
	constructor(library, obj) {
		this.library = library;
		this.obj = obj;
	}

	get attributeType() {
		if(!this._attributeType)
			this._attributeType = this.library.createTypeReference(this.obj.attributeType);
		return this._attributeType;
	}

	get type() {
		return this.attributeType;
	}

	get constructorArguments() {
		if(!this._constructorArguments)
			this._constructorArguments = this.obj.constructorArguments.map(obj => new CustomAttributeConstructorArgument(this, obj));
		return this._constructorArguments;
	}
}

class CustomAttributeConstructorArgument {
	constructor(library, obj) {
		this.library = library;
		this.obj = obj;
	}

	get type() {
		if(!this._type)
			this._type = this.library.createTypeReference(this.obj.type);
		return this._type;
	}

	get value() {
		return this.obj.value;
	}
}

class Member extends mixinCustomAttributes(Object) {
	constructor(library, obj) {
		super();
		this.library = library;
		this.obj = obj;
	}

	get name() {
		return this.obj.name;
	}

	makeGenericType(genericArguments, genericParameters) {
		return this;
	}
}

class FieldOrProperty extends Member {
	get fieldType() {
		if(!this._fieldType)
			this._fieldType = this.library.createTypeReference(this.obj.fieldType);
		return this._fieldType;
	}

	get type() {
		return this.fieldType;
	}

	makeGenericType(genericArguments, genericParameters) {
		return new FieldOrProperty(this.library, {
			...this.obj,
			fieldType: this.fieldType.makeGenericType(genericArguments, genericParameters)
		});
	}
}

class Method extends Member {

}

module.exports = { TypeReference, TypeDefinition, Member, FieldOrProperty, Method, isGenericParameter };
