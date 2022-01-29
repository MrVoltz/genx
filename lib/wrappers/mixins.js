const assert = require("assert");

const { generateGuid } = require("../utils");
const { type } = require("../neos-types");

function mixinIWorldElement(base) {
	class IWorldElement extends base {
		static get isIWorldElement() {
			return true;
		}

		constructor(obj) {
			super(obj || {});
			if(!this.obj.ID)
				this.obj.ID = generateGuid();
		}

		get refId() {
			return this.obj.ID;
		}
	}
	return IWorldElement;
}

// TODO: maybe remove
function mixinMember(base) {
	class Member extends base {
		static get isMember() {
			return true;
		}
	}
	return Member;
}

function mixinISyncMember(base) {
	class ISyncMember extends base {
		static get isNonPersistentMember() {
			if(this.inner.customAttributes.findByType(type("NonPersistent")))
				return true;
			if(this.inner.customAttributes.findByType(type("DontCopy")))
				return true;
			return false;
		}

		static get syncMemberName() {
			let nameOverride = this.inner.customAttributes.findByType(type("NameOverride"));
			if(nameOverride)
				return nameOverride.constructorArguments[0].value;
			return this.inner.name;
		}
	}
	return ISyncMember;
}

function mixinISyncCollection(base) {
	class ISyncCollection extends base {
		static get collectionType() {
			throw new Error("collectionType not implemented");
		}

		static get itemType() {
			if(!this._itemType) {
				let map = this.collectionType.isAssignableFrom(this.type);
				assert(map);
				this._itemType = map.get("T");
			}
			return this._itemType;
		}

		addItem(item) {
			if(!this.field.itemType.isAssignableFrom(item.type))
				throw new Error(`cannot add item of type ${item.type} to ${this.field}`);
			this.items.push(item);
		}
	}
	return ISyncCollection;
}

module.exports = { mixinIWorldElement, mixinMember, mixinISyncMember, mixinISyncCollection };
