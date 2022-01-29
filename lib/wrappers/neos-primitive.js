const { wrapBaseType, registerTypeWrapper } = require("./type");
const { isNeosPrimitive } = require("../neos-types");

function wrapNeosPrimitiveType(inner) {
	class NeosPrimitive extends wrapBaseType(inner) {
		static get isNeosPrimitive() {
			return true;
		}
	}
	return NeosPrimitive;
}

registerTypeWrapper(inner => {
	if(isNeosPrimitive(inner))
		return wrapNeosPrimitiveType(inner);
});
