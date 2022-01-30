const assert = require("assert"),
	_ = require("underscore");

const { registerBuilderMixin, createBuilderForInstance, registerTypeBuilderMixin, getBuilderForType } = require("./builder");
const { wrapType } = require("../wrappers");
const { iterableFirst } = require("../utils");

function mixinInjectFactoryTargetSlot(base) {
	class InjectFactoryTargetSlot extends base {
		constructor(obj, builderParams) {
			super(obj, builderParams);
			if(!this.builderParams.factoryTargetSlot)
				this.builderParams.factoryTargetSlot = this;
		}
	}
	return InjectFactoryTargetSlot;
}

function mixinFactoryExtensions(base) {
	class FactoryExtensions extends base {
		get factoryTargetSlot() {
			assert(this.builderParams.factoryTargetSlot);
			return this.builderParams.factoryTargetSlot;
		}

		component(type, obj) {
			return this.factoryTargetSlot.attachComponent(type, obj);
		}

		slot(obj) {
			return this.factoryTargetSlot.addSlot(obj);
		}

		instance(type, obj) {
			type = getBuilderForType(type);
			return type.createInstance(obj, this);
		}

		primitive(type, obj) {
			type = getBuilderForType(type);
			assert(type.isNeosPrimitive);
			return type.createInstance(obj, this);
		}
	}
	return FactoryExtensions;
}

function mixinContentType(base) {
	let contentType = wrapType("IElementContent<T>", ["T"]).isAssignableFrom(base).get("T");
	assert(contentType);

	class ContentType extends base {
		static get contentType() {
			return contentType;
		}
	}
	return ContentType;
}

function mixinCastExtensions(base) {
	class CastExtensions extends base {
		asIElementContent(contentType) {
			if(this.isTypeInstance) {
				if(this.type.isNeosPrimitive) {
					return this.component(wrapType("ValueRegister<T>", ["T"]).makeGenericType([ this.type ]))
						.assign("Value", this)
						.asIElementContent(contentType);
				} else if(this.type.isLogixNode) {
					if(this.nodeOutputs.size === 1) {
						let firstOutput = iterableFirst(this.nodeOutputs.values());
						if(firstOutput !== this)
							return firstOutput.asIElementContent(contentType);
					}
				}

				if(!this.type.contentType)
					throw new Error(`cannot cast ${this.type} to IElementContent<T>`);

				if(!contentType) // already IElementContent<T>
					return this;

				if(!this.contentType.equals(contentType))
					throw new Error(`cannot cast ${this.type} (IElementContent<${this.contentType}>) to IElementContent<${contentType}>`);
			} else if(this.isInstanceField) {
				if(!this.fieldType.contentType)
					throw new Error(`cannot cast field of type ${this.fieldType} to IElementContent<T>`);

				if(!contentType) // already IElementContent<T>
					return this;

				if(!this.fieldType.contentType.equals(contentType))
					throw new Error(`cannot cast field of type ${this.fieldType} (IElementContent<${this.fieldType.contentType}>) to IElementContent<${contentType}>`);
			}
			throw new Error(`cannot cast ${this} to IElementContent<T>`);
		}
	}
	return CastExtensions;
}

registerTypeBuilderMixin(wrappedType => {
	if(wrapType("Slot").isAssignableFrom(wrappedType))
		wrappedType = mixinInjectFactoryTargetSlot(wrappedType);
	if(wrapType("IElementContent<T>", ["T"]).isAssignableFrom(wrappedType))
		wrappedType = mixinContentType(wrappedType);
	return wrappedType;
});
registerBuilderMixin(mixinFactoryExtensions);
registerBuilderMixin(mixinCastExtensions);
