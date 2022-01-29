const assert = require("assert"),
	_ = require("underscore");

const { type } = require("../neos-types");
const { wrapBaseField, registerFieldWrapper } = require("./field");
const { wrapType } = require("./type");
const { mixinMember, mixinISyncMember, mixinISyncCollection, mixinIWorldElement } = require("./mixins");
const { isPlainObject } = require("../utils");

function wrapSyncElementField(field) {
	class SyncElement extends mixinISyncMember(mixinMember(mixinIWorldElement(wrapBaseField(field)))) {
		static get isSyncElement() {
			return true;
		}

		static get valueType() {
			// TODO: maybe cache
			let syncType = wrapType("Sync<T>", ["T"]).isAssignableFrom(this.type);
			return syncType && syncType.get("T");
		}

		get value() {
			return this.valueType.createInstance(cloneJsonObj(this.obj.Data));
		}

		assignValueObj(value) {
			this.obj.Data = value;
		}

		_assignNativeValue(obj) {
			let valueType = this.field.valueType;
			if(!valueType || !valueType.isNeosPrimitive)
				throw new Error(`cannot assign native ${value} to ${this.fieldType}`);
			return this.assign(new valueType(obj))
		}

		assign(value) {
			if(!_.isObject(value) || isPlainObject(value)) {
				this._assignNativeValue(value);
			} else if(value.isTypeInstance && value.type.isNeosPrimitive) {
				if(wrapType("RefID").equals(this.field.valueType))
					console.log(`assigning NeosPrimitive to ${this.fieldType}, this may be not intentional`);
				if(!value.type.equals(this.field.valueType))
					throw new Error(`cannot assign ${value.type} to ${this.fieldType}`);
				this.assignValueObj(value.toJSON());
			} else if(value.isInstanceField && value.field.isIWorldElement) {
				let syncRefType = wrapType("SyncRef<T>", ["T"]).isAssignableFrom(this.fieldType);
				if(!syncRefType)
					throw new Error(`cannot assign ${value.fieldType} to non-reference field (${this.fieldType})`);
				if(!syncRefType.get("T").isAssignableFrom(value.fieldType))
					throw new Error(`cannot assign ${value.fieldType} to ${this.fieldType}`);
				this.assignValueObj(value.refId);
			} else
				throw new Error(`cannot assign ${value} to ${this.fieldType}`);
		}
	}
	return SyncElement;
}

// function wrapSyncObjectField(field) {
// 	class SyncObject extends mixinMember(wrapWorkerType(field.type)) {
// 		constructor(obj={}) {
// 			super(obj.Data);
// 		}

// 		toJSON() {
// 			this.obj.Data = super.toJSON();
// 			return this.obj;
// 		}
// 	}
// 	return SyncObject;
// }

// function wrapSyncElementListField(field) {
// 	class SyncElementList extends mixinSyncMemberCollection(wrapSyncMemberField(field)) {
// 		constructor(type, field, obj={}) {
// 			super(type, field, obj);
// 			this.items = (this.obj.Data || []).map(obj => createSyncMember(this.itemType, this.field, obj));
// 		}

// 		get _genericType() {
// 			return type("SyncElementList<T>", ["T"]);
// 		}

// 		toJSON() {
// 			this.obj.Data = this.items.map(item => item.toJSON());
// 			return this.obj;
// 		}
// 	}
// 	return SyncElementList;
// }

function wrapWorkerBagField(inner) {
	class WorkerBag extends mixinISyncCollection(wrapSyncElementField(inner)) {
		static get isWorkerBag() {
			return true;
		}

		static get collectionType() {
			return wrapType("WorkerBag<T>", ["T"]);
		}

		constructor(obj) {
			super(obj);
			this.items = (this.obj.Data || []).map(obj => {
				let workerType = wrapType(resolveActivatorType(obj.Type));
				return new workerType(obj.Data);
			});
		}

		attachWorker(workerType, obj) {
			workerType = wrapType(workerType);
			let worker = new workerType(obj);
			this.addItem(worker);
			return worker;
		}

		toJSON() {
			this.obj.Data = this.items.map(worker => {
				return {
					Type: worker.type.toActivatorType(true),
					Data: worker.toJSON()
				};
			});
			return this.obj;
		}
	}
	return WorkerBag;
}

registerFieldWrapper(inner => {
	// if(type("SyncObject").isAssignableFrom(inner.type))
	// 	return wrapSyncObjectField(inner);
	if(type("WorkerBag<T>", ["T"]).isAssignableFrom(inner.type))
		return wrapWorkerBagField(inner);
	// if(type("SyncElementList<T>", ["T"]).isAssignableFrom(inner.type))
	// 	return wrapSyncElementListField(inner);
	if(type("SyncElement").isAssignableFrom(inner.type))
		return wrapSyncElementField(inner);
});
