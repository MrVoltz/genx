const _ = require("underscore");

const { Worker } = require("./worker");
const { type, registerTypeWrapperResolver, resolveTypeWrapper } = require("./neos-types");

class Slot extends Worker {
	constructor(type, obj={}) {
		super(type, obj);
		this.children = (this.obj.Children || []).map(obj => new Slot(obj));
	}

	_shouldSaveMember(member, name) {
		return name !== "Parent";
	}

	addSlot(obj={}) {
		if(_.isString(obj)) {
			let slot = this.addSlot();
			slot.get("Name").assign(obj);
			return slot;
		}
		let slot = createWorker(type("Slot"), obj);
		this.children.push(slot);
		return slot;
	}

	attachComponent(componentType, obj) {
		return this.get("Components").attachWorker(componentType, obj);
	}

	toJSON() {
		this.obj = super.toJSON();
		this.obj.Children = this.children.map(child => child.toJSON());
		this.obj.ParentReference = this.get("Parent").refId;
		return this.obj;
	}
}

class Component extends Worker {
	constructor(type, obj={}) {
		super(type, obj);
	}
}

// class NeosObject {

// }

registerTypeWrapperResolver((nativeType) => {
	if(type("Slot").isAssignableFrom(nativeType))
		return Slot;
	if(type("Component").isAssignableFrom(nativeType))
		return Component;
});

module.exports = { Slot, Component };
