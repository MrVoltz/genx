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

	function readType(depth) {
		let namespacedName = str.match(/^[^<>,]+/)[0];
		compare(namespacedName);

		let genericArguments = lookAhead("<") ? readGenericArgs(depth) : []
		if(lookAhead("["))
			error(`array types are not supported`);

		return resolveCallback(namespacedName, genericArguments, depth);
	}

	function readGenericArgs(depth) {
		let res = [];
		compare("<");
		while(!lookAhead(">")) {
			if(res.length)
				compare(",");
			res.push(readType(depth+1));
		}
		compare(">");
		return res;
	}

	return readType(0);
}

function createTypeResolver(library, genericParameters, resolveConflictCallback) {
	return (namespacedName, resolvedGenericArguments, depth) => {
		if(genericParameters.indexOf(namespacedName) !== -1)
			return namespacedName;

		let type;

		type = library.resolveTypeAlias(namespacedName);
		if(!type) {
			if(resolvedGenericArguments.length && namespacedName.indexOf("`") === -1)
				namespacedName += "`" + resolvedGenericArguments.length;

			type = library.resolveTypeAlias(namespacedName);
		}
		if(!type)
			type = library.findTypeByNamespacedName(namespacedName);
		if(!type) {
			let parts = namespacedName.split(/[.+]/),
				simpleName = parts[parts.length-1];

			let candidates = library.findTypesByName(simpleName, false);
			if(candidates.length > 1)
				type = resolveConflictCallback(library, namespacedName, candidates);
			else if(candidates.length === 1)
				type = candidates[0];
		}
		if(!type)
			throw new Error(`Failed to resolve type "${namespacedName}".`);

		if(type.genericParameters.length !== resolvedGenericArguments.length)
			throw new Error(`Failed to resolve type "${namespacedName}": expected ${type.genericParameters.length} generic arguments, but got ${resolvedGenericArguments.length}.`);

		return type.makeGenericType(resolvedGenericArguments, depth === 0 ? genericParameters : null);
	};
}

function defaultResolveConflictCallback(library, namespacedName, candidates) {
	throw new Error(`Failed to resolve type "${namespacedName}": multiple matching types found: ${candidates.map(m => m.namespacedName).join(", ")}`);
}

function resolveSimpleType(library, str, genericParameters, resolveConflictCallback) {
	if(!genericParameters)
		genericParameters = [];
	if(!resolveConflictCallback)
		resolveConflictCallback = defaultResolveConflictCallback;

	return parseSimpleType(str, createTypeResolver(library, genericParameters, resolveConflictCallback));
}

module.exports = { parseSimpleType, resolveSimpleType };
