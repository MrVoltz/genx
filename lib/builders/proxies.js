const { wrapType } = require("../wrappers");
const { getBuilderForType, getBuilderForField, registerTypeBuilderMixin, registerFieldBuilderMixin } = require("./builder");

function mixinWorkerTypeBuilder(base) {
	class WorkerBuilder extends base {
		static get syncMembers() {
			if(!this._syncMembers_builders) {
				this._syncMembers_builders = new Map;
				for(let [name, wrapper] of super.syncMembers)
					this._syncMembers_builders.set(name, getBuilderForField(wrapper));
			}
			return this._syncMembers_builders;
		}
	}
	return WorkerBuilder;
}

registerTypeBuilderMixin(wrappedType => {
	if(wrapType("Worker").isAssignableFrom(wrappedType.inner))
		wrappedType = mixinWorkerTypeBuilder(wrappedType);
	return wrappedType;
});

function mixinWorkerBagFieldBuilder(base) {
	class WorkerBagBuilder extends base {
		_createWorker(workerType, obj) {
			workerType = getBuilderForType(workerType);
			return workerType.createInstance(obj, this);
		}
	}
	return WorkerBagBuilder;
}

registerFieldBuilderMixin(wrappedField => {
	if(wrapType("WorkerBag<T>", ["T"]).isAssignableFrom(wrappedField.type))
		wrappedField = mixinWorkerBagFieldBuilder(wrappedField);
	return wrappedField;
});
