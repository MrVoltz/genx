const _ = require("underscore");

const { wrapBaseType, registerTypeWrapper } = require("./type");
const { isNeosPrimitive } = require("../neos-types");

function wrapNeosPrimitiveType(inner) {
	class NeosPrimitive extends wrapBaseType(inner) {
		static get isNeosPrimitive() {
			return true;
		}

		constructor(obj) {
			super(obj);
			this._validateObj();
		}

		get nativeValue() {
			return this.obj;
		}

		_validateObj() {
			switch(this.namespacedName) {
				case "System.Boolean":
					this.obj = !!this.obj;
					break;
				case "System.String":
					this.obj = ""+this.obj;
					break;
				case "System.Byte":
				case "System.UInt16":
				case "System.UInt32":
				case "System.UInt64":
				case "System.SByte":
				case "System.Int16":
				case "System.Int32":
				case "System.Int64":
					assert(Number.isInteger(this.obj));
					break;
				case "System.Single":
				case "System.Double":
				case "System.Decimal":
					assert(_.isNumber(this.obj));
					break;
				case "System.DateTime":
					// TODO
					break;
				case "System.TimeSpan":
					// TODO
					break;
				case "System.Uri":
					assert(this.obj === null || (_.isString(this.obj) && this.obj.slice(0, 1) === "@"));
					break;
			}
		}
	}
	return NeosPrimitive;
}

registerTypeWrapper(inner => {
	if(isNeosPrimitive(inner))
		return wrapNeosPrimitiveType(inner);
});
