const { registerTypeWrapper } = require("./type");
const { wrapWorkerType } = require("./worker");
const { type } = require("../neos-types");

function wrapSlotType(inner) {
	class Slot extends wrapWorkerType(inner) {
		static get isSlot() {
			return true;
		}

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
		static get isComponent() {
			return true;
		}

		static get categories() {
			if(!this._categories) {
				let attr = this.inner.customAttributes.findByType(type("Category"));
				this._categories = attr ? attr.constructorArguments[0].value.map(v => v.value) : [];
			}
			return this._categories;
		}
	}
	return Component;
}

function wrapLogixNodeType(inner) {
	class LogixNode extends wrapComponentType(inner) {
		static get isLogixNode() {
			return true;
		}

		static get nodeName() {
			if(!this._nodeName) {
				let attr = this.inner.customAttributes.findByType(type("NodeName"));
				this._nodeName = attr ? attr.constructorArguments[0].value : this.inner.name;
			}
			return this._nodeName;
		}

		static get nodeOverload() {
			if(!this._nodeOverload) {
				let attr = this.inner.customAttributes.findByType(type("NodeOverload"));
				this._nodeOverload = attr ? attr.constructorArguments[0].value : null;
			}
			return this._nodeOverload;
		}
	}
	return LogixNode;
}

registerTypeWrapper(inner => {
	if(type("Slot").isAssignableFrom(inner))
		return wrapSlotType(inner);
	if(type("LogixNode").isAssignableFrom(inner))
		return wrapLogixNodeType(inner);
	if(type("Component").isAssignableFrom(inner))
		return wrapComponentType(inner);
});
