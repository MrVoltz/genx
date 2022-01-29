const { wrapType } = require("../wrappers");
const { createBuilderForInstanceField, createBuilderForInstance, registerTypeBuilderMixin, registerFieldBuilderMixin } = require("./builder");

function mixinWorkerTypeBuilder(base) {
	class WorkerBuilder extends base {
		get(name) {
			return createBuilderForInstanceField(super.get(name), this.builderParams);
		}
	}
	return WorkerBuilder;
}

function mixinSlotTypeBuilder(base) {
	class SlotBuilder extends base {
		addSlot(obj) {
			return createBuilderForInstance(super.addSlot(obj), this.builderParams);
		}
	}
	return SlotBuilder;
}

registerTypeBuilderMixin(wrappedType => {
	if(wrapType("Worker").isAssignableFrom(wrappedType.inner))
		wrappedType = mixinWorkerTypeBuilder(wrappedType);
	if(wrapType("Slot").isAssignableFrom(wrappedType.inner))
		wrappedType = mixinSlotTypeBuilder(wrappedType);
	return wrappedType;
});

function mixinWorkerBagFieldBuilder(base) {
	class WorkerBagBuilder extends base {
		attachWorker(workerType, obj) {
			return createBuilderForInstance(super.attachWorker(workerType, obj), this.builderParams);
		}
	}
	return WorkerBagBuilder;
}

registerFieldBuilderMixin(wrappedField => {
	if(wrapType("WorkerBag<T>", ["T"]).isAssignableFrom(wrappedField.fieldType))
		wrappedField = mixinWorkerBagFieldBuilder();
	return wrappedField;
});
