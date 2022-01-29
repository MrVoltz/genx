const { NativeTypeWrapper } = require("../neos-types");

function makeProxyMembers(builder, wrapperType) {
	_.each(Object.getOwnPropertyDescriptors(wrapperType.prototype), (desc, name) => {
		if(name in builder.prototype)
			continue;
		if(desc.get)
			desc.get = function proxiedGetter() {
				return this.inner[name];
			};
		if(desc.set)
			desc.set = function proxiedValue(value) {
				this.inner[name] = value;
			};
		if(desc.value && typeof desc.value === "function")
			desc.value = function proxiedFunction() {
				return this.inner[name].apply(this.inner, arguments);
			};
		Object.defineProperty(builder.prototype, name, desc);
	});
}

class Builder {
	constructor(inner) {
		this.inner = inner;
	}

	get type() {
		return this.inner.type;
	}
}
makeProxyMembers(Builder, NativeTypeWrapper);

class WorkerBuilder extends Builder {
	constructor(inner) {
		super(inner);
	}

	get(name) {
		let member = this.inner.get(name);
		if(member instanceof NativeTypeWrapper)
			return createBuilder(member);
		return member;
	}
}
makeProxyMembers(WorkerBuilder, Worker);

function createBuilder() {

}
