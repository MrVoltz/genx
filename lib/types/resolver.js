
const searchNamespaces = [ "FrooxEngine", "BaseX" ];

function parseSimpleType(str, resolveCallback) {
	str = str.replace(/ /g, "");
	let inputStr = str;

	function error(msg) {
		throw new Error(`Failed to parse type "${inputStr}": ${msg} at position ${inputStr.length-str.length}.`);
	}
	function lookAhead(s) {
		return str.slice(0, s.length) === s;
	}
	function compare(s) {
		if(str.slice(0, s.length) !== s)
			error(`expected ${s}, got ${str.slice(0, s.length)}`);
		str = str.slice(s.length);
	}

	function readType() {
		let namespacedName = str.match(/^[^<>,]+/)[0];
		compare(namespacedName);

		let genericArguments = lookAhead("<") ? readGenericArgs() : []
		if(lookAhead("["))
			error(`array types are not supported`);

		return resolveCallback(namespacedName, genericArguments);
	}

	function readGenericArgs() {
		let res = [];
		compare("<");
		while(!lookAhead(">")) {
			if(res.length)
				compare(",");
			res.push(readType());
		}
		compare(">");
		return res;
	}

	return readType();
}

function resolveNamespacedType(namespacedName, resolvedGenericArguments) {
	let res = typeAliases.get(namespacedName);
	if(res)
		return res;

	if(resolvedGenericArguments.length && namespacedName.indexOf("`") === -1)
		namespacedName += "`" + resolvedGenericArguments.length;

	let type = typesByNamespacedName.get(namespacedName);
	if(!type) {
		for(let ns of searchNamespaces) {
			type = typesByNamespacedName.get(ns + "." + namespacedName);
			if(type)
				break;
		}
	}

	if(!type) {
		let parts = namespacedName.split("."),
			candidateTypes = types.filter(t => t.name.toLowerCase() === parts[parts.length-1].toLowerCase());

		let msg = `Failed to resolve type "${namespacedName}".`;
		if(candidateTypes.length)
			msg += ` Did you mean ${candidateTypes.slice(0, 3).map(getNamespacedName).join(" or ")}?`
		throw new Error(msg);
	}

	namespacedName = getNamespacedName(type);
	if(type.genericParameters.length !== resolvedGenericArguments.length)
		throw new Error(`Failed to resolve type "${namespacedName}": expected ${type.genericParameters.length} generic arguments, but got ${resolvedGenericArguments.length}.`);

	return {
		location: type.location,
		name: type.name,
		kind: type.kind,
		genericArguments: resolvedGenericArguments
	};
}

function type(str) {
	return parseSimpleType(str, resolveNamespacedType);
}

console.log(type("IAssetProvider<Animation>"));
console.log(type("LogiX.Cast.CastClass<int,int>"));
console.log(type("CastClass<int,int>"));
console.log(type("IAssetProvider<T>", ["T"]));
