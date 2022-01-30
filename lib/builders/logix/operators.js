const assert = require("util"),
	_ = require("underscore");

const { registerTypeBuilderMixin } = require("../builder");
const { findLogixNodesByOverload } = require("../../component-library");

function mixinUnaryOperatorExtensions(base) {
	class mixinUnaryOperatorExtensions extends base {

	}

	const unaryOperators = [
		{ fn: "all", overload: "All" },
		{ fn: "any", overload: "Any" },
		{ fn: "cube", overload: "Cube" },
		{ fn: "minusOne", overload: "Dec" },
		{ fn: "decomposedPosition", overload: "Decomposed Position" },
		{ fn: "decomposedRotation", overload: "Decomposed Rotation" },
		{ fn: "decomposedScale", overload: "Decomposed Scale" },
		{ fn: "unpackXY", overload: "Deconstruct2" },
		{ fn: "unpackXYZ", overload: "Deconstruct3" },
		{ fn: "unpackXYZW", overload: "Deconstruct4" },
		{ fn: "unpackRGBA", overload: "Deconstruct4" },
		{ fn: "determinant", overload: "Determinant" },
		{ fn: "divDeltaTime", overload: "DivDeltaTime" },
		{ fn: "getType", nodeType: wrapType("GetType") },
		{ fn: "plusOne", overload: "Inc" },
		{ fn: "inverse", overload: "Inverse" },
		{ fn: "isInfinity", overload: "IsInfinity" },
		{ fn: "isNaN", overload: "IsNaN" },
		{ fn: "isNull", nodeType: wrapType("IsNullNode<T>", ["T"]) },
		{ fn: "magnitude", overload: "Magnitude" },
		{ fn: "mulDeltaTime", overload: "MulDeltaTime" },
		{ fn: "neagte", overload: "Negate" },
		{ fn: "none", overload: "None" },
		{ fn: "normalized", overload: "Normalized" },
		{ fn: "not", overload: "NOT" },
		{ fn: "notNull", nodeType: wrapType("NotNullNode") },
		{ fn: "oneMinus", overload: "OneMinus" },
		{ fn: "reciprocal", overload: "Reciprocal" },
		{ fn: "smoothStep", overload: "SmoothStep" },
		{ fn: "smootherStep", overload: "SmootherStep" },
		{ fn: "sqrMagnitude", overload: "SqrMagnitude" },
		{ fn: "square", overload: "Square" },
		{ fn: "transpose", overload: "Transpose" },
		{ fn: "unpackColumns", overload: "UnpackColumns" },
		{ fn: "unpackNullable", nodeType: wrapType("UnpackNullable<T>", ["T"]) },
		{ fn: "unpackRows", overload: "UnpackRows" },
	];
}

// function mixinDualInputOperatorExtensions(base) {
// 	class DualInputOperatorExtensions extends base {

// 	}

// 	const dualInputOperators = [
// 		{ fn: "add", overload: "Add", multiOverload: "AddMulti" },
// 		{ fn: "and", overload: "AND", multiOverload: "AND_Multi" },
// 		{ fn: "mul", overload: "Mul", multiOverload: "MulMulti" },
// 		{ fn: "nand", overload: "NAND", multiOverload: "NAND_Multi" },
// 		{ fn: "nor", overload: "NOR", multiOverload: "NOR_Multi" },
// 		{ fn: "or", overload: "OR", multiOverload: "OR_Multi" },
// 		{ fn: "sub", overload: "Sub", multiOverload: "SubMulti" },
// 		{ fn: "xnor", overload: "XNOR", multiOverload: "XNOR_Multi" },
// 		{ fn: "xor", overload: "XOR", multiOverload: "NOR_Multi" },
// 		{ fn: "coalesce", nodeType: wrapType("NullCoalesce<T>", ["T"]), multiNodeType: wrapType("MultiNullCoalesce<T>", ["T"]) },
// 		{ fn: "firstNotNull", nodeType: wrapType("NullCoalesce<T>", ["T"]), multiNodeType: wrapType("MultiNullCoalesce<T>", ["T"]) }
// 	];
// 	_.each(dualInputOperators, desc => {
// 		DualInputOperatorExtensions.prototype[desc.fn] = function() {
// 			let a = this.asIElementContent(null);
// 			let args = _.map(arguments, arg => arg.asIElementContent(a.contentType));
// 			assert(args.length);

// 			if(args.length === 1) {
// 				let overload = _.find(findLogixNodesByOverload(desc.overload), o => {
// 					return o.get("A").type.isAssignableFrom(a);
// 				});
// 				if(!overload)
// 					throw new Error(`Cannot find overload of ${desc.overload} for ${a.type}`);
// 				return this.component(overload.type).assign({ A: a, B: args[0] });
// 			}

// 			let overload = _.find(findLogixNodesByOverload(desc.multiOverload), o => {
// 				return o.get("Operands").itemType.isAssignableFrom(a);
// 			});
// 			if(!overload)
// 				throw new Error(`Cannot find overload of ${desc.overload} for ${a.type}`);
// 			let comp = this.component(overload.type);

// 			for(let op of [a, ...args])
// 				comp.get("Operands").addItem();
// 			return comp;
// 		};
// 	});
// 	return DualInputOperatorExtensions;
// }
// registerBuilderMixin(mixinDualInputOperatorExtensions);
