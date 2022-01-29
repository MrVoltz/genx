const { createInstance } = require("./wrappers");

function createAssetSlot(components) {
	return createInstance("Slot", {
		Components: {
			Data: components || []
		}
	});
}

class NeosObject {
	constructor(obj) {
		this.obj = obj || {};
	}

	get rootSlot() {
		if(!this._rootSlot)
			this._rootSlot = createInstance("Slot", this.obj.Object || {});
		return this._rootSlot;
	}

	get assetsSlot() {
		if(!this._assetsSlot)
			this._assetsSlot = createAssetSlot(this.obj.Assets);
		return this._assetsSlot;
	}

	get dependenciesSlot() {
		if(!this._dependenciesSlot)
			this._dependenciesSlot = createAssetSlot(this.obj.Dependencies);
		return this._dependenciesSlot;
	}

	toJSON() {
		this.obj.Object = this.rootSlot.toJSON();
		this.obj.Assets = this.assetsSlot.toJSON().Components.Data;

		this.obj.Dependencies = this.dependenciesSlot.toJSON().Components.Data;
		if(!this.obj.Dependencies.length)
			delete this.obj.Dependencies;
		return this.obj;
	}
}

function createObject(obj) {
	return new NeosObject(obj || {});
}

module.exports = { NeosObject, createObject };
