const { registerTypeWrapper } = require("./type");
const { wrapWorkerType } = require("./worker");
const { type } = require("../neos-types");

function wrapSlotType(inner) {
	class Slot extends wrapWorkerType(inner) {
		static _shouldSaveMember(member) {
			return member !== this.get("Parent");
		}

		constructor(obj) {
			super(obj);
			this.children = (this.obj.Children || []).map(obj => new Slot(obj));
		}

		addSlot(obj) {
			if(_.isString(obj)) {
				let slot = this.addSlot();
				slot.get("Name").assign(obj);
				return slot;
			}
			let slot = new Slot(obj);
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
	return Slot;
}

function wrapComponentType(inner) {
	class Component extends wrapWorkerType(inner) {
		static get categories() {
			// if(!this._categories)
			// 	field.customAttributes.findByType(type("NameOverride"));
		}
	}
}

registerTypeWrapper(inner => {
	if(type("Slot").isAssignableFrom(inner))
		return wrapSlotType(inner);
	if(type("Component").isAssignableFrom(inner))
		return wrapComponentType(inner);
});


// function createAssetSlot(components) {
// 	return createWorker("Slot", {
// 		Components: {
// 			Data: components || []
// 		}
// 	});
// }

// class NeosObject {
// 	constructor(obj={}) {
// 		this.obj = obj;
// 	}

// 	get rootSlot() {
// 		if(!this._rootSlot)
// 			this._rootSlot = createWorker("Slot", this.obj.Object || {});
// 		return this._rootSlot;
// 	}

// 	get assetsSlot() {
// 		if(!this._assetsSlot)
// 			this._assetsSlot = createAssetSlot(this.obj.Assets);
// 		return this._assetsSlot;
// 	}

// 	get dependenciesSlot() {
// 		if(!this._dependenciesSlot)
// 			this._dependenciesSlot = createAssetSlot(this.obj.Dependencies);
// 		return this._dependenciesSlot;
// 	}

// 	toJSON() {
// 		this.obj.Object = this.rootSlot.toJSON();
// 		this.obj.Assets = this.assetsSlot.toJSON().Components.Data;

// 		this.obj.Dependencies = this.dependenciesSlot.toJSON().Components.Data;
// 		if(!this.obj.Dependencies.length)
// 			delete this.obj.Dependencies;
// 		return this.obj;
// 	}
// }

// function createObject(obj) {
// 	return new NeosObject(obj || {});
// }
