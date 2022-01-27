const assert = require("assert");

const { type, resolveActivatorType, registerTypeWrapperResolver, resolveTypeWrapper } = require("./neos-types");
const { Worker, createWorker, SyncMember, mixinMember, registerSyncMemberTypeResolver } = require("./worker");

class SyncObject extends mixinMember(Worker) {
	constructor(type, field, obj={}) {
		super(type, obj.Data);
		this.field = field;
		this.obj = obj;
	}

	toJSON() {
		this.obj.Data = super.toJSON();
		return this.obj;
	}
}

function mixinSyncMemberCollection(base) {
	class SyncMemberCollection extends base {
		get _genericType() {
			throw new Error("_genericType not implemented");
		}

		get itemType() {
			if(!this._itemType) {
				let variants = this._genericType.isAssignableFrom(this.type);
				assert.notEqual(variants.length, 0);
				this._itemType = variants[0].get("T");
			}
			return this._itemType;
		}

		add(item) {
			assert(this.itemType.isAssignableFrom(item.type));
			this.items.push(item);
		}
	}
	return SyncMemberCollection;
}

class SyncElementList extends mixinSyncMemberCollection(SyncMember) {
	constructor(type, field, obj={}) {
		super(type, field, obj);
		this.items = (this.obj.Data || []).map(obj => createSyncMember(this.itemType, this.field, obj));
	}

	get _genericType() {
		return type("SyncElementList<T>", ["T"]);
	}

	toJSON() {
		this.obj.Data = this.items.map(item => item.toJSON());
		return this.obj;
	}
}

class WorkerBag extends mixinSyncMemberCollection(SyncMember) {
	constructor(type, field, obj={}) {
		super(type, field, obj);
		this.items = (this.obj.Data || []).map(obj => {
			return createWorker(resolveActivatorType(obj.Type), obj.Data);
		});
	}

	get _genericType() {
		return type("WorkerBag<T>", ["T"]);
	}

	attachWorker(workerType, obj) {
		workerType = type(workerType);
		let worker = createWorker(workerType, obj);
		this.add(worker);
		return worker;
	}

	toJSON() {
		this.obj.Data = this.items.map(worker => {
			return {
				Type: worker.type.toActivatorType(),
				Data: worker.toJSON()
			};
		});
		return this.obj;
	}
}

registerTypeWrapperResolver((fieldType) => {
	if(type("SyncObject").isAssignableFrom(fieldType))
		return SyncObject;
	if(type("WorkerBag<T>", ["T"]).isAssignableFrom(fieldType))
		return WorkerBag;
	if(type("SyncElementList<T>", ["T"]).isAssignableFrom(fieldType))
		return SyncElementList;
});

module.exports = { SyncObject, SyncElementList, WorkerBag };
