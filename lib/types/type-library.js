const _ = require("underscore"),
	util = require("util");

const { TypeDefinition, TypeReference, isGenericParameter } = require("./type"),
	{ resolveSimpleType } = require("./resolver");

class TypeLibrary {
	constructor() {
		this.types = [];
		this.typesByNamespacedName = new Map;
		this.typesByName = new Map;
		this.typesByLowercaseName = new Map;
		this.typeAliases = new Map;
		this.inverseTypeAliases = new Map;
	}

	loadFromJson(obj) {
		for(let key of [ "enums", "classes", "interfaces" ]) {
			if(!obj[key])
				continue;

			for(let type of obj[key]) {
				type = new TypeDefinition(this, type);

				this.types.push(type);
				this.typesByNamespacedName.set(type.namespacedName, type);

				let list = this.typesByName.get(type.name);
				if(!list)
					this.typesByName.set(type.name, list = []);
				list.push(type);

				let list2 = this.typesByLowercaseName.get(type.name.toLowerCase());
				if(!list2)
					this.typesByLowercaseName.set(type.name.toLowerCase(), list2 = []);
				list2.push(type);
			}
		}
	}

	loadAliasesFromJson(obj) {
		_.each(obj, (ref, alias) => {
			ref = new TypeReference(this, ref);
			this.typeAliases.set(alias, ref);
			this.inverseTypeAliases.set(ref.namespacedName, alias);
		});
	}

	resolveTypeAlias(alias) {
		return this.typeAliases.get(alias);
	}

	findAliasForType(ref) {
		return this.inverseTypeAliases.get(ref.namespacedName);
	}

	findTypeByNamespacedName(namespacedName) {
		return this.typesByNamespacedName.get(namespacedName) || null;
	}

	findTypesByName(name, caseSensitive = true) {
		if(caseSensitive)
			return this.typesByName.get(name) || [];
		return this.typesByLowercaseName.get(name.toLowerCase()) || [];
	}

	createTypeReference(obj) {
		if(isGenericParameter(obj) || obj instanceof TypeReference)
			return obj;
		return new TypeReference(this, obj);
	}

	resolveSimpleType(str, genericParameters, resolveConflictCallback) {
		return resolveSimpleType(this, str, genericParameters, resolveConflictCallback);
	}

	toString() {
		return `[TypeLibrary(${this.types.length} types, ${this.typeAliases.size} aliases)]`;
	}

	[util.inspect.custom](depth, options, inspect) {
		return options.stylize(this.toString(), "special");
	}
}

module.exports = { TypeLibrary };
