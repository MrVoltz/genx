const _ = require("underscore");

const { TypeDefinition, TypeReference } = require("./type");

class TypeLibrary {
	constructor() {
		this.types = [];
		this.typesByNamespacedName = new Map;
		this.typesByName = new Map;
		this.typeAliases = new Map;
	}

	loadFromJson(obj) {
		for(let key of [ "enums", "classes", "interfaces" ]) {
			for(let type of obj[key]) {
				type = new TypeDefinition(this, type);

				this.types.push(type);
				this.typesByNamespacedName.set(type.namespacedName, type);

				let list = this.typesByName.get(type.name);
				if(!list)
					this.typesByName.set(type.name, list = []);
				list.push(type);
			}
		}
	}

	loadAliasesFromJson(obj) {
		_.each(obj, (ref, alias) => {
			ref = new TypeReference(this, ref);
			this.typeAliases.set(alias, ref);
		});
	}

	resolveTypeAlias(alias) {
		return this.typeAliases.get(alias);
	}

	findTypeByNamespacedName(namespacedName) {
		return this.typesByNamespacedName.get(namespacedName) || null;
	}

	findTypesByName(name) {
		return this.typesByName.get(name) || [];
	}

	createTypeReference(obj, _definition) {
		return new TypeReference(this, obj, _definition);
	}
}

module.exports = { TypeLibrary };
