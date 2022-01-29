const assert = require("assert"),
	 _ = require("underscore");

const { wrapBaseType, registerTypeWrapper } = require("./type");
const { wrapField } = require("./field");
const { mixinIWorldElement, mixinMember } = require("./mixins");
const { type } = require("../neos-types");

function wrapWorkerType(inner) {
	class Worker extends mixinIWorldElement(wrapBaseType(inner)) {
		static get syncMembers() {
			if(!this._syncMembers) {
				this._syncMembers = new Map;
				let inner = this.inner;
				do {
					for(let field of inner.fields) {
						if(!type("ISyncMember").isAssignableFrom(field.type))
							continue;

						let fieldWrapper = wrapField(field);
						this._syncMembers.set(fieldWrapper.syncMemberName, fieldWrapper);
					}
					inner = inner.baseType;
				} while(inner);
			}
			return this._syncMembers;
		}

		static get syncMethods() {
			if(!this._syncMethods) {
				this._syncMethods = new Map;
				let inner = this.inner;
				do {
					for(let method of inner.methods) {
						if(!method.customAttributes.findByType(type("SyncMethod")))
							continue;
						this._syncMethods.set(method.name, wrapSyncMethod(method));
					}
					inner = inner.baseType;
				} while(inner);
			}
			return this._syncMethods;
		}

		static get(name) {
			return this.syncMembers.get(name) || this.syncMethods.get(name);
		}

		static _shouldSaveMember(member) {
			return true;
		}

		get syncMembers() {
			if(!this._syncMembers) {
				this._syncMembers = new Map;
				for(let [name, wrapper] of this.type.syncMembers.entries()) {
					// TODO: OldName
					let obj = this.obj[name];
					if(!obj) {
						let refId = this.obj[name + "-ID"];
						if(refId)
							obj = { ID: refId };
					}
					this._syncMembers.set(name, new wrapper(obj));
				}
			}
			return this._syncMembers;
		}

		get syncDelegates() {
			// TODO
		}

		get(name) {
			return this.syncMembers.get(name); // TODO
		}

		assign(name, value) {
			if(_.isObject(name)) {
				_.each(obj, (value, name) => {
					this.get(name).assign(value);
				});
			} else if(_.isString(name)) {
				this.get(name).assign(value);
			} else
				throw new Error(`expected object or string, got ${typeof name}`);
			return this;
		}

		_shouldSaveMember(memberInstance) {
			return this.type._shouldSaveMember(memberInstance.type);
		}

		toJSON() {
			for(let [name, member] of this.syncMembers.entries()) {
				if(!this._shouldSaveMember(member, name))
					continue;
				if(member.isNonPersistentMember)
					this.obj[name + "-ID"] = member.refId;
				else
					this.obj[name] = member.toJSON();
			}
			return this.obj;
		}
	}
	return Worker;
}

function wrapSyncMethod(inner) {
	class SyncMethod extends mixinMember(Object) {
		static get inner() {
			return inner;
		}

		static get isSyncMethod() {
			return true;
		}

		static get isImpulseTarget() {
			return !!this.inner.customAttributes.findByType(type("ImpulseTarget"));
		}
	}
	return SyncMethod;
}

registerTypeWrapper(inner => {
	if(type("Worker").isAssignableFrom(inner))
		return wrapWorkerType(inner);
});

module.exports = { wrapWorkerType, wrapSyncMethod };
