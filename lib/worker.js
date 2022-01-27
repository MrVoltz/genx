const { type, registerTypeWrapperResolver, resolveTypeWrapper } = require("./neos-types");
const { generateGuid } = require("./utils");

function mixinWorldElement(base) {
	class WorldElement extends base {
		_initWorldElement() {
			if(!this.obj.ID)
				this.obj.ID = generateGuid();
		}

		get refId() {
			return this.obj.ID;
		}
	}
	return WorldElement;
}

class Worker extends mixinWorldElement(Object) {
	constructor(type, obj={}) {
		super();
		this.type = type;
		this.obj = obj;
		this._initWorldElement();
	}

	get syncMembers() {
		if(!this._syncMembers) {
			this._syncMembers = new Map;
			let currentType = this.type;
			do {
				for(let field of currentType.fields) {
					if(!type("ISyncMember").isAssignableFrom(field.type))
						continue;

					let name = field.name;
					let nameOverride = field.customAttributes.findByType(type("NameOverride"));
					if(nameOverride)
						name = nameOverride.constructorArguments[0].value;

					// TODO: OldName
					let obj = this.obj[name];
					if(!obj) {
						let refId = this.obj[name + "-ID"];
						if(refId)
							obj = { ID: refId };
					}
					this._syncMembers.set(name, createSyncMember(field.type, field, obj));
				}
				currentType = currentType.baseType;
			} while(currentType);
		}
		return this._syncMembers;
	}

	get syncMethods() {
		if(!this._syncMethods) {
			this._syncMethods = new Map;
			let currentType = this.type;
			do {
				for(let method of currentType.methods) {
					if(!method.customAttributes.findByType(type("SyncMethod")))
						continue;
					this._syncMethods.set(method.name, new SyncMethod(method));
				}
				currentType = currentType.baseType;
			} while(currentType);
		}
		return this._syncMethods;
	}

	get(name) {
		return this.syncMembers.get(name) || this.syncMethods.get(name);
	}

	assign(obj) {
		_.each(obj, (value, name) => {
			this.get(name).assign(value);
		});
		return this;
	}

	_shouldSaveMember(member, name) {
		return true;
	}

	toJSON() {
		for(let [name, member] of this.syncMembers.entries()) {
			if(!this._shouldSaveMember(name, member))
				continue;
			if(member.isNonPersistentMember)
				this.obj[name + "-ID"] = member.refId;
			else
				this.obj[name] = member.toJSON();
		}
		return this.obj;
	}
}

function createWorker(workerType, obj) {
	workerType = type(workerType);
	let wrapperType = resolveTypeWrapper(workerType, Worker);
	return new wrapperType(workerType, obj);
}

function mixinMember(base) {
	class Member extends base {
		get isSyncMethod() {
			return false;
		}

		get isImpulseTarget() {
			return false;
		}

		get isNonPersistentMember() {
			return false;
		}
	}
	return Member;
}

class SyncMethod extends mixinMember(Object) {
	constructor(method) {
		super();
		this.method = method;
	}

	get isSyncMethod() {
		return true;
	}

	get isImpulseTarget() {
		return !!this.method.customAttributes.findByType(type("ImpulseTarget"));
	}
}

class SyncMember extends mixinMember(mixinWorldElement(Object)) {
	constructor(type, field, obj) {
		super();
		this.type = type;
		this.field = field;
		this.obj = obj || {};
		this._initWorldElement();
	}

	// get isSync() {
	// 	return !this.isSyncRef && !!type("Sync<T>", ["T"]).isAssignableFrom(this.type);
	// }

	// get isSyncRef() {
	// 	return !!type("SyncRef<T>", ["T"]).isAssignableFrom(this.type);
	// }

	get isNonPersistentMember() {
		return !!this.field.customAttributes.findByType(type("NonPersistent")) || !!this.field.customAttributes.findByType(type("DontCopy"));
	}

	assign(value) {

	}

	toJSON() {
		return this.obj;
	}
}

function createSyncMember(memberType, field, obj) {
	memberType = type(memberType);
	let wrapperType = resolveTypeWrapper(memberType, SyncMember);
	return new wrapperType(memberType, field, obj);
}

module.exports = { Worker, createWorker, mixinWorldElement, mixinMember, SyncMethod, SyncMember, createSyncMember };
