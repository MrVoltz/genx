const assert = require("util");

const { registerBuilderMethod } = require("./builder");

// registerBuilderMethod("castTo", function(newType) {
// 	if(newType.isAssignableFrom(this.type))
// 		return this;

// 	// casting SyncValue to IElementContent<T>

// 	let iec = type("IElementContent<T>", ["T"]).mapGenericArguments(newType);
// 	if(iec) {
// 		let contentType = eic.get("T");
// 		if(this.inner instanceof SyncValue && this.inner.type.equals(contentType)) {
// 			return this.component(type("ValueRegister<T>", ["T"]).makeGenericType([contentType]))
// 				.assign("Value", this.inner);
// 		}
// 	}

// 	throw new Error(`cannot cast ${this.type} to ${newType}`);
// });

registerBuilderMethod("asIElementContent", function(contentType, throwOnFailure) {


});

const dualInputOperators = [
	{ fn: "add", node: "Add", multiNode: "AddMulti" },
	{ fn: "and", node: "AND", multiNode: "AND_Multi" },
	{ fn: "mul", node: "Mul", multiNode: "MulMulti" },
	{ fn: "nand", node: "NAND", multiNode: "NAND_Multi" },
	{ fn: "nor", node: "NOR", multiNode: "NOR_Multi" },
	{ fn: "or", node: "OR", multiNode: "OR_Multi" },
	{ fn: "sub", node: "Sub", multiNode: "SubMulti" },
	{ fn: "xnor", node: "XNOR", multiNode: "XNOR_Multi" },
	{ fn: "xor", node: "XOR", multiNode: "NOR_Multi" },
];
registerBuilderExtension(


_.each(dualInputOperators, desc => {


	registerBuilderMethod(desc.fn, function() {
		let a = this.asIElementContent(null, true);
		let args = _.map(arguments, arg => arg.asIElementContent(a.contentType, true));
		assert(args.length);
		if(args.length === 1) {
			let overload = _.find(getNodeOverloads(desc.node), o => {
				return o.get("A").type.isAssignableFrom(a);
			});
			if(!overload)
				throw new Error(`Cannot find overload of ${desc.node} for ${a.type}`);
			return this.component(overload.type).assign({ A: a, B: args[0] });
		}

		let overload = _.find(getNodeOverloads(desc.multiNode), o => {
			return o.get("Operands").itemType.isAssignableFrom(a);
		});
		if(!overload)
			throw new Error(`Cannot find overload of ${desc.node} for ${a.type}`);
		let comp = this.component(overload.type);

		for(let op of [a, ...args])
			comp.get("Operands").addItem();
		return comp;
	}, function(builder) => {
		return builder.type
	});








		b = this.asIElementContent(a.contentType);
		assert(b);

		return this.component("Add_Int").assign({ A: a, B: b });
	});
});
